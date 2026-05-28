import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { RequestContext } from '../auth/request-context';
import { TaskQueueService } from './task-queue.service';
import { TaskReconciliationService } from './task-reconciliation.service';
import { serializeTask } from './task-serializer';

@Injectable()
export class TaskMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: TaskQueueService,
    private readonly reconciliation: TaskReconciliationService,
  ) {}

  async queueStatus(ctx?: RequestContext) {
    await this.reconciliation.reconcileRunningTasksWithImages();
    await this.reconciliation.requeueStaleLiveTasks((taskId) => this.queue.enqueueTask(taskId), await this.queue.getLiveQueuedTaskIds());
    const queue = await this.queue.counts();
    await this.reconciliation.failTimedOutRunningTasks();
    const dbCounts = await this.prisma.generationTask.groupBy({ by: ['status'], where: ctx ? { workspaceId: ctx.workspaceId } : undefined, _count: { status: true } });
    return {
      queue,
      database: Object.fromEntries(dbCounts.map((row) => [row.status, row._count.status])),
    };
  }

  async listFailed(ctx?: RequestContext) {
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'FAILED', ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, orderBy: { updatedAt: 'desc' }, take: 100, include: { images: true, provider: true } });
    return rows.map((task) => serializeTask(task, true));
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
    await this.reconciliation.reconcileRunningTasksWithImages();
    const rows = await this.prisma.generationTask.findMany({
      where: ctx ? { workspaceId: ctx.workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { images: true, provider: true },
    });
    return rows.map((task) => serializeTask(task));
  }
}
