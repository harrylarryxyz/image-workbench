import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { TaskEventsService } from './task-events.service';
import type { RequestContext } from '../auth/request-context';
import { TaskCreationService } from './task-creation.service';
import { TaskQueueService } from './task-queue.service';
import { TaskMetricsService } from './task-metrics.service';
import { serializeTask } from './task-serializer';
import { suggestTaskFix } from './task-diagnostics';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: TaskEventsService,
    private readonly creation: TaskCreationService,
    private readonly queue: TaskQueueService,
    private readonly metricsService: TaskMetricsService,
  ) {}

  async createGenerateTask(input: unknown, ctx?: RequestContext) {
    return this.creation.createGenerateTask(input, ctx);
  }

  async createEditTask(input: any, ctx?: RequestContext) {
    return this.creation.createEditTask(input, ctx);
  }

  async queueStatus(ctx?: RequestContext) {
    return this.metricsService.queueStatus(ctx);
  }

  async retryTask(id: string, overrides: any = {}, ctx?: RequestContext) {
    return this.queue.retryTask(id, overrides, ctx);
  }

  async bulkRetryFailed(overrides: any = {}, ctx?: RequestContext) {
    return this.queue.bulkRetryFailed(overrides, ctx);
  }

  async forceStopTask(id: string, ctx?: RequestContext) {
    return this.queue.forceStopTask(id, ctx);
  }

  async diagnosticPackage(id: string, ctx?: RequestContext) {
    const task = await this.getTask(id, ctx);
    if (!task) return null;
    const suggestion = suggestTaskFix(task);
    return { task, suggestion, copiedAt: new Date().toISOString() };
  }

  async cancelTask(id: string, ctx?: RequestContext) {
    return this.queue.cancelTask(id, ctx);
  }

  async listFailed(ctx?: RequestContext) {
    return this.metricsService.listFailed(ctx);
  }

  async metrics(ctx?: RequestContext) {
    return this.metricsService.metrics(ctx);
  }

  async listRecent(ctx?: RequestContext) {
    return this.metricsService.listRecent(ctx);
  }

  async getTask(id: string, ctx?: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, include: { images: true, provider: true } });
    return task ? serializeTask(task, true) : null;
  }

  streamTaskEvents(id: string, res: Response, ctx?: RequestContext) {
    return this.events.stream(id, () => this.getTask(id, ctx), this.events.closeSignal(res));
  }

  notifyTaskChanged(id: string) {
    this.events.notify(id);
  }
}
