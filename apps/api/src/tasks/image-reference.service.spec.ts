import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ImageReferenceService } from './image-reference.service';

describe('ImageReferenceService', () => {
  it('accepts existing image asset storage keys', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([{ storageKey: 'outputs/a.png' }]) } };
    const service = new ImageReferenceService(prisma as any);

    await expect(service.assertExistingStorageKeys(['outputs/a.png'])).resolves.toEqual(['outputs/a.png']);
  });

  it('rejects missing image asset storage keys', async () => {
    const prisma = { imageAsset: { findMany: vi.fn().mockResolvedValue([]) } };
    const service = new ImageReferenceService(prisma as any);

    await expect(service.assertExistingStorageKeys(['missing.png'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.assertExistingStorageKeys(['missing.png'])).rejects.toMatchObject({ message: 'reference image not found: missing.png' });
  });
});
