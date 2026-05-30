'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { creationBoardObjects, creationBoardRelations } from './creation-board-fixtures';
import { CreationBoardCanvas } from './CreationBoardCanvas';
import { MobileObjectStack } from './MobileObjectStack';
import { ObjectInspector } from './ObjectInspector';
import { RelationshipPeek } from './RelationshipPeek';
import type { CreationObject, SessionCanvasItem } from './types';

function objectsFromSession(items: SessionCanvasItem[]): CreationObject[] {
  return items.slice(0, 2).map((item, index) => ({
    id: `session-${item.id}`,
    kind: 'generated.image',
    title: `会话主图 · ${item.title}`,
    summary: item.intent ? `来自当前创作助手会话：${item.intent}` : '来自当前会话的已确认主图。',
    position: { x: 1180 + index * 118, y: 70 + index * 150 },
    size: { width: 168, height: 132 },
    status: index === 0 ? 'champion' : 'active',
    asset: { assetUrl: item.image?.assetUrl },
    semantic: { slot: 'resultAnchor', priority: 78 - index * 8, borrow: ['当前会话感觉', '可继续作为参考'] },
  }));
}

function selectedContextCopy(object?: CreationObject) {
  if (!object) return '未选择对象：可以先单击对象，再对创作助手说人话。';
  if (object.kind === 'text') return `正在编辑标题文本：${object.title}`;
  if (object.kind === 'reference.image') return `正在基于参考图：${object.title}`;
  if (object.kind === 'generated.image') return `正在基于生成图：${object.title}`;
  if (object.kind === 'brand.palette') return `正在约束品牌对象：${object.title}`;
  if (object.kind === 'artboard') return `正在调整交付画板：${object.title}`;
  return `正在基于 ${object.title}`;
}

export function CreationBoard({ canvasItems, onReuseCanvasItem }: {
  canvasItems?: SessionCanvasItem[];
  onReuseCanvasItem?: (item: SessionCanvasItem) => void;
}) {
  const [selectedObjectId, setSelectedObjectId] = useState('text-title-1');
  const [inspectorOpenObjectId, setInspectorOpenObjectId] = useState('text-title-1');
  const sessionObjects = useMemo(() => objectsFromSession(canvasItems ?? []), [canvasItems]);
  const objects = useMemo(() => [...creationBoardObjects, ...sessionObjects], [sessionObjects]);
  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? objects[0];
  const inspectorObject = objects.find((object) => object.id === inspectorOpenObjectId) ?? selectedObject;
  const latestCanvasItem = canvasItems?.[0];

  function selectObject(id: string) {
    setSelectedObjectId(id);
  }

  function openInspector(id: string) {
    setSelectedObjectId(id);
    setInspectorOpenObjectId(id);
  }

  return <section data-testid="creation-board-shell" data-phase="phase-1-static-wysiwyg" className="grid w-full max-w-full min-w-0 overflow-hidden gap-4">
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
              文本对象、图片对象、品牌对象、交付画板都在同一张画布里；关系层可见但不工程化，创作助手上下文由单击对象带入。
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-3 py-1 text-[#45506a]">技术诊断细节不外露</Badge>
        </div>

        <div className="hidden min-w-0 gap-4 lg:grid xl:grid-cols-[minmax(0,3.15fr)_minmax(320px,1fr)]">
          <div className="min-w-0 overflow-x-auto overflow-y-hidden rounded-[1.6rem] border border-[#e9d8c4] bg-[#fff1de]/48 p-2" aria-label="创作案板横向画布区域">
            <CreationBoardCanvas
              objects={objects}
              relations={creationBoardRelations}
              selectedObjectId={selectedObject?.id ?? selectedObjectId}
              onSelectObject={selectObject}
              onOpenInspector={openInspector}
            />
          </div>

          <aside className="grid min-w-0 content-start gap-3">
            <div className="rounded-[1.35rem] border border-[#f2d6cf] bg-[#f8e3dd]/68 p-3 shadow-[0_14px_36px_rgba(37,48,72,0.08)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <b className="text-[#253048]">创作助手上下文</b>
                <Badge variant="outline" className="rounded-full border-[#f2d6cf] bg-[#fffaf2]/70 px-2 py-0.5 text-[#9e574c]">单击对象</Badge>
              </div>
              <p className="mb-2 text-sm leading-6 text-[#9e574c]">{selectedContextCopy(selectedObject)}</p>
              <Textarea
                readOnly
                value="示例：把产品换成这张，其他感觉保持。系统会自动判断变量替换、视觉锚点、文本改写或画板重排。"
                aria-label="创作助手上下文示例"
                className="min-h-24 resize-none border-[#f2d6cf] bg-[#fffaf2]/72 text-sm text-[#45506a] shadow-none focus-visible:ring-[#b96a5c]/25"
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b7488]">
                {['换产品', '保持感觉', '改标题', '局部修', '同系列三张'].map((item) => <Badge key={item} variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fffaf2]/70 px-2 py-1 text-[#45506a]">{item}</Badge>)}
              </div>
            </div>

            <ObjectInspector object={inspectorObject} relations={creationBoardRelations} />
            <RelationshipPeek objects={objects} relations={creationBoardRelations} selectedObjectId={selectedObject?.id ?? selectedObjectId} />
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
      <MobileObjectStack objects={objects} selectedObjectId={selectedObject?.id ?? selectedObjectId} onSelect={selectObject} />
      <ObjectInspector object={inspectorObject} relations={creationBoardRelations} />
      <RelationshipPeek objects={objects} relations={creationBoardRelations} selectedObjectId={selectedObject?.id ?? selectedObjectId} />
    </div>
  </section>;
}
