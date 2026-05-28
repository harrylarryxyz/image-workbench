export type StorageBackend = 'local' | 's3' | 'r2' | 'minio';

export type StorageOptions = {
  backend?: StorageBackend;
  root?: string;
  bucket?: string;
  publicBaseUrl?: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type StoredImage = {
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
