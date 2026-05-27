import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
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

  it('exposes remote-object metadata and rejects local path resolution for s3-compatible backends', async () => {
    const service = new LocalStorageService({ backend: 's3', bucket: 'image-workbench', publicBaseUrl: 'https://cdn.example.com/assets' });

    const saved = await service.putImage(tinyPng);

    expect(saved.backend).toBe('s3');
    expect(saved.storageKey).toMatch(/^s3:\/\/image-workbench\//);
    expect(service.publicUrl(saved.storageKey)).toMatch(/^https:\/\/cdn\.example\.com\/assets\//);
    await expect(service.resolveExistingPath(saved.storageKey)).resolves.toBeNull();
  });
});
