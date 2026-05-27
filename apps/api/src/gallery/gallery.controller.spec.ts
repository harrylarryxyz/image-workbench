import { describe, expect, it, vi } from 'vitest';
import { GalleryController } from './gallery.controller';

const createdAt = new Date('2026-05-27T00:00:00.000Z');

function makePrisma(rows: any[]) {
  return {
    imageAsset: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
  };
}

describe('GalleryController', () => {
  it('returns thumbnail, task metadata, and reuse/download fields', async () => {
    const prisma = makePrisma([{ id: 'img_1', storageKey: 'outputs/abc.png', format: 'png', sizeBytes: 2048, width: 1024, height: 1024, prompt: 'orange robot', taskId: 'task_1', createdAt, task: { id: 'task_1', type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2', paramsJson: { quality: 'low', size: '1024x1024' } } }]);
    const controller = new GalleryController(prisma as any);

    await expect(controller.list({ type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2' } as any)).resolves.toEqual([{ id: 'img_1', storageKey: 'outputs/abc.png', assetUrl: '/assets/file?key=outputs%2Fabc.png', thumbnailUrl: '/assets/file?key=outputs%2Fabc.png', format: 'png', sizeBytes: 2048, width: 1024, height: 1024, prompt: 'orange robot', taskId: 'task_1', taskType: 'image.generate', taskStatus: 'SUCCEEDED', model: 'gpt-image-2', params: { quality: 'low', size: '1024x1024' }, createdAt: createdAt.toISOString() }]);
    expect(prisma.imageAsset.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { task: { type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2' } } }));
  });
});
