import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { GenerateImageRequestSchema } from '../lib/shared';
import { TaskEventsService } from './task-events.service';
import { ImageReferenceService } from './image-reference.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    @InjectQueue('image-generation') private readonly queue: Queue,
    private readonly events: TaskEventsService,
    private readonly refs: ImageReferenceService,
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
    return { id: task.id, status: task.status };
  }

  async createEditTask(input: any) {
    const request = GenerateImageRequestSchema.parse(input);
    const refKeys = await this.refs.assertExistingStorageKeys(Array.isArray(input?.refKeys) ? input.refKeys.map(String) : []);
    const provider = await this.providers.getDefault();
    const model = request.model || provider.defaultModel;
    const params = { ...request, refKeys, editMode: 'reference' };
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
    return { id: task.id, status: task.status, type: task.type };
  }

  async queueStatus() {
    const [waiting, active, delayed, failed, completed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getDelayedCount(),
      this.queue.getFailedCount(),
      this.queue.getCompletedCount(),
      this.queue.isPaused(),
    ]);
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
      this.notifyTaskChanged(id);
      return { ok: true, id, status: 'CANCELLED' };
    }
    return { ok: false, id, status: task.status, error: 'Only queued tasks can be cancelled safely.' };
  }

  async listRecent() {
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
    await this.queue.add('generate', { taskId }, { attempts: 1, removeOnComplete: 100, removeOnFail: 100, jobId: `task:${taskId}:${Date.now()}` });
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
