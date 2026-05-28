import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryAssetsService } from './gallery-assets.service';
import { GalleryBatchService } from './gallery-batch.service';
import { GalleryCollectionsService } from './gallery-collections.service';

const createdAt = new Date('2026-05-27T00:00:00.000Z');

function makePrisma(rows: any[]) {
  return {
    imageAsset: {
      findMany: vi.fn().mockResolvedValue(rows),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

function makeController(prisma: any) {
  const assets = new GalleryAssetsService(prisma);
  const collections = new GalleryCollectionsService(prisma);
  const batch = new GalleryBatchService(prisma);
  return new GalleryController(assets, collections, batch);
}

describe('GalleryController', () => {
  it('returns thumbnail, task metadata, and reuse/download fields', async () => {
    const prisma = makePrisma([{ id: 'img_1', storageKey: 'outputs/abc.png', format: 'png', sizeBytes: 2048, width: 1024, height: 1024, prompt: 'orange robot', taskId: 'task_1', createdAt, task: { id: 'task_1', type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2', paramsJson: { quality: 'low', size: '1024x1024' } } }]);
    const controller = makeController(prisma);

    await expect(controller.list({ type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2' } as any)).resolves.toEqual([expect.objectContaining({ id: 'img_1', storageKey: 'outputs/abc.png', assetUrl: '/assets/file?key=outputs%2Fabc.png', thumbnailUrl: '/assets/file?key=outputs%2Fabc.png', format: 'png', sizeBytes: 2048, width: 1024, height: 1024, prompt: 'orange robot', taskId: 'task_1', taskType: 'image.generate', taskStatus: 'SUCCEEDED', model: 'gpt-image-2', params: { quality: 'low', size: '1024x1024' }, createdAt: createdAt.toISOString() })]);
    expect(prisma.imageAsset.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: 'default', task: { type: 'image.generate', status: 'SUCCEEDED', model: 'gpt-image-2' } } }));
  });

  it('rejects lineage updates that point at another workspace asset', async () => {
    const prisma = makePrisma([]);
    prisma.imageAsset.findFirst.mockResolvedValue(null);
    const controller = makeController(prisma);

    await expect(controller.updateMeta('img_1', { sourceAssetId: 'img_other' } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.imageAsset.updateMany).not.toHaveBeenCalled();
  });

  it('filters returned lineage to the active workspace', async () => {
    const prisma = makePrisma([]);
    prisma.imageAsset.findFirst.mockResolvedValue({
      id: 'img_1', storageKey: 'local://outputs/img.png', format: 'png', sizeBytes: 1, createdAt,
      workspaceId: 'default', collectionItems: [], derivatives: [],
      sourceAsset: { id: 'img_foreign', workspaceId: 'other', storageKey: 'local://outputs/other.png', format: 'png', sizeBytes: 1, createdAt },
    });
    const controller = makeController(prisma);

    await expect(controller.detail('img_1')).resolves.toMatchObject({ id: 'img_1', sourceAsset: null });
    expect(prisma.imageAsset.findFirst).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({ derivatives: { where: { workspaceId: 'default' }, take: 12 } }) }));
  });
});
