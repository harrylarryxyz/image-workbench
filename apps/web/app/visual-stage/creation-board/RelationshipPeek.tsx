'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CreationObject, CreationRelation } from './types';

export function RelationshipPeek({ objects, relations, selectedObjectId }: {
  objects: CreationObject[];
  relations: CreationRelation[];
  selectedObjectId: string;
}) {
  const selected = objects.find((object) => object.id === selectedObjectId);
  const nearby = relations.filter((relation) => relation.sourceId === selectedObjectId || relation.targetId === selectedObjectId);
  const objectTitle = (id: string) => objects.find((object) => object.id === id)?.title ?? id;

  return <div data-testid="creation-board-relationship-peek" className="rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2]/88 p-3 shadow-[0_14px_36px_rgba(37,48,72,0.08)]">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div>
        <b className="block text-sm text-[#253048]">Relationship Peek</b>
        <span className="text-xs text-[#6b7488]">只展开当前对象附近关系，避免把手机变成缩小桌面。</span>
      </div>
      <Badge variant="outline" className="rounded-full border-[#f2d6cf] bg-[#f8e3dd] px-2 py-0.5 text-[#9e574c]">关系层</Badge>
    </div>
    <div className="grid gap-2 text-xs">
      {selected ? <div className="rounded-[0.9rem] border border-[#e9d8c4] bg-[#fff1de]/60 px-3 py-2 text-[#45506a]">当前：<b className="text-[#253048]">{selected.title}</b></div> : null}
      {nearby.length ? nearby.map((relation) => <div key={relation.id} className={cn('rounded-[0.9rem] border px-3 py-2', relation.selectedLineage ? 'border-[#f2d6cf] bg-[#f8e3dd]/70 text-[#9e574c]' : 'border-[#e9d8c4] bg-[#fff1de]/55 text-[#45506a]', relation.strength === 'faded' && 'opacity-45')}>
        <span className="font-semibold">{objectTitle(relation.sourceId)}</span>
        <span className="mx-2 text-[#9ba4b3]">→</span>
        <span className="font-semibold">{objectTitle(relation.targetId)}</span>
        <Badge variant="outline" className="ml-2 rounded-full border-current/20 px-1.5 py-0 text-[0.6rem]">{relation.type}</Badge>
      </div>) : <span className="text-[#9ba4b3]">暂无可见关系</span>}
    </div>
  </div>;
}
