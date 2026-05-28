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
import type { RequestContext } from '../auth/request-context';

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

  async createGenerateTask(input: unknown, ctx?: RequestContext) {
    const request = GenerateImageRequestSchema.parse(input);
    const provider = await this.providers.getDefault(ctx);
    const model = request.model || provider.defaultModel;
    const task = await this.prisma.generationTask.create({
      data: {
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: request,
        status: 'QUEUED',
        workspaceId: ctx?.workspaceId,
      },
    });
    await this.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model }, ctx);
    return { id: task.id, status: task.status };
  }

  async createEditTask(input: any, ctx?: RequestContext) {
    const request = GenerateImageRequestSchema.parse(input);
    const refKeys = await this.refs.assertExistingStorageKeys(Array.isArray(input?.refKeys) ? input.refKeys.map(String) : [], ctx);
    const maskKey = typeof input?.maskKey === 'string' && input.maskKey.trim() ? (await this.refs.assertExistingStorageKeys([input.maskKey], ctx))[0] : undefined;
    const provider = await this.providers.getDefault(ctx);
    const model = request.model || provider.defaultModel;
    const maskMode = input?.maskMode === 'provider-transparent-edit' ? 'provider-transparent-edit' : input?.maskMode === 'painted-area' ? 'painted-area' : undefined;
    const params = { ...request, refKeys, maskKey, maskMode, editMode: 'reference' };
    const task = await this.prisma.generationTask.create({
      data: {
        type: 'image.edit',
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: params,
        status: 'QUEUED',
        workspaceId: ctx?.workspaceId,
      },
    });
    await this.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model, refCount: refKeys.length }, ctx);
    return { id: task.id, status: task.status, type: task.type };
  }

  async queueStatus(ctx?: RequestContext) {
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
    const dbCounts = await this.prisma.generationTask.groupBy({ by: ['status'], where: ctx ? { workspaceId: ctx.workspaceId } : undefined, _count: { status: true } });
    return {
      queue: { waiting, active, delayed, failed, completed, paused },
      database: Object.fromEntries(dbCounts.map((row) => [row.status, row._count.status])),
    };
  }

  async retryTask(id: string, overrides: any = {}, ctx?: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
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
        paramsJson: Object.keys(overrides ?? {}).length ? { ...((task.paramsJson as any) ?? {}), ...overrides } : task.paramsJson,
        prompt: overrides?.prompt ? String(overrides.prompt) : task.prompt,
        model: overrides?.model ? String(overrides.model) : task.model,
      },
    });
    await this.enqueueTask(id);
    await this.audit?.log('task.retry', 'task', id, undefined, ctx);
    this.notifyTaskChanged(id);
    return { ok: true, id, status: 'QUEUED' };
  }

  async bulkRetryFailed(overrides: any = {}, ctx?: RequestContext) {
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'FAILED', ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, select: { id: true }, take: 100 });
    const retried = [];
    for (const row of rows) retried.push(await this.retryTask(row.id, overrides, ctx));
    return { retried: retried.length, ids: retried.map((x: any) => x.id) };
  }

  async forceStopTask(id: string, ctx?: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!task) return { ok: false, error: 'task not found' };
    const jobs = await this.queue.getJobs(['waiting', 'active', 'delayed', 'prioritized']);
    for (const job of jobs) if (job.data?.taskId === id) await job.remove().catch(() => undefined);
    await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'FAILED', errorCode: 'force_stopped', errorMessage: 'Task force-stopped by operator.' } });
    await this.audit?.log('task.force_stop', 'task', id, undefined, ctx);
    this.notifyTaskChanged(id);
    return { ok: true, id, status: 'FAILED' };
  }

  async diagnosticPackage(id: string, ctx?: RequestContext) {
    const task = await this.getTask(id, ctx);
    if (!task) return null;
    const suggestion = this.suggestFix(task);
    return { task, suggestion, copiedAt: new Date().toISOString() };
  }

  private suggestFix(task: any) {
    const msg = `${task.errorCode ?? ''} ${task.errorMessage ?? ''}`.toLowerCase();
    if (msg.includes('auth') || msg.includes('401')) return '检查 provider API key、baseUrl 和 WORKBENCH_ADMIN_TOKEN。';
    if (msg.includes('timeout')) return '降低 quality/size/count 或提高 timeoutSec 后重试。';
    if (msg.includes('transparent')) return '该模型不支持 transparent background，切换 gpt-image-1.5 或改为 auto。';
    if (msg.includes('rate') || msg.includes('429')) return 'Provider 限流，等待后重试或切换 provider。';
    return '查看 route/diagnostics，优先确认模型能力、API mode、size/quality/format 是否匹配。';
  }

  async cancelTask(id: string, ctx?: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!task) return { ok: false, error: 'task not found' };
    const jobs = await this.queue.getJobs(['waiting', 'delayed', 'prioritized']);
    for (const job of jobs) {
      if (job.data?.taskId === id) await job.remove();
    }
    if (task.status === 'QUEUED') {
      await this.prisma.generationTask.update({ where: { id }, data: { status: 'CANCELLED', errorCode: 'cancelled', errorMessage: 'Task cancelled before execution.' } });
      await this.audit?.log('task.cancel', 'task', id, undefined, ctx);
      this.notifyTaskChanged(id);
      return { ok: true, id, status: 'CANCELLED' };
    }
    return { ok: false, id, status: task.status, error: 'Only queued tasks can be cancelled safely.' };
  }

  async listFailed(ctx?: RequestContext) {
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'FAILED', ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, orderBy: { updatedAt: 'desc' }, take: 100, include: { images: true, provider: true } });
    return rows.map((task) => this.serializeTask(task, true));
  }

  async metrics(ctx?: RequestContext) {
    const where = ctx ? { workspaceId: ctx.workspaceId } : undefined;
    const byStatus = await this.prisma.generationTask.groupBy({ by: ['status'], where, _count: { status: true }, _avg: { elapsedMs: true } });
    const byModel = await this.prisma.generationTask.groupBy({ by: ['model'], where, _count: { model: true }, _avg: { elapsedMs: true }, orderBy: { _count: { model: 'desc' } }, take: 20 });
    const images = await this.prisma.imageAsset.aggregate({ where, _count: { id: true }, _sum: { sizeBytes: true } });
    const failed = byStatus.find((row) => row.status === 'FAILED')?._count.status ?? 0;
    const total = byStatus.reduce((sum, row) => sum + row._count.status, 0);
    return { byStatus, byModel, images: { count: images._count.id, sizeBytes: images._sum.sizeBytes ?? 0 }, cost: { estimatedUsd: byStatus.reduce((sum, row) => sum + (row.status === 'SUCCEEDED' ? row._count.status * 0.04 : 0), 0) }, quality: { failureRate: total ? failed / total : 0 } };
  }

  async listRecent(ctx?: RequestContext) {
    await this.reconcileRunningTasksWithImages();
    const rows = await this.prisma.generationTask.findMany({
      where: ctx ? { workspaceId: ctx.workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { images: true, provider: true },
    });
    return rows.map((task) => this.serializeTask(task));
  }

  async getTask(id: string, ctx?: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, include: { images: true, provider: true } });
    return task ? this.serializeTask(task, true) : null;
  }

  streamTaskEvents(id: string, res: Response, ctx?: RequestContext) {
    return this.events.stream(id, () => this.getTask(id, ctx), this.events.closeSignal(res));
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
        thumbnailUrl: image.thumbnailKey ? `/assets/file?key=${encodeURIComponent(image.thumbnailKey)}` : undefined,
        format: image.format,
        sizeBytes: image.sizeBytes,
        width: image.width,
        height: image.height,
        prompt: image.prompt,
        revisedPrompt: image.revisedPrompt,
        sourceAssetId: image.sourceAssetId,
        createdAt: image.createdAt.toISOString(),
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      ...(includeDetails ? { raw: { paramsJson: task.paramsJson, routeJson: task.routeJson, diagnosticsJson: task.diagnosticsJson } } : {}),
    };
  }
}
