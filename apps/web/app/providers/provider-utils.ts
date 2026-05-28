import type { Message } from './types';

export function capabilityLabel(value?: boolean | null) {
  if (value === true) return 'supported';
  if (value === false) return 'unsupported';
  return 'unknown';
}

export function messageBadge(kind: Message['kind']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (kind === 'error') return 'destructive';
  if (kind === 'success') return 'secondary';
  return 'outline';
}
