import type { Edge, Node } from '@xyflow/react';

export const initialNodes: Node[] = [
  { id: 'prompt-1', type: 'default', position: { x: 40, y: 80 }, data: { label: 'Text\nA cinematic orange robot fixing a neon sign', prompt: 'A cinematic orange robot fixing a neon sign' } },
  { id: 'task-1', type: 'default', position: { x: 380, y: 80 }, data: { label: 'Generation\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } },
];

export const initialEdges: Edge[] = [{ id: 'prompt-1-task-1', source: 'prompt-1', target: 'task-1', label: 'creates' }];

export function withApi(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return url.startsWith('/api') ? url : `/api${url}`;
}

export function labelForNode(id: string, data: Record<string, unknown>) {
  if (id.startsWith('prompt')) return `Text\n${String(data.prompt ?? '').trim() || 'Describe your subject here'}`;
  if (id.startsWith('image')) return `Image\n${String(data.storageKey ?? '').trim() || '从素材库或编辑工作区选择图片'}`;
  if (id.startsWith('task')) return `Generation\n${data.taskId ?? data.model ?? 'gpt-image-2'} · ${data.size ?? '1024x1024'}`;
  return String(data.label ?? id);
}

export function nodeKind(id?: string | null) {
  if (!id) return 'none';
  if (id.startsWith('prompt')) return 'Text node';
  if (id.startsWith('image')) return 'Image node';
  if (id.startsWith('task')) return 'Generation config';
  return 'Node';
}

export function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
}
