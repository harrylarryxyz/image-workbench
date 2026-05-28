import { Inject, Injectable, Optional } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { detectImageFormat } from '../lib/image-utils';

type StorageBackend = 'local' | 's3' | 'r2' | 'minio';
type StorageOptions = {
  backend?: StorageBackend;
  root?: string;
  bucket?: string;
  publicBaseUrl?: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
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
  readonly endpoint?: string;
  readonly region: string;
  private s3?: S3Client;

  constructor(@Optional() @Inject('STORAGE_OPTIONS') options: StorageOptions = {}) {
    this.backend = normalizeBackend(options.backend ?? process.env.STORAGE_BACKEND);
    this.root = options.root ?? process.env.STORAGE_DIR ?? './data/uploads';
    this.bucket = options.bucket ?? process.env.STORAGE_BUCKET ?? process.env.S3_BUCKET ?? 'image-workbench';
    this.publicBaseUrl = options.publicBaseUrl ?? process.env.STORAGE_PUBLIC_BASE_URL;
    this.endpoint = options.endpoint ?? process.env.S3_ENDPOINT ?? process.env.R2_ENDPOINT ?? process.env.MINIO_ENDPOINT;
    this.region = options.region ?? process.env.S3_REGION ?? 'auto';
    const accessKeyId = options.accessKeyId ?? process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = options.secretAccessKey ?? process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    if (this.backend !== 'local' && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({ region: this.region, endpoint: this.endpoint, forcePathStyle: this.backend === 'minio', credentials: { accessKeyId, secretAccessKey } });
    }
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
      await this.putRemoteObject(objectKey, bytes, ext);
      const thumbnail = await this.createThumbnail(bytes);
      if (thumbnail) {
        const thumbObjectKey = `thumbs/${sha256.slice(0, 2)}/${sha256}.webp`;
        await this.putRemoteObject(thumbObjectKey, thumbnail, 'webp');
        thumbnailKey = `${this.backend}://${this.bucket}/${thumbObjectKey}`;
        thumbnailSizeBytes = thumbnail.byteLength;
      }
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
    if (parsed.backend !== 'local') return this.readRemoteObject(parsed.key, parsed.bucket);
    const file = await this.resolveExistingPath(storageKey);
    if (!file) throw new Error(`image not found: ${storageKey}`);
    return readFile(file);
  }

  publicUrl(storageKey: string): string {
    const parsed = stripBackendPrefix(storageKey);
    if (this.publicBaseUrl) return `${this.publicBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(parsed.key).replace(/%2F/g, '/')}`;
    return `/assets/file?key=${encodeURIComponent(storageKey)}`;
  }

  async signedUrl(storageKey: string, expiresIn = 300): Promise<string> {
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend === 'local') return this.publicUrl(storageKey);
    if (this.publicBaseUrl) return this.publicUrl(storageKey);
    if (!this.s3) return this.publicUrl(storageKey);
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: parsed.bucket ?? this.bucket, Key: parsed.key }), { expiresIn });
  }

  async deleteImage(storageKey: string): Promise<boolean> {
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend !== 'local') return false;
    const file = await this.resolveExistingPath(storageKey);
    if (!file) return false;
    await rm(file, { force: true });
    return true;
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

  private async putRemoteObject(objectKey: string, bytes: Uint8Array, format = 'png'): Promise<void> {
    if (!this.s3) throw new Error('S3-compatible storage is selected but credentials are not configured.');
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, Body: Buffer.from(bytes), ContentType: `image/${format === 'jpg' ? 'jpeg' : format}` }));
  }

  private async readRemoteObject(objectKey: string, bucket?: string): Promise<Uint8Array> {
    if (!this.s3) throw new Error(`remote object read requires configured S3-compatible adapter: ${objectKey}`);
    const result = await this.s3.send(new GetObjectCommand({ Bucket: bucket ?? this.bucket, Key: objectKey }));
    const chunks: Buffer[] = [];
    for await (const chunk of result.Body as any) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
}
