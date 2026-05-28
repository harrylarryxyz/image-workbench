import type { GalleryImage } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
export const TERMINAL = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

export function withBase(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE}${url}`;
}

export function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
}

export function assetUrls(image: GalleryImage) {
  const assetUrl = withBase(image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
  const thumbUrl = withBase(image.thumbnailUrl ?? image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
  return { assetUrl, thumbUrl };
}
