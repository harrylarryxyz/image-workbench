import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';
import { TaskReconciliationService } from './task-reconciliation.service';

@Injectable()
export class TaskQueueService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('image-generation') private readonly queue: Queue,
    private readonly reconciliation: TaskReconciliationService,
    private readonly audit?: AuditService,
  ) {}

  async enqueueTask(taskId: string) {
    await this.queue.add('generate', { taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 10_000 }, removeOnComplete: 100, removeOnFail: 200, jobId: `task:${taskId}:${Date.now()}` });
  }

  async getLiveQueuedTaskIds() {
    const jobs = await this.queue.getJobs(['waiting', 'active', 'delayed', 'prioritized'], 0, 500);
    return new Set(jobs.map((job: any) => job.data?.taskId).filter(Boolean));
  }

  async counts() {
    const [waiting, active, delayed, failed, completed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getDelayedCount(),
      this.queue.getFailedCount(),
      this.queue.getCompletedCount(),
      this.queue.isPaused(),
    ]);
    return { waiting, active, delayed, failed, completed, paused };
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
    this.reconciliation.notifyTaskChanged(id);
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
    this.reconciliation.notifyTaskChanged(id);
    return { ok: true, id, status: 'FAILED' };
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
      this.reconciliation.notifyTaskChanged(id);
      return { ok: true, id, status: 'CANCELLED' };
    }
    return { ok: false, id, status: task.status, error: 'Only queued tasks can be cancelled safely.' };
  }
}
