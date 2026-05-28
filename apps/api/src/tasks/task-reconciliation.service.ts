import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TaskEventsService } from './task-events.service';

@Injectable()
export class TaskReconciliationService {
  constructor(private readonly prisma: PrismaService, private readonly events: TaskEventsService) {}

  notifyTaskChanged(id: string) {
    this.events.notify(id);
  }

  async failTimedOutRunningTasks() {
    const cutoff = new Date(Date.now() - 30 * 60_000);
    const rows = await this.prisma.generationTask.findMany({ where: { status: 'RUNNING', updatedAt: { lt: cutoff } }, select: { id: true }, take: 50 });
    for (const row of rows) {
      await this.prisma.generationTask.update({ where: { id: row.id }, data: { status: 'FAILED', errorCode: 'task_timeout', errorMessage: 'Task exceeded the 30 minute running timeout.' } });
      this.notifyTaskChanged(row.id);
    }
  }

  async requeueStaleLiveTasks(enqueueTask: (taskId: string) => Promise<void>, queuedTaskIds: Set<string>) {
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

    for (const task of liveTasks) {
      if (queuedTaskIds.has(task.id)) continue;
      await enqueueTask(task.id);
      if (task.status === 'RUNNING') await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'QUEUED' } });
      this.notifyTaskChanged(task.id);
    }
  }

  async reconcileRunningTasksWithImages() {
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
}
