'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreationObject } from './types';

const toneByKind: Record<string, string> = {
  brief: 'border-[#e9d8c4] bg-[#fffaf2] text-[#45506a]',
  'reference.image': 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  'generated.image': 'border-[#eaaea4] bg-[#f4cfc7] text-[#8d4c43]',
  text: 'border-[#d7dce4] bg-[#eef0f4] text-[#45506a]',
  'brand.palette': 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  'brand.font': 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  'task.generate': 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
  'task.edit': 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
  artboard: 'border-[#e9d8c4] bg-[#fff8ea] text-[#45506a]',
  deliverable: 'border-[#e9d8c4] bg-[#fffaf2] text-[#253048]',
};

const labelByKind: Record<string, string> = {
  brief: 'Brief',
  'reference.image': '图片对象 · 参考',
  'generated.image': '图片对象 · 生成',
  text: '文本对象',
  'brand.palette': '品牌对象',
  'brand.font': '品牌字体',
  'task.generate': '创作动作',
  'task.edit': '局部动作',
  artboard: '交付画板',
  deliverable: '导出对象',
};

function StatusDot({ object }: { object: CreationObject }) {
  if (object.status === 'champion') return <Badge className="rounded-full bg-[#253048] px-2 py-0.5 text-[0.62rem] text-[#fffaf2]">冠军路径</Badge>;
  if (object.status === 'rejected') return <Badge variant="outline" className="rounded-full border-[#d9c2a7] bg-[#fff1de]/50 px-2 py-0.5 text-[0.62rem] text-[#9ba4b3]">废弃分支</Badge>;
  if (object.status === 'exported') return <Badge variant="outline" className="rounded-full border-[#d6e7df] bg-[#e7f1ec] px-2 py-0.5 text-[0.62rem] text-[#486e64]">可交付</Badge>;
  return null;
}

export function CreationObjectNode({ object, selected, onSelect, onOpenInspector }: {
  object: CreationObject;
  selected?: boolean;
  onSelect: (id: string) => void;
  onOpenInspector: (id: string) => void;
}) {
  const isImage = object.kind === 'reference.image' || object.kind === 'generated.image';
  const isText = object.kind === 'text' || object.kind === 'brief';
  const isRejected = object.status === 'rejected';
  const tone = toneByKind[object.kind] ?? toneByKind.brief;

  return <div
    role="button"
    tabIndex={0}
    data-creation-object-kind={object.kind}
    data-selected={selected ? 'true' : 'false'}
    aria-label={`单击对象：${object.title}`}
    className={cn(
      'absolute grid min-w-0 cursor-pointer rounded-[1.1rem] border p-3 text-left shadow-[0_14px_32px_rgba(37,48,72,0.10)] transition',
      tone,
      selected && 'ring-2 ring-[#b96a5c]/70 ring-offset-2 ring-offset-[#fff1de]',
      isRejected && 'opacity-35',
    )}
    style={{ left: object.position.x, top: object.position.y, width: object.size?.width ?? 190, minHeight: object.size?.height ?? 112 }}
    onClick={() => onSelect(object.id)}
    onDoubleClick={() => onOpenInspector(object.id)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onSelect(object.id);
    }}
  >
    <span className="mb-2 flex min-w-0 items-start justify-between gap-2">
      <span className="min-w-0">
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] opacity-70">{labelByKind[object.kind]}</span>
        <b className="mt-1 block truncate text-sm text-[#253048]">{object.title}</b>
      </span>
      <StatusDot object={object} />
    </span>

    {isImage ? <span className="mb-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-[0.85rem] border border-current/15 bg-[linear-gradient(145deg,#fffaf2,#f8e3dd_52%,#e7f1ec)] text-[0.68rem] font-semibold opacity-95">
      {object.status === 'champion' ? '主图' : object.kind === 'reference.image' ? '参考图' : '生成图'}
    </span> : null}

    {isText && object.text ? <span className="mb-2 block rounded-[0.8rem] border border-current/12 bg-[#fffaf2]/55 px-2 py-2 text-xs leading-5">
      “{object.text.content}”
    </span> : null}

    {object.kind === 'brand.palette' ? <span className="mb-2 flex gap-1.5">
      {['#fffaf2', '#253048', '#b96a5c', '#5b8277'].map((color) => <span key={color} aria-label={color} className="h-5 w-8 rounded-full border border-[#e9d8c4]" style={{ backgroundColor: color }} />)}
    </span> : null}

    {object.kind === 'artboard' ? <span className="mb-2 grid aspect-[3/4] w-16 place-items-center rounded-[0.75rem] border border-[#e9d8c4] bg-[#fffaf2]/70 text-[0.62rem]">3:4</span> : null}

    <span className="line-clamp-2 text-[0.72rem] leading-5 opacity-82">{object.summary}</span>
    {selected ? <Button type="button" variant="outline" size="sm" className="mt-2 h-7 rounded-full border-[#f2d6cf] bg-[#fffaf2]/72 px-2 text-[0.66rem] text-[#9e574c] hover:bg-[#f8e3dd]" onClick={(event) => { event.stopPropagation(); onOpenInspector(object.id); }}>双击或长按看详情</Button> : null}
  </div>;
}
