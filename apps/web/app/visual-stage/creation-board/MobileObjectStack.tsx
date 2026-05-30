'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CreationObject } from './types';

const chipTone: Record<string, string> = {
  'reference.image': 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  'generated.image': 'border-[#eaaea4] bg-[#f4cfc7] text-[#8d4c43]',
  text: 'border-[#d7dce4] bg-[#eef0f4] text-[#45506a]',
  'brand.palette': 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  artboard: 'border-[#e9d8c4] bg-[#fff8ea] text-[#45506a]',
  deliverable: 'border-[#e9d8c4] bg-[#fffaf2] text-[#253048]',
};

const kindCopy: Record<string, string> = {
  'reference.image': '参考图',
  'generated.image': '这一版',
  text: '文本备注',
  'brand.palette': '品牌色板',
  artboard: '交付画板',
  deliverable: '准备交付',
};

export function MobileObjectStack({ objects, selectedObjectId, onSelect }: {
  objects: CreationObject[];
  selectedObjectId: string;
  onSelect: (id: string) => void;
}) {
  return <div data-testid="creation-board-object-stack" className="lg:hidden w-full max-w-full min-w-0 overflow-hidden rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2]/94 p-3 shadow-[0_16px_40px_rgba(37,48,72,0.09)]">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div>
        <b className="block text-sm text-[#253048]">已选对象</b>
        <span className="text-xs text-[#6b7488]">移动端不是简化版：横向切换对象，能力不减少。</span>
      </div>
      <Badge variant="outline" className="rounded-full border-[#d6e7df] bg-[#e7f1ec] px-2 py-0.5 text-[#486e64]">完整画布</Badge>
    </div>
    <div className="flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1">
      {objects.map((object) => <Button
        key={object.id}
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={object.id === selectedObjectId}
        className={cn(
          'h-auto min-w-[9.5rem] shrink-0 justify-start rounded-[1rem] px-3 py-2 text-left text-xs',
          chipTone[object.kind] ?? 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
          object.status === 'rejected' && 'opacity-35',
          object.id === selectedObjectId && 'ring-2 ring-[#b96a5c]/60',
        )}
        onClick={() => onSelect(object.id)}
      >
        <span className="grid gap-0.5">
          <b className="truncate text-[#253048]">{object.title}</b>
          <span className="truncate opacity-75">{kindCopy[object.kind] ?? '画布对象'}</span>
        </span>
      </Button>)}
    </div>
  </div>;
}
