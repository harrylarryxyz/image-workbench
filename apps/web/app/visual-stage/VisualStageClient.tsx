'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deriveCreationCase, type AnchorState, type ComparisonCandidate, type RouteState } from './creation-case';
import { referenceTerritoryFixtures, visualStageComparisonPlaceholders, visualStageScaffolds } from './visual-stage-fixtures';

const vi = {
  system: 'Warm Editorial Board · 温润编辑式创作板 · VI color system · Paper 0 · Ink 900 · Coral 600 · Sage 600 · no pure black UI surfaces · UI is the frame, not the artwork',
  ratio: '70% Paper / 20% Ink / 7% Coral / 3% Sage',
  tokens: {
    paper: { 0: '#fffaf2', 1: '#fff1de', 2: '#e9d8c4', 3: '#d9c2a7' },
    ink: { 900: '#253048', 800: '#303b55', 700: '#45506a', 500: '#6b7488', 300: '#9ba4b3' },
    coral: { 700: '#9e574c', 600: '#b96a5c', 150: '#f2d6cf', 100: '#f8e3dd' },
    sage: { 700: '#486e64', 600: '#5b8277', 150: '#d6e7df', 100: '#e7f1ec' },
  },
  shell: 'relative min-w-0 overflow-hidden bg-[#fff1de] pb-10 text-[#253048]',
  pageGrid: 'absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.16)_1px,transparent_0)] bg-[size:24px_24px] opacity-40 [mask-image:linear-gradient(to_bottom,rgba(37,48,72,0.76),rgba(37,48,72,0.08))]',
  pageWash: 'absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,106,92,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(91,130,119,0.18),transparent_30%),radial-gradient(circle_at_52%_88%,rgba(233,216,196,0.58),transparent_36%),linear-gradient(135deg,#fff1de_0%,#fffaf2_46%,#f7eadb_100%)]',
  paperPanel: 'border-[#e9d8c4]/90 bg-[#fffaf2]/90 shadow-[0_18px_45px_rgba(37,48,72,0.09)] backdrop-blur',
  elevatedPanel: 'border-[#e9d8c4]/90 bg-[#fffaf2]/94 shadow-[0_28px_70px_rgba(37,48,72,0.12),0_8px_24px_rgba(37,48,72,0.08)]',
  title: 'text-[#253048]',
  copy: 'text-[#6b7488]',
  quietCopy: 'text-[#6b7488]',
  hairline: 'border-[#e9d8c4]/90',
  inkPill: 'bg-[#253048] text-[#fffaf2]',
  coralPill: 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  sagePill: 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  primaryButton: 'rounded-full bg-[#253048] text-[#fffaf2] shadow-[0_16px_28px_rgba(37,48,72,0.20)] hover:bg-[#303b55]',
  secondaryButton: 'rounded-full border-[#d9c2a7]/80 text-[#253048] hover:bg-[#fff1de]',
  accentText: 'text-[#b96a5c] underline decoration-[#f2d6cf] decoration-[0.18em] underline-offset-[-0.06em]',
};

const routeLabels: { route: RouteState; label: string; detail: string }[] = [
  { route: 'reference-first', label: 'Reference-first', detail: '模糊审美先看方向，用创意板而不是 prompt 课。' },
  { route: 'generate-first', label: 'Generate-first', detail: '锚点足够时先贴出可判断首稿。' },
  { route: 'ask-first', label: 'Ask-first', detail: '只阻塞硬事实和权利风险，舞台不断电。' },
];

const routeDisplay: Record<RouteState, string> = {
  'reference-first': 'Reference-first',
  'generate-first': 'Generate-first',
  'ask-first': 'Ask-first',
};

const routeTone: Record<RouteState, string> = {
  'reference-first': 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  'generate-first': 'border-[#253048]/18 bg-[#eef0f4] text-[#253048]',
  'ask-first': 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
};

const anchorTone: Record<AnchorState, string> = {
  known: 'bg-[#e7f1ec] text-[#486e64]',
  assumed: 'bg-[#fff1de] text-[#45506a]',
  missing: 'bg-[#f8e3dd] text-[#9e574c]',
};

const scaffoldTone = [
  'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
  'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
];
const territoryTone = ['bg-[#e7f1ec]', 'bg-[#fff1de]', 'bg-[#f8e3dd]'];
const comparisonTone = [
  'border-l-[#253048] bg-[#fffaf2]',
  'border-l-[#b96a5c] bg-[#fffaf2]',
  'border-l-[#5b8277] bg-[#fffaf2]',
  'border-l-[#d9c2a7] bg-[#fffaf2]',
];

const boardPins = [
  {
    eyebrow: 'Reference Canvas',
    title: '方向先可见',
    className: 'left-5 top-6 w-36 -rotate-3 border-[#d6e7df] bg-[#e7f1ec] text-[#486e64] md:w-44',
  },
  {
    eyebrow: 'Mood before settings',
    title: '先判断气质',
    className: 'right-4 top-10 w-32 rotate-3 border-[#e9d8c4] bg-[#fff1de] text-[#45506a] md:w-40',
  },
  {
    eyebrow: 'Champion',
    title: '保留最佳',
    className: 'bottom-7 left-8 w-36 rotate-2 border-[#253048]/20 bg-[#eef0f4] text-[#253048] md:w-44',
  },
  {
    eyebrow: 'Comparison Set',
    title: '分支不丢',
    className: 'bottom-9 right-6 w-36 -rotate-2 border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c] md:w-44',
  },
];

const feedbackActions = [
  { label: '更克制版', summary: '减少装饰面积，保留墨蓝秩序、纸面温度和少量珊瑚点睛。', button: '更克制', variant: 'secondary' as const },
  { label: '更有记忆点版', summary: '只强化标题关键词与构图节奏，不增加随机彩色块。', button: '更有记忆点', variant: 'outline' as const },
  { label: '少一点装饰版', summary: '降低背景光晕和贴纸感，让作品区更像主角。', button: '少装饰', variant: 'outline' as const },
  { label: '更商业版', summary: '强化主体、卖点和投放场景，让创作板更可落地。', button: '更商业', variant: 'outline' as const },
];

function BoardGlow({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;
}

function BoardPin({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('absolute rounded-[1.35rem] border p-4 shadow-[0_16px_40px_rgba(37,48,72,0.10)]', className)}>{children}</div>;
}

export function VisualStageClient() {
  const [intent, setIntent] = useState('');
  const [started, setStarted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackCandidates, setFeedbackCandidates] = useState<ComparisonCandidate[]>([]);
  const [committed, setCommitted] = useState(false);
  const creationCase = useMemo(() => deriveCreationCase(started ? intent : ''), [intent, started]);
  const champion = creationCase.champion ?? visualStageComparisonPlaceholders[0];
  const comparisonBase = creationCase.comparisons.length ? creationCase.comparisons : visualStageComparisonPlaceholders.slice(1);
  const comparisons = [...feedbackCandidates, ...comparisonBase].slice(0, 4);
  const territories = creationCase.referenceTerritories.length ? creationCase.referenceTerritories : referenceTerritoryFixtures;
  const generateDisabled = !started || creationCase.route === 'ask-first' || creationCase.anchors.some((anchor) => anchor.hardBlocker && anchor.state === 'missing');

  function startCase() {
    setStarted(true);
    setFeedbackMessage('');
    setFeedbackCandidates([]);
    setCommitted(false);
  }

  function addJudgmentFeedback(label: string, summary: string) {
    setFeedbackCandidates((previous) => [
      { id: `feedback-${label}`, label, summary },
      ...previous.filter((candidate) => candidate.label !== label),
    ].slice(0, 2));
    setFeedbackMessage('反馈已记录 · Case updated · 创作案已更新');
  }

  return <section data-testid="visual-stage-shell" data-vi="warm-editorial-board-v1" aria-label={vi.system} className={vi.shell}>
    <div aria-hidden="true" className={vi.pageWash} />
    <div aria-hidden="true" className={vi.pageGrid} />
    <BoardGlow className="-left-24 top-10 h-80 w-80 bg-[#f8e3dd]/70" />
    <BoardGlow className="right-0 top-16 h-80 w-80 bg-[#e7f1ec]/78" />
    <BoardGlow className="bottom-10 left-1/3 h-72 w-72 bg-[#fff1de]/88" />

    <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-8 md:py-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(420px,1.06fr)]">
        <Card className={cn('overflow-hidden rounded-[2.35rem]', vi.elevatedPanel)}>
          <CardContent className="grid min-h-[36rem] content-center gap-7 p-5 md:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={cn('rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em]', vi.inkPill)}>Visual Stage · D · Creative Board</Badge>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-xs', vi.coralPill)}>Warm Editorial Board</Badge>
              <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-3 py-1 text-xs text-[#45506a]">专业不降级，兴趣不劝退</Badge>
            </div>
            <div>
              <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#9e574c] before:h-px before:w-8 before:bg-[#b96a5c]">Mood before settings</p>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.93] tracking-[-0.075em] text-[#253048] md:text-7xl">
                把粗糙意图铺成可判断的 <span className={vi.accentText}>创作板</span>
              </h1>
              <p className={cn('mt-6 max-w-2xl text-base leading-8 md:text-lg', vi.copy)}>
                温润编辑式创作板先提供纸面秩序：墨蓝建立专业感，珊瑚色点亮行动，鼠尾草绿承接参考。彩色只做判断线索，UI is the frame, not the artwork。
              </p>
            </div>
            <Card data-testid="visual-stage-composer" className={cn('rounded-[1.85rem] py-0', vi.paperPanel)}>
              <CardContent className="grid gap-3 p-3 md:p-4">
                <Textarea
                  aria-label="创作意图 Creation intent"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="一句话说想做什么：做一张高级一点的头像 / 黑金冷萃海报 / 参考图改造成封面..."
                  className="min-h-24 resize-none rounded-[1.25rem] border-[#e9d8c4] bg-[#fffaf2] text-base text-[#253048] placeholder:text-[#9ba4b3] focus-visible:ring-[#b96a5c]/28"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {visualStageScaffolds.map((scaffold, index) => <Badge key={scaffold} variant="outline" className={cn('rounded-full px-3 py-1', scaffoldTone[index % scaffoldTone.length])}>{scaffold}</Badge>)}
                  </div>
                  <Button onClick={startCase} className={cn('px-5', vi.primaryButton)} disabled={!intent.trim()}>整理创作案 · Start Visual Stage</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <aside className={cn('relative min-h-[42rem] overflow-hidden rounded-[2.35rem] border p-5 md:p-7', vi.elevatedPanel)} aria-label="Warm Editorial Board visual sample">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.14)_1px,transparent_0)] bg-[size:22px_22px] opacity-35" />
          <div className="relative z-10 mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong className="block text-2xl tracking-[-0.04em] text-[#253048]">Creative Board</strong>
              <span className="mt-1 block text-xs text-[#6b7488]">{vi.ratio}</span>
            </div>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', vi.sagePill)}>Reference aligned</Badge>
          </div>

          <div className="relative z-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[20rem] overflow-hidden rounded-[1.8rem] border border-[#e9d8c4] bg-[#fffaf2]/70 p-4 shadow-[inset_0_1px_0_rgba(255,250,242,0.90)]">
              <div aria-hidden="true" className="absolute inset-4 rounded-[1.45rem] border border-dashed border-[#d9c2a7]" />
              {boardPins.map((pin) => <BoardPin key={pin.eyebrow} className={pin.className}>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] opacity-75">{pin.eyebrow}</p>
                <b className="mt-1 block text-lg tracking-[-0.045em] md:text-xl">{pin.title}</b>
              </BoardPin>)}
              <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#e9d8c4] bg-[#fffaf2] text-3xl text-[#b96a5c] shadow-[0_16px_36px_rgba(37,48,72,0.12)]">✦</div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.6rem] border border-[#d6e7df] bg-[#e7f1ec]/82 p-5 shadow-[0_14px_34px_rgba(37,48,72,0.07)]">
                <Badge variant="outline" className={cn('mb-3 rounded-full px-3 py-1', vi.sagePill)}>Reference Canvas</Badge>
                <h2 className="text-2xl font-bold tracking-[-0.055em] text-[#253048]">参考稳定，作品优先</h2>
                <p className="mt-3 text-sm leading-6 text-[#6b7488]">参考区只使用 Sage 语义，不把每张卡染成不同颜色。</p>
              </div>
              <div className="rounded-[1.6rem] border border-[#253048]/20 bg-[#fffaf2] p-5 shadow-[0_14px_34px_rgba(37,48,72,0.08)]">
                <Badge className={cn('mb-3 rounded-full px-3 py-1', vi.inkPill)}>Champion</Badge>
                <h2 className="text-2xl font-bold tracking-[-0.055em] text-[#253048]">当前最佳更稳</h2>
                <p className="mt-3 text-sm leading-6 text-[#6b7488]">Champion 用墨蓝建立权威，只用珊瑚色做少量行动点睛。</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.48fr)]">
        <Card data-testid="visual-stage-creation-case" className={cn('rounded-[1.85rem]', vi.paperPanel)}>
          <CardHeader>
            <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Creation Case</CardTitle>
            <CardDescription className={vi.quietCopy}>紧凑显示系统理解、锚点状态、路由理由和下一步，不把整张表单压给用户。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('rounded-full border px-3 py-1', routeTone[creationCase.route])}>Route · {routeDisplay[creationCase.route]}</Badge>
              <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] text-[#45506a]">{creationCase.nextAction}</Badge>
            </div>
            <p className="rounded-[1.25rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-4 text-sm leading-6 text-[#6b7488]">{creationCase.intentSummary}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {creationCase.anchors.map((anchor) => <div key={anchor.key} className="rounded-[1.2rem] border border-[#e9d8c4] bg-[#fffaf2] p-3 shadow-[0_8px_20px_rgba(37,48,72,0.06)]">
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#6b7488]">{anchor.label}</span>
                <p className="mt-1 text-sm font-medium text-[#253048]">{anchor.value ?? 'Missing / 待补齐'}</p>
                <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium', anchor.hardBlocker ? 'bg-[#f8e3dd] text-[#9e574c]' : anchorTone[anchor.state])}>{anchor.hardBlocker ? 'Hard blocker' : anchor.state}</span>
              </div>)}
            </div>
            <div className={cn('rounded-[1.25rem] border p-4 text-sm leading-6', routeTone[creationCase.route])}>{creationCase.routeReason}</div>
            <div data-testid="visual-stage-assumptions" className="grid gap-2 rounded-[1.25rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-3 text-xs text-[#6b7488]">
              <b className="text-[#253048]">Assumptions / 假设</b>
              {(creationCase.assumptions.length ? creationCase.assumptions : ['No assumptions yet / 暂无假设']).map((assumption) => <span key={assumption}>{assumption}</span>)}
            </div>
            <Button className={vi.primaryButton} disabled={generateDisabled}>开始生成 · Generate mock draft</Button>
          </CardContent>
        </Card>

        <Card data-testid="visual-stage-router" className={cn('rounded-[1.85rem]', vi.paperPanel)}>
          <CardHeader>
            <CardTitle className={cn('text-xl tracking-[-0.05em]', vi.title)}>First-response router</CardTitle>
            <CardDescription className={vi.quietCopy}>三路路由是产品状态，不是用户需要先选的模式。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {routeLabels.map((route) => <div key={route.label} className={cn('rounded-[1.2rem] border p-3', creationCase.route === route.route ? routeTone[route.route] : 'border-[#e9d8c4] bg-[#fffaf2] text-[#6b7488]')}>
              <b className="text-sm text-[#253048]">{route.label}</b>
              <p className="mt-1 text-xs leading-5">{route.detail}</p>
            </div>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card data-testid="reference-territories" className={cn('rounded-[1.85rem]', vi.paperPanel)}>
          <CardHeader>
            <Badge variant="outline" className={cn('w-fit rounded-full px-3 py-1', vi.sagePill)}>Reference Canvas</Badge>
            <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Reference Territory Board</CardTitle>
            <CardDescription className={vi.quietCopy}>参考是方向簇，不是模板库；Ask-first 会显示 Unblocker Card。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div data-testid="visual-stage-unblocker" className="rounded-[1.35rem] border border-[#f2d6cf] bg-[#f8e3dd]/78 p-4">
              <b className="text-sm text-[#9e574c]">{creationCase.blocker?.title ?? 'Unblocker Card · 不让舞台死掉'}</b>
              <p className="mt-1 text-xs leading-5 text-[#6b7488]">缺少主体、来源或权利信息时，只补齐关键锚点，不把用户退回问卷。</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(creationCase.blocker?.actions ?? ['上传照片', '抽象头像']).map((action) => <Badge key={action} variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fffaf2]/82 text-[#253048]">{action}</Badge>)}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {territories.map((territory, index) => <div key={territory.id} className={cn('min-w-0 rounded-[1.35rem] border border-[#e9d8c4] p-4 shadow-[0_12px_28px_rgba(37,48,72,0.08)]', territoryTone[index % territoryTone.length])}>
                <b className="text-sm text-[#253048]">{territory.label}</b>
                <p className="mt-2 text-xs leading-5 text-[#6b7488]">{territory.reason}</p>
                <p className="mt-3 text-[0.68rem] text-[#6b7488]">{territory.cues.join(' · ')}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="visual-stage-champion" className={cn('rounded-[1.85rem]', vi.paperPanel)}>
          <CardHeader>
            <Badge variant="outline" className={cn('w-fit rounded-full px-3 py-1', vi.coralPill)}>Mood before settings</Badge>
            <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Champion + Comparison Set</CardTitle>
            <CardDescription className={vi.quietCopy}>当前最佳与 2–4 个有意义备选保持可见，反馈从判断开始。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[#253048]/20 bg-[#253048] bg-[linear-gradient(135deg,#253048,#45506a)] p-5 text-[#fffaf2] shadow-[0_18px_42px_rgba(37,48,72,0.18)]">
              <Badge className="mb-3 rounded-full bg-[#fffaf2] text-[#253048]">Champion</Badge>
              <b>{champion.label}</b>
              <p className="mt-2 text-sm leading-6 text-[#fff1de]/82">{champion.summary}</p>
            </div>
            <div data-testid="visual-stage-comparison" className="grid gap-3 md:grid-cols-2">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#6b7488] md:col-span-2">Comparison Set · 对比备选</div>
              {comparisons.map((candidate, index) => <div key={candidate.id} className={cn('rounded-[1.25rem] border border-l-4 border-[#e9d8c4] p-4', comparisonTone[index % comparisonTone.length])}>
                <b className="text-[#253048]">{candidate.label}</b>
                <p className="mt-2 text-sm leading-6 text-[#6b7488]">{candidate.summary}</p>
              </div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className={vi.primaryButton} onClick={() => setCommitted(true)} disabled={!started || creationCase.route === 'ask-first'}>用这个 · Commit champion</Button>
              {feedbackActions.map((action) => <Button key={action.label} variant={action.variant} size="sm" className={vi.secondaryButton} onClick={() => addJudgmentFeedback(action.label, action.summary)}>{action.button}</Button>)}
            </div>
            <p data-testid="visual-stage-feedback-status" className="min-h-5 text-sm font-medium text-[#486e64]">{feedbackMessage}</p>
          </CardContent>
        </Card>
      </div>

      {committed ? <Card data-testid="visual-stage-delivery-package" className={cn('rounded-[1.85rem]', vi.paperPanel)}>
        <CardHeader>
          <Badge className={cn('w-fit rounded-full px-3 py-1', vi.inkPill)}>Delivery Package</Badge>
          <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Delivery Package · 交付包</CardTitle>
          <CardDescription className={vi.quietCopy}>完成条件是 Champion 可用于具体用途；这里先生成本地 mock 交付摘要，不接真实下载或生产存储。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-[#e9d8c4] bg-[#fffaf2] p-4">
            <b className="text-[#253048]">Selected champion</b>
            <p className="mt-1 text-[#6b7488]">{champion.label} — {champion.summary}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#e9d8c4] bg-[#fffaf2] p-4">
            <b className="text-[#253048]">Use context / 用途</b>
            <p className="mt-1 text-[#6b7488]">{creationCase.anchors.find((anchor) => anchor.key === 'useContext')?.value ?? '社媒海报 / use context 待补齐'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#e9d8c4] bg-[#fffaf2] p-4">
            <b className="text-[#253048]">Assumptions / 假设</b>
            <p className="mt-1 text-[#6b7488]">{(creationCase.assumptions.length ? creationCase.assumptions : ['无额外假设']).join('；')}</p>
          </div>
          <p className="text-xs text-[#6b7488] md:col-span-2">来源/权利提示：本阶段仅记录创作案摘要与 mock 资产，不写入生产存储。</p>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button size="sm" className={vi.primaryButton}>导出 mock 包</Button>
            <Button variant="outline" size="sm" className={vi.secondaryButton}>继续做变体</Button>
          </div>
        </CardContent>
      </Card> : null}
    </div>
  </section>;
}
