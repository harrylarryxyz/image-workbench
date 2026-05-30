import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Canvas-first 创作案板演示 — Image Workbench',
  description: 'Static WYSIWYG canvas-first Creation Board preview. No AI calls.',
};

const vi = {
  shell: 'relative min-w-0 overflow-hidden bg-[#fff1de] text-[#253048]',
  wash: 'absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(185,106,92,0.14),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(91,130,119,0.18),transparent_28%),linear-gradient(145deg,#fff1de_0%,#fffaf2_48%,#ead5bf_100%)]',
  grain: 'absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.12)_1px,transparent_0)] bg-[size:24px_24px] opacity-30 [mask-image:linear-gradient(to_bottom,rgba(37,48,72,0.54),rgba(37,48,72,0.04))]',
  card: 'border-[#e9d8c4]/90 bg-[#fffaf2]/92 shadow-[0_18px_45px_rgba(37,48,72,0.08)] backdrop-blur',
  raised: 'border-[#e9d8c4]/90 bg-[#fffaf2]/96 shadow-[0_26px_72px_rgba(37,48,72,0.13),0_8px_24px_rgba(37,48,72,0.07)]',
  ink: 'bg-[#253048] text-[#fffaf2]',
  coral: 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  sage: 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  paper: 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
};

type CanvasObject = {
  id: string;
  kind: 'brief' | 'reference' | 'image' | 'text' | 'brand' | 'task' | 'artboard';
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: 'paper' | 'coral' | 'sage' | 'ink';
  selected?: boolean;
  faded?: boolean;
  champion?: boolean;
  subtitle: string;
};

const canvasObjects = [
  { id: 'brief', kind: 'brief', label: '设计层 · 项目 Brief', subtitle: '温润修护精华 · 春季主视觉', x: 4, y: 8, w: 22, h: 13, tone: 'paper' },
  { id: 'ref-product', kind: 'reference', label: '参考语义对象', subtitle: '产品参考：瓶身比例不可变', x: 5, y: 28, w: 17, h: 18, tone: 'sage' },
  { id: 'ref-mood', kind: 'reference', label: '氛围参考', subtitle: '只借暖纸质感与留白', x: 24, y: 31, w: 15, h: 15, tone: 'coral' },
  { id: 'brand', kind: 'brand', label: '品牌色板对象', subtitle: 'Paper / Ink / Coral / Sage', x: 4, y: 53, w: 22, h: 12, tone: 'sage' },
  { id: 'prompt', kind: 'text', label: 'Prompt 文本对象', subtitle: '低饱和杂志页，瓶身居中，纸面阴影', x: 31, y: 10, w: 23, h: 13, tone: 'paper' },
  { id: 'draft-a', kind: 'image', label: '初稿 A', subtitle: '像参考，但产品弱', x: 44, y: 30, w: 16, h: 16, tone: 'paper', faded: true },
  { id: 'draft-b', kind: 'image', label: '冠军路径 · 初稿 B', subtitle: '构图稳，标题空间够', x: 63, y: 24, w: 22, h: 23, tone: 'coral', champion: true },
  { id: 'draft-c', kind: 'image', label: '废弃分支 · 初稿 C', subtitle: '商业但太硬', x: 84, y: 38, w: 13, h: 14, tone: 'paper', faded: true },
  { id: 'title', kind: 'text', label: '标题文本对象', subtitle: '温润修护 · 春季限定', x: 61, y: 8, w: 25, h: 11, tone: 'ink', selected: true },
  { id: 'note', kind: 'text', label: '反馈批注文本对象', subtitle: '标题再高级一点，产品高光收一点', x: 66, y: 52, w: 22, h: 11, tone: 'paper' },
  { id: 'edit-task', kind: 'task', label: 'Lineage / Flow · 局部修改', subtitle: '标题绑定 + 产品高光微调', x: 40, y: 57, w: 20, h: 10, tone: 'coral' },
  { id: 'art-xhs', kind: 'artboard', label: '交付画板对象', subtitle: '小红书首图 3:4', x: 27, y: 70, w: 21, h: 18, tone: 'sage' },
  { id: 'art-poster', kind: 'artboard', label: '海报交付画板', subtitle: '线下竖版海报', x: 52, y: 72, w: 20, h: 18, tone: 'paper' },
  { id: 'export', kind: 'task', label: '导出包', subtitle: '冠军图 + 文本 + 色板 + 画板', x: 78, y: 73, w: 17, h: 12, tone: 'ink' },
] satisfies CanvasObject[];

const lineageEdges = [
  { from: 'brief', to: 'prompt', type: '生成', className: 'left-[25%] top-[16%] w-[10%] rotate-[-8deg] border-solid border-[#253048]/35' },
  { from: 'ref-product', to: 'draft-b', type: '参考', className: 'left-[21%] top-[39%] w-[43%] rotate-[-9deg] border-dashed border-[#5b8277]/55' },
  { from: 'ref-mood', to: 'draft-b', type: '参考', className: 'left-[38%] top-[42%] w-[27%] rotate-[-8deg] border-dashed border-[#b96a5c]/55' },
  { from: 'prompt', to: 'draft-a', type: '生成', className: 'left-[52%] top-[26%] w-[11%] rotate-[47deg] border-solid border-[#253048]/30' },
  { from: 'prompt', to: 'draft-b', type: '生成', className: 'left-[53%] top-[22%] w-[14%] rotate-[16deg] border-solid border-[#253048]/35' },
  { from: 'draft-b', to: 'title', type: '文本绑定', className: 'left-[72%] top-[21%] w-[7%] rotate-[-76deg] border-solid border-[#b96a5c]/80 border-t-2' },
  { from: 'draft-b', to: 'edit-task', type: '编辑', className: 'left-[57%] top-[55%] w-[12%] rotate-[154deg] border-solid border-[#b96a5c]/80 border-t-2' },
  { from: 'draft-b', to: 'art-xhs', type: '采纳', className: 'left-[47%] top-[68%] w-[21%] rotate-[145deg] border-solid border-[#b96a5c]/80 border-t-2' },
  { from: 'brand', to: 'art-poster', type: '品牌约束', className: 'left-[25%] top-[66%] w-[29%] rotate-[24deg] border-dashed border-[#5b8277]/60' },
  { from: 'art-poster', to: 'export', type: '导出', className: 'left-[71%] top-[83%] w-[8%] rotate-[0deg] border-solid border-[#253048]/50' },
];

const toneClass = {
  paper: 'border-[#e9d8c4] bg-[#fffaf2]/88 text-[#45506a]',
  coral: 'border-[#e5b8ae] bg-[#f8e3dd]/88 text-[#9e574c]',
  sage: 'border-[#c5dbd3] bg-[#e7f1ec]/88 text-[#486e64]',
  ink: 'border-[#253048] bg-[#253048]/94 text-[#fffaf2]',
};

function ObjectPreview({ object }: { object: CanvasObject }) {
  if (object.kind === 'image' || object.kind === 'reference' || object.kind === 'artboard') {
    return <div className="mb-2 h-12 overflow-hidden rounded-[0.9rem] border border-current/15 bg-[linear-gradient(145deg,#fffaf2,#f8e3dd_48%,#e7f1ec)]">
      <div className="h-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,250,242,0.96),transparent_25%),radial-gradient(circle_at_68%_32%,rgba(91,130,119,0.20),transparent_28%),linear-gradient(145deg,rgba(37,48,72,0.06),rgba(185,106,92,0.18))]" />
    </div>;
  }
  if (object.kind === 'brand') {
    return <div className="mb-2 flex gap-1.5">
      {['#fffaf2', '#253048', '#b96a5c', '#5b8277'].map((color) => <span key={color} className="h-7 flex-1 rounded-full border border-current/15" style={{ background: color }} />)}
    </div>;
  }
  return null;
}

function CanvasNode({ object }: { object: CanvasObject }) {
  return <article
    className={cn(
      'absolute rounded-[1.05rem] border p-2.5 shadow-[0_14px_34px_rgba(37,48,72,0.10)] backdrop-blur transition',
      toneClass[object.tone],
      object.selected && 'ring-4 ring-[#b96a5c]/22 shadow-[0_24px_60px_rgba(185,106,92,0.20)]',
      object.champion && 'border-[#b96a5c] shadow-[0_26px_70px_rgba(185,106,92,0.20)]',
      object.faded && 'opacity-55 grayscale-[0.2]',
    )}
    style={{ left: `${object.x}%`, top: `${object.y}%`, width: `${object.w}%`, minHeight: `${object.h}%` }}
  >
    <ObjectPreview object={object} />
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.13em] opacity-70">{object.kind}</p>
        <h3 className="mt-1 truncate text-sm font-semibold tracking-[-0.025em]">{object.label}</h3>
      </div>
      {object.selected ? <span className="rounded-full bg-[#b96a5c] px-2 py-0.5 text-[0.62rem] font-bold text-[#fffaf2]">选中</span> : null}
      {object.champion ? <span className="rounded-full bg-[#253048] px-2 py-0.5 text-[0.62rem] font-bold text-[#fffaf2]">冠军</span> : null}
    </div>
    <p className="mt-1.5 line-clamp-2 text-xs leading-4 opacity-80">{object.subtitle}</p>
  </article>;
}

function CanvasArea() {
  return <section className="relative min-h-[720px] overflow-hidden rounded-[2rem] border border-[#e9d8c4] bg-[#fffaf2]/58 shadow-[inset_0_1px_0_rgba(255,250,242,0.88)]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(37,48,72,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,48,72,0.055)_1px,transparent_1px)] bg-[size:38px_38px]" />
    <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/90 px-3 py-2 shadow-[0_12px_30px_rgba(37,48,72,0.08)] backdrop-blur">
      <Badge className={cn('rounded-full', vi.ink)}>WYSIWYG</Badge>
      <span className="text-xs font-semibold text-[#6b7488]">静态画布演示 · 不调用 AI</span>
      <span className="text-xs font-semibold text-[#9e574c]">Lineage / Flow 开启</span>
    </div>
    <div className="absolute right-4 top-4 z-20 flex gap-2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/90 p-1 shadow-[0_12px_30px_rgba(37,48,72,0.08)]">
      {['设计层', '关系层', '智能层'].map((item, index) => <span key={item} className={cn('rounded-full px-3 py-1 text-xs font-semibold', index === 1 ? 'bg-[#253048] text-[#fffaf2]' : 'text-[#45506a]')}>{item}</span>)}
    </div>
    {lineageEdges.map((edge) => <div key={`${edge.from}-${edge.to}`} className={cn('absolute z-0 border-t', edge.className)}>
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/90 px-2 py-0.5 text-[0.62rem] font-semibold text-[#6b7488]">{edge.type}</span>
    </div>)}
    <div className="absolute inset-0 z-10">
      {canvasObjects.map((object) => <CanvasNode key={object.id} object={object} />)}
    </div>
    <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-[#e9d8c4] bg-[#fffaf2]/94 p-2 shadow-[0_16px_38px_rgba(37,48,72,0.10)]">
      {['选择', '文本', '图片', '连线', '画板', 'AI 改写'].map((tool, index) => <Button key={tool} size="sm" variant={index === 1 ? 'default' : 'outline'} className={cn('h-8 rounded-full text-xs', index === 1 ? 'bg-[#253048] text-[#fffaf2] hover:bg-[#303b55]' : 'border-[#d9c2a7] bg-[#fffaf2] text-[#45506a] hover:bg-[#fff1de]')}>{tool}</Button>)}
    </div>
    <div className="absolute bottom-4 right-4 z-30 h-28 w-40 rounded-[1rem] border border-[#d9c2a7] bg-[#fffaf2]/90 p-2 shadow-[0_16px_38px_rgba(37,48,72,0.10)]">
      <div className="mb-1 flex items-center justify-between text-[0.64rem] font-semibold text-[#6b7488]"><span>MiniMap</span><span>38%</span></div>
      <div className="relative h-[86px] rounded-[0.7rem] border border-[#e9d8c4] bg-[#fff1de]">
        {canvasObjects.slice(0, 10).map((object) => <span key={object.id} className={cn('absolute rounded-sm', object.selected ? 'bg-[#b96a5c]' : object.champion ? 'bg-[#253048]' : 'bg-[#9ba4b3]/60')} style={{ left: `${object.x}%`, top: `${object.y}%`, width: `${Math.max(5, object.w / 3)}%`, height: `${Math.max(5, object.h / 3)}%` }} />)}
      </div>
    </div>
  </section>;
}

function Inspector() {
  return <aside className="grid gap-4 xl:content-start">
    <Card className={cn('rounded-[1.7rem]', vi.raised)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e574c]">右侧 Inspector</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.055em] text-[#253048]">选中：标题文本对象</h2>
          </div>
          <Badge className={cn('rounded-full', vi.coral)}>Text</Badge>
        </div>
        <div className="rounded-[1.2rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-4">
          <p className="text-xs font-semibold text-[#6b7488]">画布文字内容</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#253048]">温润修护 · 春季限定</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {['字体：宋体标题', '字重：Semibold', '字号：42', '行距：1.05', '绑定：小红书首图', '状态：参与生成约束'].map((item) => <span key={item} className="rounded-full border border-[#e9d8c4] bg-[#fffaf2] px-3 py-2 font-semibold text-[#45506a]">{item}</span>)}
        </div>
        <div className="grid gap-2">
          {['AI 改写得更高级', '生成 3 个标题变体', '应用到全部交付画板'].map((action, index) => <Button key={action} variant={index === 0 ? 'default' : 'outline'} className={cn('justify-start rounded-full', index === 0 ? 'bg-[#253048] text-[#fffaf2] hover:bg-[#303b55]' : 'border-[#d9c2a7] bg-[#fffaf2] text-[#253048] hover:bg-[#fff1de]')}>{action}</Button>)}
        </div>
      </CardContent>
    </Card>

    <Card className={cn('rounded-[1.7rem]', vi.card)}>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e574c]">关系层</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#253048]">当前高亮关系</h3>
        </div>
        {['文本绑定：标题 → 冠军图', '品牌约束：色板 → 交付画板', '采纳：初稿 B → 小红书首图', '废弃分支：初稿 C 已淡化'].map((item) => <div key={item} className="rounded-[1rem] border border-[#e9d8c4] bg-[#fff1de]/62 p-3 text-sm font-semibold text-[#45506a]">{item}</div>)}
      </CardContent>
    </Card>
  </aside>;
}

function MobilePreview() {
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:items-center">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e574c]">Mobile review mode</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#253048]">手机端先看画布、选对象、看 Inspector。</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#45506a]">复杂编排桌面优先；移动端保留 pan/zoom、选择对象、查看关系、做简单判断，不把专业画布硬塞成表单。</p>
    </div>
    <div className="mx-auto w-full max-w-[390px] rounded-[2.4rem] border border-[#d9c2a7] bg-[#fffaf2]/70 p-2 shadow-[0_28px_80px_rgba(37,48,72,0.16)]">
      <div className="overflow-hidden rounded-[1.95rem] border border-[#e9d8c4] bg-[#fffaf2] p-3">
        <div className="flex items-center justify-between"><Badge className={cn('rounded-full', vi.ink)}>创作案板</Badge><span className="text-xs font-semibold text-[#6b7488]">38%</span></div>
        <div className="relative mt-3 h-72 overflow-hidden rounded-[1.4rem] border border-[#e9d8c4] bg-[#fff1de]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(37,48,72,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,48,72,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
          {canvasObjects.slice(5, 10).map((object, index) => <div key={object.id} className={cn('absolute rounded-[0.9rem] border p-2 text-xs shadow-sm', toneClass[object.tone], object.selected && 'ring-4 ring-[#b96a5c]/25')} style={{ left: `${8 + index * 16}%`, top: `${26 + (index % 2) * 24}%`, width: '34%' }}>
            <b>{object.label}</b>
          </div>)}
        </div>
        <div className="mt-3 rounded-[1.2rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-3">
          <p className="text-xs font-semibold text-[#9e574c]">选中：标题文本对象</p>
          <p className="mt-1 text-sm font-semibold text-[#253048]">可改写、换字体、绑定到交付画板。</p>
        </div>
      </div>
    </div>
  </section>;
}

export default function CanvasBoardDemoPage() {
  return <div className="full-bleed-page immersive-visual-stage-page">
    <main data-preview-route="canvas-board-demo" className={vi.shell}>
      <div aria-hidden="true" className={vi.wash} />
      <div aria-hidden="true" className={vi.grain} />
      <div className="relative mx-auto grid max-w-[1800px] gap-5 px-3 py-4 md:px-6 md:py-6">
        <header className="grid gap-4 rounded-[2rem] border border-[#e9d8c4]/90 bg-[#fffaf2]/78 p-4 shadow-[0_22px_70px_rgba(37,48,72,0.10)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('rounded-full px-3 py-1', vi.ink)}>创作案板</Badge>
              <Badge variant="outline" className={cn('rounded-full', vi.coral)}>Canvas-first</Badge>
              <Badge variant="outline" className={cn('rounded-full', vi.sage)}>Warm Editorial Board</Badge>
            </div>
            <Button asChild variant="outline" className="rounded-full border-[#d9c2a7] bg-[#fffaf2] text-[#253048] hover:bg-[#fff1de]"><Link href="/visual-stage">回到 Visual Stage</Link></Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.32fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e574c]">WYSIWYG 创作画布 · 静态画布演示 · 不调用 AI</p>
              <h1 className="mt-3 max-w-5xl text-4xl font-semibold leading-[0.96] tracking-[-0.075em] text-[#253048] md:text-6xl">图片、文本对象、参考、品牌与交付物都在同一张专业画布上。</h1>
            </div>
            <Card className={cn('rounded-[1.5rem]', vi.card)}><CardContent className="space-y-2 p-4 text-sm leading-6 text-[#45506a]">
              <b className="text-[#253048]">这版验证点</b>
              <p>不再是过程面板；重点看是否像 Lovart + flow 工具融合后的 AI 设计项目画布。</p>
            </CardContent></Card>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CanvasArea />
          <Inspector />
        </section>

        <MobilePreview />
      </div>
    </main>
  </div>;
}
