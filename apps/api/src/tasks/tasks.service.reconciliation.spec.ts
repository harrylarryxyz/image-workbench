import { describe, expect, it, vi } from 'vitest';
import { TaskEventsService } from './task-events.service';
import { TaskMetricsService } from './task-metrics.service';
import { TaskQueueService } from './task-queue.service';
import { TaskReconciliationService } from './task-reconciliation.service';

function makeQueue(overrides = {}) {
  return {
    getWaitingCount: vi.fn().mockResolvedValue(0),
    getActiveCount: vi.fn().mockResolvedValue(0),
    getDelayedCount: vi.fn().mockResolvedValue(0),
    getFailedCount: vi.fn().mockResolvedValue(0),
    getCompletedCount: vi.fn().mockResolvedValue(0),
    isPaused: vi.fn().mockResolvedValue(false),
    add: vi.fn(),
    getJobs: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as any;
}

function makeMetricsService(prisma: any, queue = makeQueue()) {
  const events = { notify: vi.fn() } as unknown as TaskEventsService;
  const reconciliation = new TaskReconciliationService(prisma, events);
  const queueService = new TaskQueueService(prisma, queue, reconciliation);
  return { service: new TaskMetricsService(prisma, queueService, reconciliation), queue };
}

describe('TasksService reconciliation', () => {
  it('marks RUNNING tasks with persisted image assets as SUCCEEDED before returning queue status', async () => {
    const prisma = {
      imageAsset: {
        groupBy: vi.fn().mockResolvedValue([{ taskId: 'task_with_image', _count: { _all: 1 } }]),
      },
      generationTask: {
        update: vi.fn().mockResolvedValue({ id: 'task_with_image', status: 'SUCCEEDED' }),
        findMany: vi.fn().mockResolvedValue([]),
        groupBy: vi.fn().mockResolvedValue([{ status: 'SUCCEEDED', _count: { status: 1 } }]),
      },
    };
    const { service } = makeMetricsService(prisma);

    await expect(service.queueStatus()).resolves.toEqual({
      queue: { waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0, paused: false },
      database: { SUCCEEDED: 1 },
    });

    expect(prisma.imageAsset.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      by: ['taskId'],
      where: { task: { status: 'RUNNING' } },
      _count: { _all: true },
    }));
    expect(prisma.generationTask.update).toHaveBeenCalledWith({
      where: { id: 'task_with_image' },
      data: {
        status: 'SUCCEEDED',
        errorCode: null,
        errorMessage: null,
        diagnosticsJson: undefined,
      },
    });
  });

  it('reconciles RUNNING tasks with images before listing recent tasks', async () => {
    const createdAt = new Date('2026-05-27T17:05:21.928Z');
    const imageCreatedAt = new Date('2026-05-27T17:08:58.183Z');
    const prisma = {
      imageAsset: {
        groupBy: vi.fn().mockResolvedValue([{ taskId: 'task_with_image', _count: { _all: 1 } }]),
      },
      generationTask: {
        update: vi.fn().mockResolvedValue({ id: 'task_with_image', status: 'SUCCEEDED' }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'task_with_image',
            type: 'image.generate',
            status: 'SUCCEEDED',
            provider: null,
            model: 'gpt-image-2',
            prompt: 'A cinematic orange robot fixing a neon sign',
            paramsJson: {},
            routeJson: null,
            diagnosticsJson: null,
            errorCode: null,
            errorMessage: null,
            elapsedMs: 208445,
            images: [{ id: 'img_1', storageKey: '72/image.png', format: 'png', sizeBytes: 123, width: null, height: null, prompt: 'A cinematic orange robot fixing a neon sign', revisedPrompt: null, sourceAssetId: null, createdAt: imageCreatedAt }],
            createdAt,
            updatedAt: imageCreatedAt,
          },
        ]),
      },
    };
    const { service } = makeMetricsService(prisma);

    const rows = await service.listRecent();

    expect(prisma.generationTask.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'task_with_image' } }));
    expect(rows[0].status).toBe('SUCCEEDED');
    expect(rows[0].images).toHaveLength(1);
  });

  it('requeues stale QUEUED/RUNNING tasks that are missing from BullMQ after restarts', async () => {
    const staleCreatedAt = new Date(Date.now() - 15 * 60_000);
    const prisma = {
      imageAsset: {
        groupBy: vi.fn().mockResolvedValue([]),
      },
      generationTask: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'stale_queued', status: 'QUEUED', createdAt: staleCreatedAt, updatedAt: staleCreatedAt },
          { id: 'stale_running', status: 'RUNNING', createdAt: staleCreatedAt, updatedAt: staleCreatedAt },
        ]),
        update: vi.fn().mockResolvedValue({}),
        groupBy: vi.fn().mockResolvedValue([
          { status: 'QUEUED', _count: { status: 1 } },
          { status: 'RUNNING', _count: { status: 1 } },
        ]),
      },
    };
    const queue = makeQueue({
      getJobs: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue({}),
    });
    const { service } = makeMetricsService(prisma, queue);

    await service.queueStatus();

    expect(prisma.generationTask.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { in: ['QUEUED', 'RUNNING'] } }),
    }));
    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.add).toHaveBeenCalledWith('generate', { taskId: 'stale_queued' }, expect.objectContaining({ jobId: expect.stringContaining('task:stale_queued:') }));
    expect(queue.add).toHaveBeenCalledWith('generate', { taskId: 'stale_running' }, expect.objectContaining({ jobId: expect.stringContaining('task:stale_running:') }));
  });
});
