import type { FlowNode } from './canvas-types';

export function nodePrompt(node?: FlowNode) {
  return String(node?.data?.prompt ?? node?.data?.label ?? '').split('\n').filter(Boolean).slice(-1)[0] ?? '';
}

export function nodeKind(node: FlowNode) {
  const explicit = String(node.data?.kind ?? node.type ?? '').toLowerCase();
  if (explicit.includes('image') || node.id.startsWith('image')) return 'image';
  if (explicit.includes('prompt') || explicit.includes('text') || node.id.startsWith('prompt')) return 'prompt';
  if (explicit.includes('task') || explicit.includes('generation') || node.id.startsWith('task')) return 'task';
  return 'node';
}
