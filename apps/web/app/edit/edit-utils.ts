export const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

export function assetSrc(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/assets/')) return `/api${url}`;
  return url;
}

export function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'secondary';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running' || normalized === 'queued' || normalized === 'pending') return 'outline';
  return 'default';
}
