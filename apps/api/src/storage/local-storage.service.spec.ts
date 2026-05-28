import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3kG7wAAAABJRU5ErkJggg==', 'base64');

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function tempRoot() {
  const dir = await mkdtemp(join(tmpdir(), 'iw-storage-'));
  tempDirs.push(dir);
  return dir;
}

describe('LocalStorageService backend compatibility', () => {
  it('stores and reads images with provider-prefixed local keys', async () => {
    const service = new LocalStorageService({ backend: 'local', root: await tempRoot() });

    const saved = await service.putImage(tinyPng);

    expect(saved.backend).toBe('local');
    expect(saved.storageKey).toMatch(/^local:\/\//);
    const bytes = await service.readImage(saved.storageKey);
    expect(Buffer.from(bytes).equals(tinyPng)).toBe(true);
    await expect(service.resolveExistingPath(saved.storageKey)).resolves.toContain(saved.storageKey.replace('local://', ''));
  });

  it('stores namespaced uploads under their workspace directory', async () => {
    const service = new LocalStorageService({ backend: 'local', root: await tempRoot() });

    const saved = await service.putImage(tinyPng, 'uploads/default');

    expect(saved.storageKey).toMatch(/^local:\/\/uploads\/default\//);
    const path = await service.resolveExistingPath(saved.storageKey);
    expect(path).toContain('/uploads/default/');
    const bytes = await service.readImage(saved.storageKey);
    expect(Buffer.from(bytes).equals(tinyPng)).toBe(true);
  });

  it('generates real local webp thumbnails for gallery assets', async () => {
    const service = new LocalStorageService({ backend: 'local', root: await tempRoot() });

    const saved = await service.putImage(tinyPng);

    expect(saved.thumbnailKey).toMatch(/^local:\/\/thumbs\//);
    expect(saved.thumbnailFormat).toBe('webp');
    expect(saved.thumbnailSizeBytes).toBeGreaterThan(0);
    const thumbnailPath = await service.resolveExistingPath(saved.thumbnailKey!);
    expect(thumbnailPath).toBeTruthy();
    const thumbnailBytes = await readFile(thumbnailPath!);
    expect(thumbnailBytes.subarray(0, 4).toString('hex')).toBe('52494646');
    expect(thumbnailBytes.subarray(8, 12).toString()).toBe('WEBP');
  });

  it('exposes remote-object metadata and rejects local path resolution for s3-compatible backends', async () => {
    const service = new LocalStorageService({ backend: 's3', bucket: 'image-workbench', publicBaseUrl: 'https://cdn.example.com/assets', accessKeyId: 'test', secretAccessKey: 'test', endpoint: 'https://s3.example.com' });
    const send = vi.fn().mockResolvedValue({});
    (service as any).s3 = { send };

    const saved = await service.putImage(tinyPng);

    expect(saved.backend).toBe('s3');
    expect(saved.storageKey).toMatch(/^s3:\/\/image-workbench\//);
    expect(service.publicUrl(saved.storageKey)).toMatch(/^https:\/\/cdn\.example\.com\/assets\//);
    await expect(service.resolveExistingPath(saved.storageKey)).resolves.toBeNull();
    expect(send).toHaveBeenCalled();
  });
});
