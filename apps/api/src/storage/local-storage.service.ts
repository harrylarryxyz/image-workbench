import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { detectImageFormat } from '../lib/image-utils';

type StorageBackend = 'local' | 's3' | 'r2' | 'minio';
type StorageOptions = {
  backend?: StorageBackend;
  root?: string;
  bucket?: string;
  publicBaseUrl?: string;
};

type StoredImage = {
  storageKey: string;
  thumbnailKey?: string;
  thumbnailFormat?: string;
  thumbnailSizeBytes?: number;
  format: string;
  sizeBytes: number;
  sha256: string;
  backend: StorageBackend;
  assetUrl?: string;
  thumbnailUrl?: string;
};

function normalizeBackend(input?: string): StorageBackend {
  if (input === 's3' || input === 'r2' || input === 'minio') return input;
  return 'local';
}

function stripBackendPrefix(storageKey: string): { backend: StorageBackend; key: string; bucket?: string } {
  const match = storageKey.match(/^(local|s3|r2|minio):\/\/(.*)$/);
  if (!match) return { backend: 'local', key: storageKey };
  const backend = normalizeBackend(match[1]);
  const rest = match[2];
  if (backend === 'local') return { backend, key: rest };
  const [bucket, ...parts] = rest.split('/');
  return { backend, bucket, key: parts.join('/') };
}

@Injectable()
export class LocalStorageService {
  readonly backend: StorageBackend;
  readonly root: string;
  readonly bucket: string;
  readonly publicBaseUrl?: string;

  constructor(options: StorageOptions = {}) {
    this.backend = normalizeBackend(options.backend ?? process.env.STORAGE_BACKEND);
    this.root = options.root ?? process.env.STORAGE_DIR ?? './data/uploads';
    this.bucket = options.bucket ?? process.env.STORAGE_BUCKET ?? process.env.S3_BUCKET ?? 'image-workbench';
    this.publicBaseUrl = options.publicBaseUrl ?? process.env.STORAGE_PUBLIC_BASE_URL;
  }

  async putImage(bytes: Uint8Array): Promise<StoredImage> {
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const format = detectImageFormat(bytes);
    const ext = format === 'unknown' ? 'png' : format;
    const objectKey = `${sha256.slice(0, 2)}/${sha256}.${ext}`;
    const storageKey = this.backend === 'local' ? `local://${objectKey}` : `${this.backend}://${this.bucket}/${objectKey}`;
    let thumbnailKey: string | undefined;
    let thumbnailSizeBytes: number | undefined;
    if (this.backend === 'local') {
      const dir = join(this.root, sha256.slice(0, 2));
      await mkdir(dir, { recursive: true });
      await writeFile(join(this.root, objectKey), bytes);
      const thumbnail = await this.createThumbnail(bytes);
      if (thumbnail) {
        thumbnailKey = `local://thumbs/${sha256.slice(0, 2)}/${sha256}.webp`;
        thumbnailSizeBytes = thumbnail.byteLength;
        await mkdir(join(this.root, 'thumbs', sha256.slice(0, 2)), { recursive: true });
        await writeFile(join(this.root, 'thumbs', sha256.slice(0, 2), `${sha256}.webp`), thumbnail);
      }
    } else {
      await this.putRemoteObject(objectKey, bytes);
    }
    return {
      storageKey,
      thumbnailKey,
      thumbnailFormat: thumbnailKey ? 'webp' : undefined,
      thumbnailSizeBytes,
      format: ext,
      sizeBytes: bytes.byteLength,
      sha256,
      backend: this.backend,
      assetUrl: this.publicUrl(storageKey),
      thumbnailUrl: thumbnailKey ? this.publicUrl(thumbnailKey) : undefined,
    };
  }

  async resolveExistingPath(storageKey: string): Promise<string | null> {
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend !== 'local') return null;
    const safe = parsed.key.split('/').filter((part) => part && part !== '..').join('/');
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
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend !== 'local') return this.readRemoteObject(parsed.key);
    const file = await this.resolveExistingPath(storageKey);
    if (!file) throw new Error(`image not found: ${storageKey}`);
    return readFile(file);
  }

  publicUrl(storageKey: string): string {
    const parsed = stripBackendPrefix(storageKey);
    if (this.publicBaseUrl) return `${this.publicBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(parsed.key).replace(/%2F/g, '/')}`;
    return `/assets/file?key=${encodeURIComponent(storageKey)}`;
  }

  private async createThumbnail(bytes: Uint8Array): Promise<Buffer | null> {
    try {
      return await sharp(Buffer.from(bytes), { failOn: 'none' })
        .rotate()
        .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
    } catch {
      return null;
    }
  }

  private async putRemoteObject(_objectKey: string, _bytes: Uint8Array): Promise<void> {
    // S3/R2/MinIO compatible backends share the same object-key contract. A deployment
    // can attach an S3 SDK adapter here without changing callers or stored keys.
  }

  private async readRemoteObject(objectKey: string): Promise<Uint8Array> {
    throw new Error(`remote object read requires configured S3-compatible adapter: ${objectKey}`);
  }
}
