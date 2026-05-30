import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: '创作案板界面演示 — Image Workbench',
  description: 'Static Creation Board aesthetic preview for Visual Stage review.',
};

const vi = {
  system: 'Warm Editorial Board · 静态界面演示 · 不调用 AI · 不生成图片',
  shell: 'relative min-w-0 overflow-hidden bg-[#fff1de] text-[#253048]',
  wash: 'absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(185,106,92,0.15),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(91,130,119,0.18),transparent_28%),linear-gradient(145deg,#fff1de_0%,#fffaf2_50%,#f4e1cf_100%)]',
  grain: 'absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.12)_1px,transparent_0)] bg-[size:24px_24px] opacity-35 [mask-image:linear-gradient(to_bottom,rgba(37,48,72,0.58),rgba(37,48,72,0.05))]',
  card: 'border-[#e9d8c4]/90 bg-[#fffaf2]/92 shadow-[0_18px_45px_rgba(37,48,72,0.08)] backdrop-blur',
  raised: 'border-[#e9d8c4]/90 bg-[#fffaf2]/96 shadow-[0_26px_72px_rgba(37,48,72,0.13),0_8px_24px_rgba(37,48,72,0.07)]',
  ink: 'bg-[#253048] text-[#fffaf2]',
  coral: 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  sage: 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  paper: 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
};

const caseFacts = [
  { label: '这次要做', value: '温润纸面感护肤品主视觉' },
  { label: '当前判断', value: '图 B 更稳，图 A 更像参考但产品弱' },
  { label: '不能丢', value: '瓶身比例、标签留白、暖纸质感' },
  { label: '下一步', value: '保留图 B 构图，微调光泽和标题空间' },
];

const referenceCards = [
  {
    title: '@图 1 · 产品参考',
    tone: '主体不要变',
    keep: '瓶身轮廓 / 标签位置',
    borrow: '半透明瓶体反光',
    avoid: '复制桌面杂物',
    className: vi.sage,
  },
  {
    title: '@图 2 · 氛围参考',
    tone: '只借审美',
    keep: '暖纸底 / 低饱和',
    borrow: '杂志页留白节奏',
    avoid: '过度复古滤镜',
    className: vi.coral,
  },
];

const candidates = [
  { name: 'A', label: '更像参考', note: '氛围好，产品略弱', active: false },
  { name: 'B', label: '当前主图', note: '构图稳，可继续', active: true },
  { name: 'C', label: '更商业', note: '适合投放，但稍硬', active: false },
];

const nextActions = ['继续微调', '选为主图', '做一组变体'];

function MiniArtwork({ active = false, label }: { active?: boolean; label: string }) {
  return <div className={cn('relative min-h-28 overflow-hidden rounded-[1.35rem] border', active ? 'border-[#b96a5c] bg-[#fffaf2]' : 'border-[#e9d8c4] bg-[#fff1de]')}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_16%,rgba(255,250,242,0.94),transparent_24%),radial-gradient(circle_at_76%_18%,rgba(91,130,119,0.18),transparent_32%),linear-gradient(145deg,#f4dcc8,#fffaf2_48%,#d8e4dc)]" />
    <div className="absolute bottom-4 left-1/2 h-[58%] w-[22%] -translate-x-1/2 rounded-t-[2rem] rounded-b-xl border border-[#9ba4b3]/45 bg-[linear-gradient(180deg,rgba(255,250,242,0.92),rgba(185,106,92,0.16))] shadow-[0_18px_42px_rgba(37,48,72,0.16)]" />
    <div className="absolute bottom-8 left-1/2 h-4 w-[34%] -translate-x-1/2 rounded-full bg-[#253048]/12" />
    <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold', active ? vi.coral : vi.paper)}>{label}</span>
  </div>;
}

function BoardPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', className)}>{children}</span>;
}

function DemoHeader() {
  return <section className="grid gap-5 rounded-[2rem] border border-[#e9d8c4]/90 bg-[#fffaf2]/76 p-5 shadow-[0_22px_70px_rgba(37,48,72,0.10)] backdrop-blur md:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Badge className={cn('rounded-full px-3 py-1', vi.ink)}>创作案板</Badge>
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7488]">Static preview · no AI call</span>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] lg:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e574c]">Warm Editorial Board</p>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold leading-[0.96] tracking-[-0.075em] text-[#253048] md:text-6xl">我把“创作案板”理解成一张审美判断桌，不是任务清单。</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#45506a] md:text-base">这页只看样式和信息层级：主图先占视觉中心，案板负责说明为什么选它、参考图怎么用、下一步怎么改。静态界面演示，不调用 AI、不生成图片、不接真实数据。</p>
      </div>
      <Card className={cn('rounded-[1.5rem]', vi.card)}>
        <CardContent className="space-y-3 p-4 text-sm text-[#45506a]">
          <b className="text-[#253048]">确认点</b>
          <p className="leading-6">如果这个气质对，再把它拆进 `/visual-stage`；如果不对，先改设计，不浪费功能开发。</p>
          <Button asChild variant="outline" className="rounded-full border-[#d9c2a7] bg-[#fffaf2] text-[#253048] hover:bg-[#fff1de]">
            <Link href="/visual-stage">回到当前 Visual Stage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  </section>;
}

function CreationDesk() {
  return <section className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.5fr)]">
    <Card className={cn('overflow-hidden rounded-[2.25rem]', vi.raised)}>
      <CardContent className="grid gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e574c]">Champion surface</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-[#253048]">当前主图先说话</h2>
          </div>
          <div className="flex gap-2">
            <BoardPill className={vi.coral}>当前主图</BoardPill>
            <BoardPill className={vi.sage}>可继续改</BoardPill>
          </div>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-[#e9d8c4] bg-[#fff1de] p-4 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_10%,rgba(255,250,242,0.98),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(91,130,119,0.18),transparent_30%),radial-gradient(circle_at_28%_82%,rgba(185,106,92,0.12),transparent_30%),linear-gradient(145deg,#edd5bf,#fffaf2_48%,#dbe8df)]" />
          <div className="absolute inset-x-6 top-6 h-16 rounded-full bg-[#fffaf2]/45 blur-2xl" />
          <div className="relative grid h-full min-h-[25rem] place-items-center rounded-[1.6rem] border border-[#fffaf2]/65 bg-[#fffaf2]/18 shadow-[inset_0_1px_0_rgba(255,250,242,0.74)]">
            <div className="relative h-[19rem] w-[14rem] rounded-t-[4.5rem] rounded-b-[2rem] border border-[#9ba4b3]/45 bg-[linear-gradient(180deg,rgba(255,250,242,0.95),rgba(248,227,221,0.72)_58%,rgba(91,130,119,0.10))] shadow-[0_34px_90px_rgba(37,48,72,0.20)]">
              <div className="absolute left-1/2 top-8 h-11 w-24 -translate-x-1/2 rounded-full border border-[#b96a5c]/25 bg-[#fffaf2]/65" />
              <div className="absolute inset-x-8 bottom-20 rounded-2xl border border-[#253048]/10 bg-[#fffaf2]/76 p-4 text-center shadow-[0_12px_26px_rgba(37,48,72,0.08)]">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#9e574c]">SOFT SERUM</p>
                <p className="mt-2 text-[0.7rem] text-[#6b7488]">warm editorial board</p>
              </div>
            </div>
            <div className="absolute bottom-7 left-6 right-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-[#e9d8c4]/90 bg-[#fffaf2]/86 px-4 py-3 text-sm text-[#45506a] backdrop-blur">
              <span>判断：图 B 的产品比例最稳，留白也适合后续加标题。</span>
              <BoardPill className={vi.ink}>B · champion</BoardPill>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {candidates.map((candidate) => <article key={candidate.name} className={cn('rounded-[1.45rem] border p-2', candidate.active ? 'border-[#b96a5c] bg-[#f8e3dd]/55' : 'border-[#e9d8c4] bg-[#fff1de]/70')}>
            <MiniArtwork active={candidate.active} label={candidate.name} />
            <div className="mt-3 px-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm text-[#253048]">{candidate.label}</b>
                {candidate.active ? <span className="rounded-full bg-[#b96a5c] px-2 py-0.5 text-[0.65rem] font-semibold text-[#fffaf2]">选中</span> : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#6b7488]">{candidate.note}</p>
            </div>
          </article>)}
        </div>
      </CardContent>
    </Card>

    <aside className="grid gap-4 xl:content-start">
      <Card className={cn('rounded-[1.8rem]', vi.raised)}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e574c]">Creation case</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[#253048]">本案判断</h2>
            </div>
            <Badge variant="outline" className={cn('rounded-full', vi.sage)}>审美确认中</Badge>
          </div>
          <div className="grid gap-2">
            {caseFacts.map((fact) => <div key={fact.label} className="rounded-[1.15rem] border border-[#e9d8c4] bg-[#fff1de]/64 p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9ba4b3]">{fact.label}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#253048]">{fact.value}</p>
            </div>)}
          </div>
        </CardContent>
      </Card>

      <Card className={cn('rounded-[1.8rem]', vi.card)}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#253048]">参考图</h2>
            <span className="text-xs font-semibold text-[#6b7488]">2 张 · 语义用途</span>
          </div>
          <div className="grid gap-3">
            {referenceCards.map((reference) => <article key={reference.title} className={cn('rounded-[1.25rem] border p-3', reference.className)}>
              <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-current/15 bg-[linear-gradient(145deg,#fffaf2,#f8e3dd_46%,#e7f1ec)]">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_45%_28%,rgba(255,250,242,0.95),transparent_30%),linear-gradient(145deg,rgba(37,48,72,0.08),rgba(185,106,92,0.18))]" />
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{reference.title}</b>
                  <p className="mt-1 text-xs font-semibold opacity-75">{reference.tone}</p>
                </div>
              </div>
              <dl className="mt-3 grid gap-1.5 text-xs leading-5">
                <div><dt className="inline font-semibold">保留：</dt><dd className="inline">{reference.keep}</dd></div>
                <div><dt className="inline font-semibold">借鉴：</dt><dd className="inline">{reference.borrow}</dd></div>
                <div><dt className="inline font-semibold">避免：</dt><dd className="inline">{reference.avoid}</dd></div>
              </dl>
            </article>)}
          </div>
        </CardContent>
      </Card>

      <Card className={cn('rounded-[1.8rem]', vi.card)}>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e574c]">候选比较</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#253048]">下一步只给少数判断</h2>
          </div>
          <div className="grid gap-2">
            {nextActions.map((action, index) => <Button key={action} variant={index === 0 ? 'default' : 'outline'} className={cn('justify-start rounded-full', index === 0 ? 'bg-[#253048] text-[#fffaf2] hover:bg-[#303b55]' : 'border-[#d9c2a7] bg-[#fffaf2] text-[#253048] hover:bg-[#fff1de]')}>{action}</Button>)}
          </div>
          <p className="text-xs leading-5 text-[#6b7488]">演示页上的按钮都是静态展示，用来确认信息密度和视觉姿态。</p>
        </CardContent>
      </Card>
    </aside>
  </section>;
}

function MobileStoryboard() {
  return <section className="grid gap-5 lg:grid-cols-[minmax(0,0.65fr)_minmax(320px,0.35fr)] lg:items-center">
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e574c]">Mobile-first reading order</p>
      <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-[#253048]">手机上先看图，再看判断，最后给动作。</h2>
      <p className="max-w-2xl text-sm leading-7 text-[#45506a]">移动端不会把案板做成密密麻麻的表格，而是压成三段：当前主图、案板判断、下一步动作。用户不需要懂参数，也能判断“要不要继续”。</p>
    </div>
    <div className="mx-auto w-full max-w-[390px] rounded-[2.4rem] border border-[#d9c2a7] bg-[#fffaf2]/70 p-2 shadow-[0_28px_80px_rgba(37,48,72,0.16)]">
      <div className="overflow-hidden rounded-[1.95rem] border border-[#e9d8c4] bg-[#fffaf2]">
        <div className="space-y-3 p-3">
          <MiniArtwork active label="当前主图" />
          <div className="rounded-[1.25rem] border border-[#e9d8c4] bg-[#fff1de]/72 p-3">
            <p className="text-xs font-semibold text-[#9e574c]">本案判断</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#253048]">保留图 B 的构图和纸面感，只把产品高光再收一点。</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['A', 'B', 'C'].map((item) => <span key={item} className={cn('rounded-full border px-3 py-2 text-center text-xs font-semibold', item === 'B' ? vi.coral : vi.paper)}>{item}</span>)}
          </div>
          <Button className="w-full rounded-full bg-[#253048] text-[#fffaf2] hover:bg-[#303b55]">继续微调</Button>
        </div>
      </div>
    </div>
  </section>;
}

export default function CreationBoardDemoPage() {
  return <div className="full-bleed-page immersive-visual-stage-page">
    <main data-preview-route="creation-board-demo" className={vi.shell}>
      <div aria-hidden="true" className={vi.wash} />
      <div aria-hidden="true" className={vi.grain} />
      <div className="relative mx-auto grid max-w-[1500px] gap-6 px-4 py-5 md:px-8 md:py-8">
        <DemoHeader />
        <CreationDesk />
        <MobileStoryboard />
      </div>
    </main>
  </div>;
}
