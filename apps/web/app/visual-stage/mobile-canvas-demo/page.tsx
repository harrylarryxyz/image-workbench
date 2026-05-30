import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: '移动端创作案板布局演示 — Image Workbench',
  description: 'Mobile-native infinite canvas layout preview. Static, no AI calls.',
};

type MobileTone = 'reference' | 'generated' | 'text' | 'brand' | 'artboard' | 'control';
type MobileObject = {
  id: string;
  kind: 'reference' | 'generated' | 'text' | 'brand' | 'artboard' | 'brief';
  tone: MobileTone;
  label: string;
  short: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected?: boolean;
  champion?: boolean;
  discarded?: boolean;
};

const tone = {
  reference: 'border-[#f4cbd0] bg-[#fde9ec] text-[#8f5960]',
  generated: 'border-[#eba9a7] bg-[#ffd5d1] text-[#913f3f]',
  text: 'border-[#cfd3da] bg-[#edf0f4] text-[#4d5666]',
  brand: 'border-[#cadfd6] bg-[#e7f1ec] text-[#456f63]',
  artboard: 'border-[#e7d2b8] bg-[#fff4df] text-[#715c43]',
  control: 'border-[#d9c2a7] bg-[#fffaf2] text-[#45506a]',
};

const mobileLayerLegend = [
  { label: '淡粉色参考图', tone: 'reference', dot: 'bg-[#fde9ec] border-[#f4cbd0]' },
  { label: '桃粉色生成图', tone: 'generated', dot: 'bg-[#ffd5d1] border-[#eba9a7]' },
  { label: '灰色系文字', tone: 'text', dot: 'bg-[#edf0f4] border-[#cfd3da]' },
  { label: '废弃 flow 透明度', tone: 'control', dot: 'bg-[#9ba4b3]/35 border-[#9ba4b3]/20' },
];

const mobileCanvasObjects = [
  { id: 'brief', kind: 'brief', tone: 'control', label: 'Brief', short: '目标', x: 38, y: 34, w: 118, h: 66 },
  { id: 'ref-a', kind: 'reference', tone: 'reference', label: '产品参考', short: 'Ref A', x: 72, y: 150, w: 112, h: 86 },
  { id: 'ref-b', kind: 'reference', tone: 'reference', label: '氛围参考', short: 'Ref B', x: 220, y: 112, w: 102, h: 76 },
  { id: 'prompt', kind: 'text', tone: 'text', label: 'Prompt', short: '文案', x: 356, y: 58, w: 124, h: 64 },
  { id: 'brand', kind: 'brand', tone: 'brand', label: '品牌色板', short: '色板', x: 516, y: 110, w: 112, h: 64 },
  { id: 'draft-a', kind: 'generated', tone: 'generated', label: '生成 A', short: 'Gen A', x: 232, y: 282, w: 118, h: 92, discarded: true },
  { id: 'draft-b', kind: 'generated', tone: 'generated', label: '冠军图', short: 'Gen B', x: 398, y: 242, w: 154, h: 118, selected: true, champion: true },
  { id: 'draft-c', kind: 'generated', tone: 'generated', label: '生成 C', short: 'Gen C', x: 584, y: 310, w: 106, h: 82, discarded: true },
  { id: 'title', kind: 'text', tone: 'text', label: '标题文字', short: '标题', x: 390, y: 404, w: 146, h: 58 },
  { id: 'note', kind: 'text', tone: 'text', label: '反馈批注', short: '批注', x: 564, y: 478, w: 114, h: 62 },
  { id: 'board-xhs', kind: 'artboard', tone: 'artboard', label: '小红书画板', short: '画板1', x: 150, y: 540, w: 150, h: 110 },
  { id: 'board-poster', kind: 'artboard', tone: 'artboard', label: '海报画板', short: '画板2', x: 358, y: 572, w: 146, h: 116 },
  { id: 'export', kind: 'brief', tone: 'control', label: '交付包', short: '导出', x: 560, y: 648, w: 104, h: 60 },
] satisfies MobileObject[];

const mobileFlowEdges = [
  { id: 'brief-prompt', label: '生成', x: 144, y: 86, w: 225, rotate: -5, discarded: false },
  { id: 'ref-a-b', label: '参考', x: 176, y: 222, w: 244, rotate: 18, discarded: false },
  { id: 'ref-b-b', label: '参考', x: 308, y: 184, w: 152, rotate: 24, discarded: false },
  { id: 'a-old', label: '废弃', x: 348, y: 338, w: 96, rotate: -24, discarded: true, styleClass: 'opacity-35' },
  { id: 'b-title', label: '绑定', x: 472, y: 360, w: 58, rotate: 76, discarded: false },
  { id: 'b-board', label: '采纳', x: 306, y: 522, w: 154, rotate: 142, discarded: false },
  { id: 'brand-board', label: '约束', x: 500, y: 558, w: 130, rotate: 24, discarded: false },
] satisfies Array<{ id: string; label: string; x: number; y: number; w: number; rotate: number; discarded: boolean; styleClass?: string }>;

function CanvasGlyph({ object }: { object: MobileObject }) {
  const isImage = object.kind === 'reference' || object.kind === 'generated' || object.kind === 'artboard';
  return <article
    className={cn(
      'absolute overflow-hidden rounded-[1.05rem] border px-2.5 py-2 shadow-[0_10px_28px_rgba(37,48,72,0.10)]',
      tone[object.tone],
      object.selected && 'ring-4 ring-[#b96a5c]/22 shadow-[0_20px_45px_rgba(185,106,92,0.18)]',
      object.champion && 'border-[#b96a5c]',
      object.discarded && 'opacity-45 grayscale-[0.15]',
    )}
    style={{ left: object.x, top: object.y, width: object.w, height: object.h }}
  >
    <div className="flex items-center justify-between gap-1">
      <span className="truncate text-[0.62rem] font-bold uppercase tracking-[0.12em] opacity-65">{object.kind}</span>
      {object.champion ? <span className="rounded-full bg-[#253048] px-1.5 py-0.5 text-[0.56rem] font-bold text-[#fffaf2]">主</span> : null}
    </div>
    {isImage ? <div className="mt-1.5 h-[42%] rounded-[0.75rem] border border-current/15 bg-[radial-gradient(circle_at_30%_24%,rgba(255,250,242,0.95),transparent_28%),linear-gradient(145deg,rgba(255,250,242,0.6),rgba(185,106,92,0.18))]" /> : null}
    {object.kind === 'brand' ? <div className="mt-2 flex gap-1">{['#fffaf2', '#b96a5c', '#5b8277'].map((color) => <span key={color} className="h-5 flex-1 rounded-full border border-current/10" style={{ background: color }} />)}</div> : null}
    <b className="absolute bottom-2 left-2 right-2 truncate text-[0.82rem] tracking-[-0.02em]">{object.short}</b>
  </article>;
}

function MobileCanvas() {
  return <section className="relative h-[calc(100svh-14.5rem)] min-h-[31rem] overflow-hidden rounded-[1.7rem] border border-[#e9d8c4] bg-[#fffaf2]/70 shadow-[inset_0_1px_0_rgba(255,250,242,0.86)]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(37,48,72,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,48,72,0.045)_1px,transparent_1px)] bg-[size:28px_28px]" />
    <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/92 px-2.5 py-1.5 shadow-[0_10px_24px_rgba(37,48,72,0.08)] backdrop-blur">
      <Badge className="rounded-full bg-[#253048] text-[#fffaf2]">无限画布</Badge>
      <span className="text-[0.66rem] font-semibold text-[#6b7488]">42% · 全局</span>
    </div>
    <div className="absolute right-3 top-3 z-30 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/92 px-2.5 py-1.5 text-[0.66rem] font-semibold text-[#9e574c] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">Focus Lens</div>

    <div className="absolute left-1/2 top-[3.6rem] h-[760px] w-[720px] origin-top -translate-x-1/2 scale-[0.48] sm:scale-[0.54]">
      <div className="absolute inset-0 rounded-[2.5rem] border border-[#e9d8c4]/70 bg-[#fff1de]/28" />
      {mobileFlowEdges.map((edge) => <div
        key={edge.id}
        className={cn(
          'absolute z-0 border-t-2 border-dashed border-[#b96a5c]/55',
          edge.discarded ? 'opacity-35' : 'opacity-80',
          edge.styleClass,
        )}
        style={{ left: edge.x, top: edge.y, width: edge.w, transform: `rotate(${edge.rotate}deg)` }}
      >
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/94 px-2 py-0.5 text-[0.6rem] font-bold text-[#6b7488]">{edge.label}</span>
      </div>)}
      <div className="absolute inset-0 z-10">
        {mobileCanvasObjects.map((object) => <CanvasGlyph key={object.id} object={object} />)}
      </div>
    </div>

    <div className="absolute bottom-3 left-3 right-3 z-40 flex gap-2 overflow-x-auto rounded-[1.1rem] border border-[#e9d8c4] bg-[#fffaf2]/94 p-2 shadow-[0_16px_34px_rgba(37,48,72,0.11)] backdrop-blur [scrollbar-width:none]">
      {mobileLayerLegend.map((item) => <span key={item.label} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9d8c4] bg-[#fffaf2] px-2.5 py-1 text-[0.66rem] font-semibold text-[#45506a]">
        <i className={cn('h-3 w-3 rounded-full border', item.dot)} />{item.label}
      </span>)}
    </div>
  </section>;
}

function BottomInspector() {
  return <Card className="rounded-t-[1.65rem] rounded-b-[1.15rem] border-[#e9d8c4] bg-[#fffaf2]/96 py-0 shadow-[0_-14px_45px_rgba(37,48,72,0.10)]">
    <CardContent className="space-y-3 p-3">
      <div className="mx-auto h-1 w-10 rounded-full bg-[#d9c2a7]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#9e574c]">Bottom Inspector · 选择具体模块后展开详情</p>
          <h2 className="mt-1 truncate text-lg font-semibold tracking-[-0.045em] text-[#253048]">Gen B · 冠军生成图</h2>
        </div>
        <Badge className="rounded-full bg-[#ffd5d1] text-[#913f3f]">桃粉色生成图</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['来源链', '局部改', '做变体'].map((action, index) => <Button key={action} size="sm" variant={index === 0 ? 'default' : 'outline'} className={cn('h-9 rounded-full text-xs', index === 0 ? 'bg-[#253048] text-[#fffaf2] hover:bg-[#303b55]' : 'border-[#d9c2a7] bg-[#fffaf2] text-[#45506a] hover:bg-[#fff1de]')}>{action}</Button>)}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 rounded-[1rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-3 text-xs leading-5 text-[#45506a]">
        <span><b className="text-[#253048]">Object Stack：</b>画布只保留短标签；长说明进面板。</span>
        <span className="rounded-full border border-[#d6e7df] bg-[#e7f1ec] px-2 py-1 font-semibold text-[#456f63]">Relationship Peek</span>
      </div>
    </CardContent>
  </Card>;
}

function ObjectStack() {
  return <section aria-label="底部对象面板" className="space-y-1.5">
    <p className="px-1 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#6b7488]">底部对象面板 · Object Stack</p>
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {mobileCanvasObjects.filter((object) => ['reference', 'generated', 'text', 'artboard'].includes(object.kind)).slice(0, 8).map((object) => <button key={object.id} className={cn('min-w-[4.8rem] rounded-[1rem] border px-2 py-2 text-left shadow-sm', tone[object.tone], object.selected && 'ring-2 ring-[#b96a5c]/25')}>
        <span className="block truncate text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-65">{object.kind}</span>
        <b className="mt-1 block truncate text-xs">{object.short}</b>
      </button>)}
    </div>
  </section>;
}

export default function MobileCanvasDemoPage() {
  return <div className="full-bleed-page immersive-visual-stage-page">
    <main data-preview-route="mobile-canvas-demo" className="relative min-h-screen overflow-hidden bg-[#fff1de] text-[#253048]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(185,106,92,0.13),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(91,130,119,0.16),transparent_30%),linear-gradient(145deg,#fff1de,#fffaf2_52%,#ead7c0)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[430px] flex-col gap-2 px-3 py-3">
        <header className="flex items-center justify-between gap-2 rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2]/88 px-3 py-2 shadow-[0_12px_28px_rgba(37,48,72,0.08)] backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="rounded-full bg-[#253048] text-[#fffaf2]">创作案板</Badge>
              <span className="truncate text-[0.66rem] font-semibold text-[#9e574c]">移动端不是简化版</span>
            </div>
            <p className="mt-1 truncate text-[0.68rem] font-semibold text-[#6b7488]">寸土寸金：画布只显示必要信息块，详情进面板</p>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 shrink-0 rounded-full border-[#d9c2a7] bg-[#fffaf2] px-3 text-xs text-[#45506a] hover:bg-[#fff1de]"><Link href="/visual-stage/canvas-board-demo">桌面版</Link></Button>
        </header>

        <MobileCanvas />
        <ObjectStack />
        <BottomInspector />

        <section className="sr-only">
          <h2>移动端布局原则</h2>
          <p>移动端不是简化版，而是用 Focus Lens、Object Stack、Relationship Peek、Bottom Inspector 完成完整复杂能力。</p>
          <p>信息块是背景块，用于区分不同模块；如果需要进一步信息，选择具体模块后展开详情面板。</p>
        </section>
      </div>
    </main>
  </div>;
}
