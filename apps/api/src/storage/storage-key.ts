import type { StorageBackend } from './storage-types';

export function normalizeBackend(input?: string): StorageBackend {
  if (input === 's3' || input === 'r2' || input === 'minio') return input;
  return 'local';
}

export function stripBackendPrefix(storageKey: string): { backend: StorageBackend; key: string; bucket?: string } {
  const match = storageKey.match(/^(local|s3|r2|minio):\/\/(.*)$/);
  if (!match) return { backend: 'local', key: storageKey };
  const backend = normalizeBackend(match[1]);
  const rest = match[2];
  if (backend === 'local') return { backend, key: rest };
  const [bucket, ...parts] = rest.split('/');
  return { backend, bucket, key: parts.join('/') };
}

export function safeNamespace(namespace: string) {
  return namespace.split('/').filter((part) => part && part !== '..').join('/');
}
