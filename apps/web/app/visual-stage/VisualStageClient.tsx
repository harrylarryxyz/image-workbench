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
  system: 'VI color system · deep title tone · mid content tone · pale ambient tone · controlled contrast accents · no pure black UI surfaces',
  shell: 'relative min-w-0 overflow-hidden bg-[#fff7ec] pb-10 text-[#26354f]',
  pageGrid: 'absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(69,52,95,0.14)_1px,transparent_0)] bg-[size:28px_28px]',
  heroWash: 'relative min-h-[36rem] overflow-hidden rounded-[2.25rem] border-[#d8c9b9]/70 bg-[radial-gradient(circle_at_18%_18%,rgba(92,185,165,0.26),transparent_26%),radial-gradient(circle_at_86%_16%,rgba(217,120,128,0.20),transparent_24%),radial-gradient(circle_at_55%_86%,rgba(142,124,195,0.20),transparent_28%),linear-gradient(135deg,#fff1d8,#fffaf2_44%,#e8f4f0)] shadow-[0_24px_70px_rgba(38,53,79,0.16)]',
  glassPanel: 'border-[#d8c9b9]/70 bg-[#fffaf2]/88 shadow-[0_18px_45px_rgba(38,53,79,0.10)] backdrop-blur',
  softPanel: 'border-[#d8c9b9]/70 bg-[#fffaf2]/92 shadow-[0_18px_45px_rgba(38,53,79,0.10)]',
  title: 'text-[#26354f]',
  copy: 'text-[#526174]',
  quietCopy: 'text-[#526174]',
  hairline: 'border-[#d8c9b9]/70',
  deepPill: 'bg-[#26354f] text-[#fff7ec]',
  deepButton: 'rounded-full bg-[#26354f] text-[#fff7ec] hover:bg-[#1f2a44]',
  secondaryButton: 'rounded-full border-[#cdbda8]/80 text-[#26354f] hover:bg-[#efe6d9]',
  accentGradient: 'bg-[linear-gradient(110deg,#45345f_0%,#5cb9a5_45%,#d97880_78%,#e3b65f_100%)] bg-clip-text text-transparent',
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
  'reference-first': 'border-[#5cb9a5]/40 bg-[#dcefe9] text-[#245e55]',
  'generate-first': 'border-[#8e7cc3]/40 bg-[#ece7f6] text-[#45345f]',
  'ask-first': 'border-[#d97880]/42 bg-[#f8e1df] text-[#7b3841]',
};

const anchorTone: Record<AnchorState, string> = {
  known: 'bg-[#dcefe9] text-[#245e55]',
  assumed: 'bg-[#f7e8c5] text-[#7a5524]',
  missing: 'bg-[#f8e1df] text-[#7b3841]',
};

const scaffoldTone = ['bg-[#dcefe9] text-[#245e55]', 'bg-[#f7e8c5] text-[#7a5524]', 'bg-[#ece7f6] text-[#45345f]'];
const territoryTone = ['bg-[#dcefe9]', 'bg-[#f7e8c5]', 'bg-[#ece7f6]'];
const comparisonTone = ['bg-[#f7e8c5]/75', 'bg-[#e8f4f0]', 'bg-[#efeaf8]', 'bg-[#f8e1df]/70'];

const boardPins = [
  {
    eyebrow: 'Reference Canvas',
    title: '方向先可见',
    className: 'left-5 top-6 w-36 -rotate-6 bg-[#dcefe9] text-[#245e55] md:w-44',
  },
  {
    eyebrow: 'Mood before settings',
    title: '先判断气质',
    className: 'right-4 top-10 w-32 rotate-6 bg-[#f7e8c5] text-[#7a5524] md:w-40',
  },
  {
    eyebrow: 'Champion',
    title: '保留最佳',
    className: 'bottom-7 left-8 w-36 rotate-3 bg-[#ece7f6] text-[#45345f] md:w-44',
  },
  {
    eyebrow: 'Comparison Set',
    title: '分支不丢',
    className: 'bottom-9 right-6 w-36 -rotate-3 bg-[#f8e1df] text-[#7b3841] md:w-44',
  },
];

const feedbackActions = [
  { label: '更克制版', summary: '减少霓虹与装饰，保留专业可信和信息层级。', button: '更克制', variant: 'secondary' as const },
  { label: '更大胆版', summary: '强化颜色块和构图张力，但不牺牲用途清晰度。', button: '更大胆', variant: 'outline' as const },
  { label: '不要霓虹版', summary: '移除赛博霓虹，把趣味转向卡片、拼贴和留白。', button: '不要霓虹', variant: 'outline' as const },
  { label: '更商业版', summary: '强化主体、卖点和投放场景，让创意板更可落地。', button: '更商业', variant: 'outline' as const },
];

function BoardBlob({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;
}

function BoardPin({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-[1.4rem] border border-[#cdbda8]/70 p-4 shadow-[0_16px_40px_rgba(38,53,79,0.11)]', className)}>{children}</div>;
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

  return <section data-testid="visual-stage-shell" data-vi="creative-board-v2" aria-label={vi.system} className={vi.shell}>
    <BoardBlob className="-left-20 top-6 h-72 w-72 bg-[#dcefe9]/80" />
    <BoardBlob className="right-0 top-20 h-80 w-80 bg-[#f8e1df]/72" />
    <BoardBlob className="bottom-12 left-1/3 h-72 w-72 bg-[#ece7f6]/76" />
    <div aria-hidden="true" className={vi.pageGrid} />

    <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-8 md:py-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)]">
        <Card className={vi.heroWash}>
          <CardContent className="grid min-h-[36rem] content-between gap-8 p-4 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className={cn('rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]', vi.deepPill)}>D · Creative Board</Badge>
              <span className="rounded-full border border-[#cdbda8]/70 bg-[#fffaf2]/78 px-3 py-1 text-xs font-medium text-[#526174]">专业不降级，兴趣不劝退</span>
            </div>

            <div className="relative mx-auto grid w-full max-w-4xl gap-5 py-4 md:min-h-[24rem] md:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.72fr)] md:items-center">
              <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-[#cdbda8]/70 bg-[#fffaf2]/52 p-4 shadow-[inset_0_1px_0_rgba(255,250,242,0.92)]">
                <div aria-hidden="true" className="absolute inset-4 rounded-[1.55rem] border border-dashed border-[#8e7cc3]/38" />
                {boardPins.map((pin) => <BoardPin key={pin.eyebrow} className={cn('absolute', pin.className)}>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-70">{pin.eyebrow}</p>
                  <b className="mt-1 block text-lg tracking-[-0.045em] md:text-xl">{pin.title}</b>
                </BoardPin>)}
                <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#8e7cc3]/45 bg-[#fff7ec] text-3xl text-[#45345f] shadow-[0_16px_36px_rgba(69,52,95,0.14)]">✦</div>
              </div>

              <div className={cn('rounded-[1.75rem] p-5', vi.glassPanel)}>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#526174]">Board-first Visual Stage</p>
                <h1 className={cn('mt-3 text-4xl font-semibold leading-[0.92] tracking-[-0.08em] md:text-6xl', vi.accentGradient)}>把粗糙意图铺成可判断的创作板</h1>
                <p className={cn('mt-4 text-sm leading-7 md:text-base', vi.copy)}>
                  Visual Stage 先生成 Creation Case 草稿，再在 Reference Canvas 上给出 Reference-first、Generate-first 或 Ask-first 的最快可判断反馈；反馈从判断开始，围绕 Champion 与 Comparison Set 继续推进。
                </p>
              </div>
            </div>

            <Card data-testid="visual-stage-composer" className={cn('mx-auto w-full max-w-4xl rounded-[1.75rem] py-0', vi.glassPanel)}>
              <CardContent className="grid gap-3 p-3 md:p-4">
                <Textarea
                  aria-label="创作意图 Creation intent"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="一句话说想做什么：做一张高级一点的头像 / 黑金冷萃海报 / 参考图改造成封面..."
                  className="min-h-24 resize-none border-[#cdbda8]/70 bg-[#fff7ec] text-base text-[#26354f] placeholder:text-[#526174] focus-visible:ring-[#8e7cc3]/28"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {visualStageScaffolds.map((scaffold, index) => <Badge key={scaffold} variant="outline" className={cn('rounded-full border-[#cdbda8]/70 px-3 py-1', scaffoldTone[index % scaffoldTone.length])}>{scaffold}</Badge>)}
                  </div>
                  <Button onClick={startCase} className={cn('px-5', vi.deepButton)} disabled={!intent.trim()}>整理创作案 · Start Visual Stage</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card data-testid="visual-stage-creation-case" className={cn('rounded-[1.75rem]', vi.softPanel)}>
            <CardHeader>
              <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Creation Case</CardTitle>
              <CardDescription className={vi.quietCopy}>紧凑显示系统理解、锚点状态、路由理由和下一步，不把整张表单压给用户。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('rounded-full border px-3 py-1', routeTone[creationCase.route])}>Route · {routeDisplay[creationCase.route]}</Badge>
                <Badge variant="outline" className="rounded-full border-[#cdbda8]/70 bg-[#f7e8c5]/60 text-[#7a5524]">{creationCase.nextAction}</Badge>
              </div>
              <p className="rounded-[1.25rem] border border-[#cdbda8]/70 bg-[#fff7ec] p-4 text-sm leading-6 text-[#526174]">{creationCase.intentSummary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {creationCase.anchors.map((anchor) => <div key={anchor.key} className="rounded-[1.2rem] border border-[#d8c9b9]/70 bg-[#fffaf2] p-3 shadow-[0_8px_20px_rgba(38,53,79,0.06)]">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#526174]">{anchor.label}</span>
                  <p className="mt-1 text-sm font-medium text-[#26354f]">{anchor.value ?? 'Missing / 待补齐'}</p>
                  <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium', anchor.hardBlocker ? 'bg-[#f8e1df] text-[#7b3841]' : anchorTone[anchor.state])}>{anchor.hardBlocker ? 'Hard blocker' : anchor.state}</span>
                </div>)}
              </div>
              <div className={cn('rounded-[1.25rem] border p-4 text-sm leading-6', routeTone[creationCase.route])}>{creationCase.routeReason}</div>
              <div data-testid="visual-stage-assumptions" className="grid gap-2 rounded-[1.25rem] border border-[#8e7cc3]/28 bg-[#efeaf8] p-3 text-xs text-[#526174]">
                <b className="text-[#45345f]">Assumptions / 假设</b>
                {(creationCase.assumptions.length ? creationCase.assumptions : ['No assumptions yet / 暂无假设']).map((assumption) => <span key={assumption}>{assumption}</span>)}
              </div>
              <Button className={vi.deepButton} disabled={generateDisabled}>开始生成 · Generate mock draft</Button>
            </CardContent>
          </Card>

          <Card data-testid="visual-stage-router" className={cn('rounded-[1.75rem]', vi.glassPanel)}>
            <CardHeader>
              <CardTitle className={cn('text-xl tracking-[-0.05em]', vi.title)}>First-response router</CardTitle>
              <CardDescription className={vi.quietCopy}>三路路由是产品状态，不是用户需要先选的模式。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {routeLabels.map((route) => <div key={route.label} className={cn('rounded-[1.2rem] border p-3', creationCase.route === route.route ? routeTone[route.route] : 'border-[#d8c9b9]/70 bg-[#fff7ec] text-[#526174]')}>
                <b className="text-sm text-[#26354f]">{route.label}</b>
                <p className="mt-1 text-xs leading-5">{route.detail}</p>
              </div>)}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card data-testid="reference-territories" className={cn('rounded-[1.75rem]', vi.softPanel)}>
          <CardHeader>
            <Badge className="w-fit rounded-full bg-[#dcefe9] text-[#245e55]">Reference Canvas</Badge>
            <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Reference Territory Board</CardTitle>
            <CardDescription className={vi.quietCopy}>参考是方向簇，不是模板库；Ask-first 会显示 Unblocker Card。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div data-testid="visual-stage-unblocker" className="rounded-[1.35rem] border border-[#d97880]/38 bg-[#f8e1df]/72 p-4">
              <b className="text-sm text-[#7b3841]">{creationCase.blocker?.title ?? 'Unblocker Card · 不让舞台死掉'}</b>
              <p className="mt-1 text-xs leading-5 text-[#526174]">缺少主体、来源或权利信息时，只补齐关键锚点，不把用户退回问卷。</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(creationCase.blocker?.actions ?? ['上传照片', '抽象头像']).map((action) => <Badge key={action} variant="outline" className="rounded-full border-[#cdbda8]/70 bg-[#fffaf2]/78 text-[#26354f]">{action}</Badge>)}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {territories.map((territory, index) => <div key={territory.id} className={cn('min-w-0 rounded-[1.35rem] border border-[#d8c9b9]/70 p-4 shadow-[0_12px_28px_rgba(38,53,79,0.08)]', territoryTone[index % territoryTone.length])}>
                <b className="text-sm text-[#26354f]">{territory.label}</b>
                <p className="mt-2 text-xs leading-5 text-[#526174]">{territory.reason}</p>
                <p className="mt-3 text-[0.68rem] text-[#526174]">{territory.cues.join(' · ')}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="visual-stage-champion" className={cn('rounded-[1.75rem]', vi.softPanel)}>
          <CardHeader>
            <Badge className="w-fit rounded-full bg-[#f7e8c5] text-[#7a5524]">Mood before settings</Badge>
            <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Champion + Comparison Set</CardTitle>
            <CardDescription className={vi.quietCopy}>当前最佳与 2–4 个有意义备选保持可见，反馈从判断开始。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[#45345f]/40 bg-[#45345f] bg-[linear-gradient(135deg,#45345f,#2f5f68)] p-5 text-[#fff7ec] shadow-[0_18px_42px_rgba(69,52,95,0.18)]">
              <b>{champion.label}</b>
              <p className="mt-2 text-sm leading-6 text-[#f4eadc]/76">{champion.summary}</p>
            </div>
            <div data-testid="visual-stage-comparison" className="grid gap-3 md:grid-cols-2">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#526174] md:col-span-2">Comparison Set · 对比备选</div>
              {comparisons.map((candidate, index) => <div key={candidate.id} className={cn('rounded-[1.25rem] border border-[#d8c9b9]/70 p-4', comparisonTone[index % comparisonTone.length])}>
                <b className="text-[#26354f]">{candidate.label}</b>
                <p className="mt-2 text-sm leading-6 text-[#526174]">{candidate.summary}</p>
              </div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className={vi.deepButton} onClick={() => setCommitted(true)} disabled={!started || creationCase.route === 'ask-first'}>用这个 · Commit champion</Button>
              {feedbackActions.map((action) => <Button key={action.label} variant={action.variant} size="sm" className={vi.secondaryButton} onClick={() => addJudgmentFeedback(action.label, action.summary)}>{action.button}</Button>)}
            </div>
            <p data-testid="visual-stage-feedback-status" className="min-h-5 text-sm font-medium text-[#245e55]">{feedbackMessage}</p>
          </CardContent>
        </Card>
      </div>

      {committed ? <Card data-testid="visual-stage-delivery-package" className="rounded-[1.75rem] border-[#8e7cc3]/28 bg-[#efeaf8] shadow-[0_18px_45px_rgba(38,53,79,0.10)]">
        <CardHeader>
          <CardTitle className={cn('text-2xl tracking-[-0.055em]', vi.title)}>Delivery Package · 交付包</CardTitle>
          <CardDescription className={vi.quietCopy}>完成条件是 Champion 可用于具体用途；这里先生成本地 mock 交付摘要，不接真实下载或生产存储。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-[#d8c9b9]/70 bg-[#fffaf2] p-4">
            <b className="text-[#26354f]">Selected champion</b>
            <p className="mt-1 text-[#526174]">{champion.label} — {champion.summary}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#d8c9b9]/70 bg-[#fffaf2] p-4">
            <b className="text-[#26354f]">Use context / 用途</b>
            <p className="mt-1 text-[#526174]">{creationCase.anchors.find((anchor) => anchor.key === 'useContext')?.value ?? '社媒海报 / use context 待补齐'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-[#d8c9b9]/70 bg-[#fffaf2] p-4">
            <b className="text-[#26354f]">Assumptions / 假设</b>
            <p className="mt-1 text-[#526174]">{(creationCase.assumptions.length ? creationCase.assumptions : ['无额外假设']).join('；')}</p>
          </div>
          <p className="text-xs text-[#526174] md:col-span-2">来源/权利提示：本阶段仅记录创作案摘要与 mock 资产，不写入生产存储。</p>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button size="sm" className={vi.deepButton}>导出 mock 包</Button>
            <Button variant="outline" size="sm" className={vi.secondaryButton}>继续做变体</Button>
          </div>
        </CardContent>
      </Card> : null}
    </div>
  </section>;
}
