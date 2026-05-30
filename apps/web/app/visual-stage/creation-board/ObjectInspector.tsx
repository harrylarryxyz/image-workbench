'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CreationObject, CreationRelation, CreationRelationType } from './types';

const actionCopy: Record<string, string> = {
  'reference.image': '把这张作为产品/风格/背景参考',
  'generated.image': '保持这个感觉继续出同系列',
  text: '改高级一点，不要太营销',
  'brand.palette': '沿用品牌色，不改变识别度',
  artboard: '适配小红书 3:4 或社媒 1:1',
};

const relationCopy: Record<CreationRelationType, string> = {
  reference: '参考了这张',
  generation: '由这版改来',
  variant: '同系列',
  edit: '按意见改过',
  'text-binding': '文字贴在这版上',
  'brand-constraint': '沿用品牌要求',
  adoption: '准备交付',
  export: '已经整理好',
};

export function ObjectInspector({ object, relations }: { object?: CreationObject; relations: CreationRelation[] }) {
  if (!object) {
    return <Card className="rounded-[1.35rem] border-[#e9d8c4] bg-[#fffaf2]/88 shadow-[0_14px_36px_rgba(37,48,72,0.08)]">
      <CardContent className="grid gap-2 p-4 text-sm text-[#6b7488]">
        <b className="text-[#253048]">详情卡</b>
        <span>单击打开详情后，这里会显示这张图/这段文字的说明和来源；长按对象会进入创作助手上下文。</span>
      </CardContent>
    </Card>;
  }

  const localRelations = relations.filter((relation) => relation.sourceId === object.id || relation.targetId === object.id);
  const contextAction = actionCopy[object.kind] ?? '基于这个对象继续创作';
  const keepList = object.semantic?.borrow?.length ? object.semantic.borrow.join('、') : '保留当前感觉';
  const statusCopy = object.status === 'champion' ? '当前最好' : object.status === 'rejected' ? '已放弃' : '可继续尝试';

  return <Card data-testid="creation-object-inspector" className="rounded-[1.35rem] border-[#e9d8c4] bg-[#fffaf2]/94 shadow-[0_18px_42px_rgba(37,48,72,0.10)]">
    <CardContent className="grid gap-4 p-4">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-[#f2d6cf] bg-[#f8e3dd] px-2 py-0.5 text-[#9e574c]">创作助手上下文</Badge>
          <Badge variant="outline" className="rounded-full border-[#d6e7df] bg-[#e7f1ec] px-2 py-0.5 text-[#486e64]">单击打开详情</Badge>
          <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-2 py-0.5 text-[#45506a]">{statusCopy}</Badge>
        </div>
        <h3 className="text-lg font-bold tracking-[-0.035em] text-[#253048]">{object.title}</h3>
        <p className="text-sm leading-6 text-[#6b7488]">{object.summary}</p>
      </div>

      <div className="rounded-[1rem] border border-[#f2d6cf] bg-[#f8e3dd]/62 p-3 text-sm text-[#9e574c]">
        <b className="block text-[#253048]">下一句可以直接说：</b>
        <span>{contextAction}</span>
      </div>

      {object.text ? <div className="rounded-[1rem] border border-[#d7dce4] bg-[#eef0f4] p-3 text-sm text-[#45506a]">
        <b className="block text-[#253048]">文本备注</b>
        <span>{object.text.content}</span>
      </div> : null}

      <div className="grid grid-cols-2 gap-2 text-xs text-[#45506a]">
        <div className="rounded-[0.9rem] border border-[#e9d8c4] bg-[#fff1de]/62 p-2">
          <b className="block text-[#253048]">需要保留</b>
          {keepList}
        </div>
        <div className="rounded-[0.9rem] border border-[#e9d8c4] bg-[#fff1de]/62 p-2">
          <b className="block text-[#253048]">继续方式</b>
          直接用自然语言说修改意见
        </div>
      </div>

      <div className="grid gap-2">
        <b className="text-sm text-[#253048]">来源说明</b>
        <div className="flex flex-wrap gap-2">
          {localRelations.length ? localRelations.map((relation) => <Badge key={relation.id} variant="outline" className={cn('rounded-full px-2 py-1 text-[0.68rem]', relation.selectedLineage ? 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]' : 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]')}>{relationCopy[relation.type]}</Badge>) : <span className="text-xs text-[#9ba4b3]">暂无来源说明</span>}
        </div>
      </div>

      <p className="text-xs leading-5 text-[#9ba4b3]">单击打开详情卡；长按对象会把它带入创作助手。只保留能继续创作的说明。</p>
    </CardContent>
  </Card>;
}
