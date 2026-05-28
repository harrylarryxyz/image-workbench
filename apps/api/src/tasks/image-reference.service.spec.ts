import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ImageReferenceService } from './image-reference.service';

const ctx = { workspaceId: 'default', role: 'owner', authSource: 'anonymous-dev' } as any;

describe('ImageReferenceService', () => {
  it('accepts existing image asset storage keys', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([{ storageKey: 'outputs/a.png' }]) } };
    const service = new ImageReferenceService(prisma as any);

    await expect(service.assertExistingStorageKeys(['outputs/a.png'])).resolves.toEqual(['outputs/a.png']);
  });

  it('accepts uploaded workspace-local reference keys even before they become generated assets', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([]) } };
    const storage = { resolveExistingPath: vi.fn().mockResolvedValue('/tmp/uploads/default/a.png') };
    const service = new ImageReferenceService(prisma as any, storage as any);

    await expect(service.assertExistingStorageKeys(['local://uploads/default/a.png'], ctx)).resolves.toEqual(['local://uploads/default/a.png']);
    expect(storage.resolveExistingPath).toHaveBeenCalledWith('local://uploads/default/a.png');
  });

  it('rejects uploaded reference keys outside the active workspace', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([]) } };
    const storage = { resolveExistingPath: vi.fn().mockResolvedValue('/tmp/uploads/other/a.png') };
    const service = new ImageReferenceService(prisma as any, storage as any);

    await expect(service.assertExistingStorageKeys(['local://uploads/other/a.png'], ctx)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.resolveExistingPath).not.toHaveBeenCalled();
  });

  it('rejects missing image asset storage keys', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([]) } };
    const service = new ImageReferenceService(prisma as any);

    await expect(service.assertExistingStorageKeys(['missing.png'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.assertExistingStorageKeys(['missing.png'])).rejects.toMatchObject({ message: 'reference image not found: missing.png' });
  });
});
