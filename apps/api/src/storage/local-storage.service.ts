import { Inject, Injectable, Optional } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { detectImageFormat } from '../lib/image-utils';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';
import { normalizeBackend, safeNamespace, stripBackendPrefix } from './storage-key';
import type { StorageBackend, StorageOptions, StoredImage } from './storage-types';
import { createThumbnail } from './thumbnail.service';

@Injectable()
export class LocalStorageService {
  readonly backend: StorageBackend;
  readonly root: string;
  readonly bucket: string;
  readonly publicBaseUrl?: string;
  readonly endpoint?: string;
  readonly region: string;
  private local: LocalStorageAdapter;
  private remote: S3StorageAdapter;
  public get s3() { return this.remote.client; }
  public set s3(value: any) { (this.remote as any).client = value; }

  constructor(@Optional() @Inject('STORAGE_OPTIONS') options: StorageOptions = {}) {
    this.backend = normalizeBackend(options.backend ?? process.env.STORAGE_BACKEND);
    this.root = options.root ?? process.env.STORAGE_DIR ?? './data/uploads';
    this.bucket = options.bucket ?? process.env.STORAGE_BUCKET ?? process.env.S3_BUCKET ?? 'image-workbench';
    this.publicBaseUrl = options.publicBaseUrl ?? process.env.STORAGE_PUBLIC_BASE_URL;
    this.endpoint = options.endpoint ?? process.env.S3_ENDPOINT ?? process.env.R2_ENDPOINT ?? process.env.MINIO_ENDPOINT;
    this.region = options.region ?? process.env.S3_REGION ?? 'auto';
    const accessKeyId = options.accessKeyId ?? process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = options.secretAccessKey ?? process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    this.local = new LocalStorageAdapter(this.root);
    this.remote = new S3StorageAdapter(this.backend, this.bucket, this.region, this.endpoint, accessKeyId, secretAccessKey);
  }

  async putImage(bytes: Uint8Array, namespace = ''): Promise<StoredImage> {
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const format = detectImageFormat(bytes);
    const ext = format === 'unknown' ? 'png' : format;
    const safe = safeNamespace(namespace);
    const objectKey = `${safe ? `${safe}/` : ''}${sha256.slice(0, 2)}/${sha256}.${ext}`;
    const storageKey = this.backend === 'local' ? `local://${objectKey}` : `${this.backend}://${this.bucket}/${objectKey}`;
    let thumbnailKey: string | undefined;
    let thumbnailSizeBytes: number | undefined;
    const thumbnail = await createThumbnail(bytes);

    if (this.backend === 'local') {
      await this.local.put(objectKey, bytes);
      if (thumbnail) {
        const thumbObjectKey = `thumbs/${safe ? `${safe}/` : ''}${sha256.slice(0, 2)}/${sha256}.webp`;
        thumbnailKey = `local://${thumbObjectKey}`;
        thumbnailSizeBytes = thumbnail.byteLength;
        await this.local.put(thumbObjectKey, thumbnail);
      }
    } else {
      await this.remote.put(objectKey, bytes, ext);
      if (thumbnail) {
        const thumbObjectKey = `thumbs/${safe ? `${safe}/` : ''}${sha256.slice(0, 2)}/${sha256}.webp`;
        await this.remote.put(thumbObjectKey, thumbnail, 'webp');
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
    return this.local.resolveExistingPath(storageKey, parsed.key);
  }

  async readImage(storageKey: string): Promise<Uint8Array> {
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend !== 'local') return this.remote.read(parsed.key, parsed.bucket);
    const file = await this.resolveExistingPath(storageKey);
    if (!file) throw new Error(`image not found: ${storageKey}`);
    return this.local.read(file);
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
    return await this.remote.signedUrl(parsed.key, parsed.bucket, expiresIn) ?? this.publicUrl(storageKey);
  }

  async deleteImage(storageKey: string): Promise<boolean> {
    const parsed = stripBackendPrefix(storageKey);
    if (parsed.backend !== 'local') return false;
    const file = await this.resolveExistingPath(storageKey);
    if (!file) return false;
    return this.local.delete(file);
  }
}
