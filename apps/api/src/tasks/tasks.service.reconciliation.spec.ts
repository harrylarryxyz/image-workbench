import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

const provider = { id: 'provider_1', defaultModel: 'gpt-image-2' };

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

function makeService(prisma: any, queue = makeQueue()) {
  return new TasksService(
    prisma,
    { getDefault: vi.fn().mockResolvedValue(provider) } as any,
    queue,
    { notify: vi.fn(), stream: vi.fn(), closeSignal: vi.fn() } as any,
    { assertExistingStorageKeys: vi.fn().mockResolvedValue([]) } as any,
  );
}

describe('TasksService reconciliation', () => {
  it('marks RUNNING tasks with persisted image assets as SUCCEEDED before returning queue status', async () => {
    const updatedAt = new Date('2026-05-27T17:09:27.742Z');
    const prisma = {
      imageAsset: {
        groupBy: vi.fn().mockResolvedValue([{ taskId: 'task_with_image', _count: { _all: 1 } }]),
      },
      generationTask: {
        update: vi.fn().mockResolvedValue({ id: 'task_with_image', status: 'SUCCEEDED' }),
        groupBy: vi.fn().mockResolvedValue([{ status: 'SUCCEEDED', _count: { status: 1 } }]),
      },
    };
    const service = makeService(prisma);

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
            images: [{ id: 'img_1', storageKey: '72/image.png', format: 'png', sizeBytes: 123, width: null, height: null, prompt: 'A cinematic orange robot fixing a neon sign', revisedPrompt: null, createdAt: imageCreatedAt }],
            createdAt,
            updatedAt: imageCreatedAt,
          },
        ]),
      },
    };
    const service = makeService(prisma);

    const rows = await service.listRecent();

    expect(prisma.generationTask.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'task_with_image' } }));
    expect(rows[0].status).toBe('SUCCEEDED');
    expect(rows[0].images).toHaveLength(1);
  });
});
