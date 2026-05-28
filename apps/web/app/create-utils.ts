import type { TaskImage } from './create-types';

export const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

export function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running' || normalized === 'queued') return 'secondary';
  return 'outline';
}

export function imageUrl(image?: TaskImage | null) {
  if (!image) return null;
  const raw = image.thumbnailUrl ?? image.assetUrl;
  if (raw?.startsWith('/assets/')) return `/api${raw}`;
  if (raw) return raw;
  return `/api/assets/file?key=${encodeURIComponent(image.storageKey)}`;
}

export function keyUrl(key?: string) {
  return key ? `/api/assets/file?key=${encodeURIComponent(key)}` : null;
}

export function extractImageToken(prompt: string) {
  const match = prompt.match(/@image\(([^)]+)\)|@image:([^\s]+)/i);
  return match?.[1] ?? match?.[2] ?? '';
}

export function fileNameFromKey(key: string) {
  const clean = decodeURIComponent(key).split('?')[0];
  return clean.split('/').pop() || '参考图';
}
