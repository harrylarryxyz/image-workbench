import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageBackend } from './storage-types';

export class S3StorageAdapter {
  client?: S3Client;

  constructor(
    readonly backend: StorageBackend,
    readonly bucket: string,
    readonly region: string,
    readonly endpoint?: string,
    accessKeyId?: string,
    secretAccessKey?: string,
  ) {
    if (backend !== 'local' && accessKeyId && secretAccessKey) {
      this.client = new S3Client({ region, endpoint, forcePathStyle: backend === 'minio', credentials: { accessKeyId, secretAccessKey } });
    }
  }

  async put(objectKey: string, bytes: Uint8Array, format = 'png') {
    if (!this.client) throw new Error('S3-compatible storage is selected but credentials are not configured.');
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, Body: Buffer.from(bytes), ContentType: `image/${format === 'jpg' ? 'jpeg' : format}` }));
  }

  async read(objectKey: string, bucket?: string): Promise<Uint8Array> {
    if (!this.client) throw new Error(`remote object read requires configured S3-compatible adapter: ${objectKey}`);
    const result = await this.client.send(new GetObjectCommand({ Bucket: bucket ?? this.bucket, Key: objectKey }));
    const chunks: Buffer[] = [];
    for await (const chunk of result.Body as any) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  signedUrl(objectKey: string, bucket?: string, expiresIn = 300) {
    if (!this.client) return null;
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket ?? this.bucket, Key: objectKey }), { expiresIn });
  }
}
