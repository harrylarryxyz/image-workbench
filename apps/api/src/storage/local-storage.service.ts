import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { detectImageFormat } from '../lib/image-utils';

@Injectable()
export class LocalStorageService {
  readonly root = process.env.STORAGE_DIR ?? './data/uploads';

  async putImage(bytes: Uint8Array): Promise<{ storageKey: string; format: string; sizeBytes: number; sha256: string }> {
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const format = detectImageFormat(bytes);
    const ext = format === 'unknown' ? 'png' : format;
    const dir = join(this.root, sha256.slice(0, 2));
    await mkdir(dir, { recursive: true });
    const storageKey = `${sha256.slice(0, 2)}/${sha256}.${ext}`;
    await writeFile(join(this.root, storageKey), bytes);
    return { storageKey, format: ext, sizeBytes: bytes.byteLength, sha256 };
  }
  async resolveExistingPath(storageKey: string): Promise<string | null> {
    const safe = storageKey.split('/').filter((part) => part && part !== '..').join('/');
    const root = resolve(this.root);
    const file = resolve(root, safe);
    if (!file.startsWith(root)) return null;
    try {
      await access(file);
      return file;
    } catch {
      return null;
    }
  }

  async readImage(storageKey: string): Promise<Uint8Array> {
    const file = await this.resolveExistingPath(storageKey);
    if (!file) throw new Error(`image not found: ${storageKey}`);
    return readFile(file);
  }
}
