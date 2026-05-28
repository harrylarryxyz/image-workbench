import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { GenerateImageRequestSchema } from '../lib/shared';
import { TaskEventsService } from './task-events.service';
import { ImageReferenceService } from './image-reference.service';
import { AuditService } from '../auth/audit.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    @InjectQueue('image-generation') private readonly queue: Queue,
    private readonly events: TaskEventsService,
    private readonly refs: ImageReferenceService,
    private readonly audit?: AuditService,
  ) {}

  async createGenerateTask(input: unknown) {
    const request = GenerateImageRequestSchema.parse(input);
    const provider = await this.providers.getDefault();
    const model = request.model || provider.defaultModel;
    const task = await this.prisma.generationTask.create({
      data: {
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: request,
        status: 'QUEUED',
      },
    });
    await this.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model });
    return { id: task.id, status: task.status };
  }

  async createEditTask(input: any) {
    const request = GenerateImageRequestSchema.parse(input);
    const refKeys = await this.refs.assertExistingStorageKeys(Array.isArray(input?.refKeys) ? input.refKeys.map(String) : []);
    const provider = await this.providers.getDefault();
    const model = request.model || provider.defaultModel;
    const params = { ...request, refKeys, maskKey: typeof input?.maskKey === 'string' ? input.maskKey : undefined, editMode: 'reference' };
    const task = await this.prisma.generationTask.create({
      data: {
        type: 'image.edit',
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: params,
        status: 'QUEUED',
      },
    });
    await this.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model, refCount: refKeys.length });
    return { id: task.id, status: task.status, type: task.type };
  }

  async queueStatus() {
    await this.reconcileRunningTasksWithImages();
    await this.requeueStaleLiveTasks();
    const [waiting, active, delayed, failed, completed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getDelayedCount(),
      this.queue.getFailedCount(),
      this.queue.getCompletedCount(),
      this.queue.isPaused(),
    ]);
    await this.failTimedOutRunningTasks();
    const dbCounts = await this.prisma.generationTask.groupBy({ by: ['status'], _count: { status: true } });
    return {
      queue: { waiting, active, delayed, failed, completed, paused },
      database: Object.fromEntries(dbCounts.map((row) => [row.status, row._count.status])),
    };
  }

  async retryTask(id: string) {
    const task = await this.prisma.generationTask.findUnique({ where: { id } });
    if (!task) return { ok: false, error: 'task not found' };
    await this.prisma.generationTask.update({
      where: { id },
      data: {
        status: 'QUEUED',
        errorCode: null,
        errorMessage: null,
        diagnosticsJson: undefined,
        routeJson: undefined,
        elapsedMs: null,
      },
    });
    await this.enqueueTask(id);
    await this.audit?.log('task.retry', 'task', id);
    this.notifyTaskChanged(id);
    return { ok: true, id, status: 'QUEUED' };
  }

  async cancelTask(id: string) {
    const task = await this.prisma.generationTask.findUnique({ where: { id } });
    if (!task) return { ok: false, error: 'task not found' };
    const jobs = await this.queue.getJobs(['waiting', 'delayed', 'prioritized']);
    for (const job of jobs) {
      if (job.data?.taskId === id) await job.remove();
    }
    if (task.status === 'QUEUED') {
      await this.prisma.generationTask.update({ where: { id }, data: { status: 'CANCELLED', errorCode: 'cancelled', errorMessage: 'Task cancelled before execution.' } });
      await this.audit?.log('task.cancel', 'task', id);
      this.notifyTaskChanged(id);
      return { ok: true, id, status: 'CANCELLED' };
    }
    return { ok: false, id, status: task.status, error: 'Only queued tasks can be cancelled safely.' };
  }

  async listFailed() {
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'FAILED' }, orderBy: { updatedAt: 'desc' }, take: 100, include: { images: true, provider: true } });
    return rows.map((task) => this.serializeTask(task, true));
  }

  async metrics() {
    const byStatus = await this.prisma.generationTask.groupBy({ by: ['status'], _count: { status: true }, _avg: { elapsedMs: true } });
    const byModel = await this.prisma.generationTask.groupBy({ by: ['model'], _count: { model: true }, _avg: { elapsedMs: true }, orderBy: { _count: { model: 'desc' } }, take: 20 });
    const images = await this.prisma.imageAsset.aggregate({ _count: { id: true }, _sum: { sizeBytes: true } });
    return { byStatus, byModel, images: { count: images._count.id, sizeBytes: images._sum.sizeBytes ?? 0 } };
  }

  async listRecent() {
    await this.reconcileRunningTasksWithImages();
    const rows = await this.prisma.generationTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { images: true, provider: true },
    });
    return rows.map((task) => this.serializeTask(task));
  }

  async getTask(id: string) {
    const task = await this.prisma.generationTask.findUnique({ where: { id }, include: { images: true, provider: true } });
    return task ? this.serializeTask(task, true) : null;
  }

  streamTaskEvents(id: string, res: Response) {
    return this.events.stream(id, () => this.getTask(id), this.events.closeSignal(res));
  }

  notifyTaskChanged(id: string) {
    this.events.notify(id);
  }

  private async enqueueTask(taskId: string) {
    await this.queue.add('generate', { taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 10_000 }, removeOnComplete: 100, removeOnFail: 200, jobId: `task:${taskId}:${Date.now()}` });
  }

  private async failTimedOutRunningTasks() {
    const cutoff = new Date(Date.now() - 30 * 60_000);
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'RUNNING', updatedAt: { lt: cutoff } }, select: { id: true }, take: 50 });
    for (const row of rows) {
      await this.prisma.generationTask.update({ where: { id: row.id }, data: { status: 'FAILED', errorCode: 'task_timeout', errorMessage: 'Task exceeded the 30 minute running timeout.' } });
      this.notifyTaskChanged(row.id);
    }
  }

  private async requeueStaleLiveTasks() {
    const cutoff = new Date(Date.now() - 5 * 60_000);
    const liveTasks = await this.prisma.generationTask.findMany({
      where: {
        status: { in: ['QUEUED', 'RUNNING'] },
        updatedAt: { lt: cutoff },
      },
      select: { id: true, status: true },
      take: 50,
    });
    if (!liveTasks.length) return;

    const jobs = await this.queue.getJobs(['waiting', 'active', 'delayed', 'prioritized'], 0, 500);
    const queuedTaskIds = new Set(jobs.map((job: any) => job.data?.taskId).filter(Boolean));
    for (const task of liveTasks) {
      if (queuedTaskIds.has(task.id)) continue;
      await this.enqueueTask(task.id);
      if (task.status === 'RUNNING') await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'QUEUED' } });
      this.notifyTaskChanged(task.id);
    }
  }

  private async reconcileRunningTasksWithImages() {
    const rows = await this.prisma.imageAsset.groupBy({
      by: ['taskId'],
      where: { task: { status: 'RUNNING' } },
      _count: { _all: true },
    });
    for (const row of rows) {
      if (!row.taskId || row._count._all < 1) continue;
      await this.prisma.generationTask.update({
        where: { id: row.taskId },
        data: {
          status: 'SUCCEEDED',
          errorCode: null,
          errorMessage: null,
          diagnosticsJson: undefined,
        },
      });
      this.notifyTaskChanged(row.taskId);
    }
  }

  private serializeTask(task: any, includeDetails = false) {
    return {
      id: task.id,
      type: task.type,
      status: task.status,
      provider: task.provider ? {
        id: task.provider.id,
        name: task.provider.name,
        type: task.provider.type.toLowerCase().replace('_', '-'),
        baseUrl: task.provider.baseUrl,
        defaultModel: task.provider.defaultModel,
        apiMode: task.provider.apiMode.toLowerCase(),
      } : null,
      model: task.model,
      prompt: task.prompt,
      params: task.paramsJson,
      route: task.routeJson,
      diagnostics: task.diagnosticsJson,
      errorCode: task.errorCode,
      errorMessage: task.errorMessage,
      elapsedMs: task.elapsedMs,
      images: task.images.map((image: any) => ({
        id: image.id,
        storageKey: image.storageKey,
        assetUrl: `/assets/file?key=${encodeURIComponent(image.storageKey)}`,
        format: image.format,
        sizeBytes: image.sizeBytes,
        width: image.width,
        height: image.height,
        prompt: image.prompt,
        revisedPrompt: image.revisedPrompt,
        createdAt: image.createdAt.toISOString(),
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      ...(includeDetails ? { raw: { paramsJson: task.paramsJson, routeJson: task.routeJson, diagnosticsJson: task.diagnosticsJson } } : {}),
    };
  }
}
