'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { imageUrl } from '../../create-utils';
import { creationBoardObjects, creationBoardRelations } from './creation-board-fixtures';
import { CreationBoardCanvas } from './CreationBoardCanvas';
import { MobileObjectStack } from './MobileObjectStack';
import { ObjectInspector } from './ObjectInspector';
import { RelationshipPeek } from './RelationshipPeek';
import type { CreationObject, CreationRelation, CreationRelationType, SessionCanvasItem, SessionRelation } from './types';

function objectsFromSession(items: SessionCanvasItem[]): CreationObject[] {
  return items.map((item, index) => {
    const referenceSummary = item.references?.length ? `参考：${item.references.map((reference) => `${reference.label} · ${reference.role ?? '参考'}`).join('、')}` : '无显式参考';
    const branchSummary = `分支 ${item.branchCount ?? index + 1}`;
    const sourceNodeIds = item.parentObjectIds ?? item.references?.flatMap((reference) => reference.parentObjectIds ?? []) ?? [];
    return {
      id: item.sourceObjectId ?? `session-${item.id}`,
      kind: 'generated.image',
      title: `会话主图 · ${item.title}`,
      summary: item.intent ? `已加入画布。来自当前创作助手会话：${item.intent}。${referenceSummary}。${branchSummary}。` : `已加入画布。来自当前会话的已确认主图。${branchSummary}。`,
      position: { x: 1180 + index * 118, y: 70 + index * 150 },
      size: { width: 168, height: 132 },
      status: index === 0 ? 'champion' : 'active',
      asset: { assetUrl: imageUrl(item.image) ?? undefined, thumbnailUrl: imageUrl(item.image) ?? undefined },
      semantic: { slot: 'resultAnchor', priority: 78 - index * 8, borrow: ['当前会话感觉', '可继续作为参考'] },
      lineage: { sourceNodeIds, taskId: item.taskId },
    };
  });
}

function relationType(label?: string): CreationRelationType {
  if (label === 'edit' || label === 'variant' || label === 'reference' || label === 'adoption') return label;
  return 'generation';
}

function relationsFromSession(relations: SessionRelation[]): CreationRelation[] {
  return relations.map((relation, index) => ({
    id: `session-edge-${index}-${relation.from}-${relation.to}`,
    sourceId: relation.from,
    targetId: relation.to,
    type: relationType(relation.label),
    strength: 'primary',
    selectedLineage: true,
  }));
}

function selectedContextCopy(object?: CreationObject) {
  if (!object) return '未进入对象上下文：长按画布对象，即可带着它进入创作助手。';
  if (object.kind === 'text') return `正在编辑标题文本：${object.title}`;
  if (object.kind === 'reference.image') return `正在基于参考图：${object.title}`;
  if (object.kind === 'generated.image') return `正在基于生成图：${object.title}`;
  if (object.kind === 'brand.palette') return `正在约束品牌对象：${object.title}`;
  if (object.kind === 'artboard') return `正在调整交付画板：${object.title}`;
  return `正在基于 ${object.title}`;
}

export function CreationBoard({ canvasItems, sessionRelations, onReuseCanvasItem, onUseObjectInAssistant }: {
  canvasItems?: SessionCanvasItem[];
  sessionRelations?: SessionRelation[];
  onReuseCanvasItem?: (item: SessionCanvasItem) => void;
  onUseObjectInAssistant?: (object: CreationObject) => void;
}) {
  const [selectedObjectId, setSelectedObjectId] = useState('text-title-1');
  const [inspectorOpenObjectId, setInspectorOpenObjectId] = useState<string | null>(null);
  const [assistantContextObjectId, setAssistantContextObjectId] = useState<string | null>(null);
  const sessionObjects = useMemo(() => objectsFromSession(canvasItems ?? []), [canvasItems]);
  const sessionLineageRelations = useMemo(() => relationsFromSession(sessionRelations ?? []), [sessionRelations]);
  const objects = useMemo(() => [...creationBoardObjects, ...sessionObjects], [sessionObjects]);
  const relations = useMemo(() => [...creationBoardRelations, ...sessionLineageRelations], [sessionLineageRelations]);
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? objects[0];
  const inspectorObject = objects.find((object) => object.id === inspectorOpenObjectId) ?? undefined;
  const assistantContextObject = objects.find((object) => object.id === assistantContextObjectId) ?? undefined;
  const latestCanvasItem = canvasItems?.[0];

  function openDetails(id: string) {
    setSelectedObjectId(id);
    setInspectorOpenObjectId(id);
  }

  function useObjectInAssistant(id: string) {
    setSelectedObjectId(id);
    setAssistantContextObjectId(id);
    const object = objects.find((item) => item.id === id);
    if (object) onUseObjectInAssistant?.(object);
  }

  return <section data-testid="creation-board-shell" data-phase="live-wysiwyg-infinite-canvas" className="grid w-full max-w-full min-w-0 overflow-hidden gap-4">
    <Card className="w-full max-w-full min-w-0 overflow-hidden rounded-[1.7rem] border-[#e9d8c4]/90 bg-[#fffaf2]/92 shadow-[0_20px_54px_rgba(37,48,72,0.10)]">
      <CardContent className="w-full max-w-full min-w-0 overflow-hidden p-4 md:p-5">
        <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-[#253048] px-3 py-1 text-[#fffaf2]">Creation Board</Badge>
              <Badge variant="outline" className="rounded-full border-[#f2d6cf] bg-[#f8e3dd] px-3 py-1 text-[#9e574c]">创作案板</Badge>
              <Badge variant="outline" className="rounded-full border-[#d6e7df] bg-[#e7f1ec] px-3 py-1 text-[#486e64]">WYSIWYG</Badge>
            </div>
            <h2 className="text-2xl font-extrabold tracking-[-0.055em] text-[#253048] md:text-3xl">把对话结果沉淀成可操作画布</h2>
            <p className="max-w-3xl text-sm leading-6 text-[#6b7488]">
              文本对象、图片对象、品牌对象、交付画板都在同一张画布里；关系层可见但不工程化，单击打开详情，长按进入创作助手上下文。
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-3 py-1 text-[#45506a]">技术诊断细节不外露</Badge>
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,3.15fr)_minmax(320px,1fr)]">
          <div className="min-w-0 overflow-x-auto overflow-y-hidden rounded-[1.6rem] border border-[#e9d8c4] bg-[#fff1de]/48 p-2" aria-label="创作案板横向画布区域">
            <CreationBoardCanvas
              objects={objects}
              relations={relations}
              selectedObjectId={selectedObject?.id ?? selectedObjectId}
              onShowDetails={openDetails}
              onUseInAssistant={useObjectInAssistant}
            />
          </div>

          <aside className="hidden min-w-0 content-start gap-3 lg:grid">
            <div data-testid="creation-assistant-context" className="rounded-[1.35rem] border border-[#f2d6cf] bg-[#f8e3dd]/68 p-3 shadow-[0_14px_36px_rgba(37,48,72,0.08)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <b className="text-[#253048]">创作助手上下文</b>
                <Badge variant="outline" className="rounded-full border-[#f2d6cf] bg-[#fffaf2]/70 px-2 py-0.5 text-[#9e574c]">长按进入创作助手</Badge>
              </div>
              <p className="mb-2 text-sm leading-6 text-[#9e574c]">{selectedContextCopy(assistantContextObject)}</p>
              <Textarea
                readOnly
                value={assistantContextObject ? `已带入「${assistantContextObject.title}」：可以直接说“保持这个感觉继续”“把标题改克制”“重排交付画板”。` : '长按任意对象后，它会进入创作助手输入框；系统自动判断变量替换、视觉锚点、文本改写或画板重排。'}
                aria-label="创作助手上下文示例"
                className="min-h-24 resize-none border-[#f2d6cf] bg-[#fffaf2]/72 text-sm text-[#45506a] shadow-none focus-visible:ring-[#b96a5c]/25"
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b7488]">
                {['换产品', '保持感觉', '改标题', '局部修', '同系列三张'].map((item) => <Badge key={item} variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fffaf2]/70 px-2 py-1 text-[#45506a]">{item}</Badge>)}
              </div>
            </div>

            <ObjectInspector object={inspectorObject} relations={relations} />
            <RelationshipPeek objects={objects} relations={relations} selectedObjectId={selectedObject?.id ?? selectedObjectId} />
            {latestCanvasItem ? <Button type="button" variant="outline" className={cn('h-auto rounded-[1rem] border-[#d6e7df] bg-[#e7f1ec] px-3 py-2 text-left text-[#486e64] hover:bg-[#fffaf2]')} onClick={() => onReuseCanvasItem?.(latestCanvasItem)}>
              把当前主图作为 @图片 继续参考
            </Button> : null}
          </aside>
        </div>
      </CardContent>
    </Card>

    <div className="grid w-full max-w-full min-w-0 gap-3 overflow-hidden lg:hidden">
      <div className="rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2]/94 p-3 shadow-[0_16px_40px_rgba(37,48,72,0.09)]">
        <b className="block text-sm text-[#253048]">Focus Lens</b>
        <p className="text-xs leading-5 text-[#6b7488]">移动端聚焦当前对象，不减少编辑能力；Bottom Inspector 承接详情，Relationship Peek 承接关系。</p>
      </div>
      <MobileObjectStack objects={objects} selectedObjectId={selectedObject?.id ?? selectedObjectId} onSelect={openDetails} />
      <ObjectInspector object={inspectorObject} relations={relations} />
      <RelationshipPeek objects={objects} relations={relations} selectedObjectId={selectedObject?.id ?? selectedObjectId} />
      {latestCanvasItem ? <Button type="button" variant="outline" className={cn('h-auto rounded-[1rem] border-[#d6e7df] bg-[#e7f1ec] px-3 py-2 text-left text-[#486e64] hover:bg-[#fffaf2]')} onClick={() => onReuseCanvasItem?.(latestCanvasItem)}>
        把当前主图作为 @图片 继续参考
      </Button> : null}
    </div>
  </section>;
}
