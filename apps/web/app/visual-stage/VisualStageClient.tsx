'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deriveCreationCase, type AnchorState, type ComparisonCandidate, type RouteState } from './creation-case';
import { referenceTerritoryFixtures, visualStageComparisonPlaceholders, visualStageScaffolds } from './visual-stage-fixtures';

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
  'reference-first': 'border-[#00d084]/40 bg-[#00d084]/12 text-[#04543a]',
  'generate-first': 'border-[#8b5cf6]/35 bg-[#8b5cf6]/12 text-[#3d247f]',
  'ask-first': 'border-[#ff75c3]/40 bg-[#ff75c3]/12 text-[#7a1d4b]',
};

const anchorTone: Record<AnchorState, string> = {
  known: 'bg-[#00d084] text-black',
  assumed: 'bg-[#ffd02f] text-black',
  missing: 'bg-[#ff75c3] text-black',
};

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
  return <div className={cn('rounded-[1.4rem] border border-black/10 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)]', className)}>{children}</div>;
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

  return <section data-testid="visual-stage-shell" className="relative min-w-0 overflow-hidden bg-[#fffdf6] pb-10 text-[#111111]">
    <BoardBlob className="-left-20 top-6 h-72 w-72 bg-[#7cf7c7]/55" />
    <BoardBlob className="right-0 top-20 h-80 w-80 bg-[#ff75c3]/35" />
    <BoardBlob className="bottom-12 left-1/3 h-72 w-72 bg-[#8b5cf6]/25" />
    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />

    <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-8 md:py-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)]">
        <Card className="relative min-h-[36rem] overflow-hidden rounded-[2.25rem] border-black/10 bg-[radial-gradient(circle_at_18%_18%,#7cf7c7,transparent_22%),radial-gradient(circle_at_86%_16%,#ff75c3,transparent_22%),radial-gradient(circle_at_55%_86%,#8b5cf6,transparent_25%),linear-gradient(135deg,#fff6a8,#ffffff_42%,#e9f7ff)] shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <CardContent className="grid min-h-[36rem] content-between gap-8 p-4 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">D · Creative Board</Badge>
              <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-black/65">专业不降级，兴趣不劝退</span>
            </div>

            <div className="relative mx-auto grid w-full max-w-4xl gap-5 py-4 md:min-h-[24rem] md:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.72fr)] md:items-center">
              <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-black/10 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <BoardPin className="absolute left-5 top-6 w-36 -rotate-6 bg-[#00d084] text-black md:w-44">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-65">Reference Canvas</p>
                  <b className="mt-1 block text-xl tracking-[-0.05em]">方向先可见</b>
                </BoardPin>
                <BoardPin className="absolute right-4 top-10 w-32 rotate-6 bg-[#ffd02f] text-black md:w-40">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-65">Mood before settings</p>
                  <b className="mt-1 block text-lg tracking-[-0.05em]">先判断气质</b>
                </BoardPin>
                <BoardPin className="absolute bottom-7 left-8 w-36 rotate-3 bg-[#8b5cf6] text-white md:w-44">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/65">Champion</p>
                  <b className="mt-1 block text-xl tracking-[-0.05em]">保留最佳</b>
                </BoardPin>
                <BoardPin className="absolute bottom-9 right-6 w-36 -rotate-3 bg-[#ff75c3] text-black md:w-44">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] opacity-65">Comparison Set</p>
                  <b className="mt-1 block text-lg tracking-[-0.05em]">分支不丢</b>
                </BoardPin>
                <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-black bg-white text-3xl shadow-[0_16px_36px_rgba(0,0,0,0.16)]">✦</div>
              </div>

              <div className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-black/45">Board-first Visual Stage</p>
                <h1 className="mt-3 text-4xl font-semibold leading-[0.92] tracking-[-0.08em] md:text-6xl">把粗糙意图铺成可判断的创作板</h1>
                <p className="mt-4 text-sm leading-7 text-black/62 md:text-base">
                  Visual Stage 先生成 Creation Case 草稿，再在 Reference Canvas 上给出 Reference-first、Generate-first 或 Ask-first 的最快可判断反馈；反馈从判断开始，围绕 Champion 与 Comparison Set 继续推进。
                </p>
              </div>
            </div>

            <Card data-testid="visual-stage-composer" className="mx-auto w-full max-w-4xl rounded-[1.75rem] border-black/10 bg-white/86 py-0 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur">
              <CardContent className="grid gap-3 p-3 md:p-4">
                <Textarea
                  aria-label="创作意图 Creation intent"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="一句话说想做什么：做一张高级一点的头像 / 黑金冷萃海报 / 参考图改造成封面..."
                  className="min-h-24 resize-none border-black/10 bg-[#fffdf6] text-base text-black placeholder:text-black/40 focus-visible:ring-black/20"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {visualStageScaffolds.map((scaffold, index) => <Badge key={scaffold} variant="outline" className={cn('rounded-full border-black/10 px-3 py-1 text-black', index % 3 === 0 ? 'bg-[#00d084]/20' : index % 3 === 1 ? 'bg-[#ffd02f]/28' : 'bg-[#8b5cf6]/15')}>{scaffold}</Badge>)}
                  </div>
                  <Button onClick={startCase} className="rounded-full bg-black px-5 text-white hover:bg-black/85" disabled={!intent.trim()}>整理创作案 · Start Visual Stage</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card data-testid="visual-stage-creation-case" className="rounded-[1.75rem] border-black/10 bg-white/88 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <CardHeader>
              <CardTitle className="text-2xl tracking-[-0.055em]">Creation Case</CardTitle>
              <CardDescription className="text-black/58">紧凑显示系统理解、锚点状态、路由理由和下一步，不把整张表单压给用户。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('rounded-full border px-3 py-1', routeTone[creationCase.route])}>Route · {routeDisplay[creationCase.route]}</Badge>
                <Badge variant="outline" className="rounded-full border-black/10 bg-[#fff6a8]/40 text-black/70">{creationCase.nextAction}</Badge>
              </div>
              <p className="rounded-[1.25rem] border border-black/10 bg-[#fffdf6] p-4 text-sm leading-6 text-black/68">{creationCase.intentSummary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {creationCase.anchors.map((anchor) => <div key={anchor.key} className="rounded-[1.2rem] border border-black/10 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-black/42">{anchor.label}</span>
                  <p className="mt-1 text-sm font-medium text-black">{anchor.value ?? 'Missing / 待补齐'}</p>
                  <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium', anchor.hardBlocker ? 'bg-[#ff75c3] text-black' : anchorTone[anchor.state])}>{anchor.hardBlocker ? 'Hard blocker' : anchor.state}</span>
                </div>)}
              </div>
              <div className={cn('rounded-[1.25rem] border p-4 text-sm leading-6', routeTone[creationCase.route])}>{creationCase.routeReason}</div>
              <div data-testid="visual-stage-assumptions" className="grid gap-2 rounded-[1.25rem] border border-black/10 bg-[#f7f2ff] p-3 text-xs text-black/62">
                <b className="text-black">Assumptions / 假设</b>
                {(creationCase.assumptions.length ? creationCase.assumptions : ['No assumptions yet / 暂无假设']).map((assumption) => <span key={assumption}>{assumption}</span>)}
              </div>
              <Button className="rounded-full bg-black text-white hover:bg-black/85" disabled={generateDisabled}>开始生成 · Generate mock draft</Button>
            </CardContent>
          </Card>

          <Card data-testid="visual-stage-router" className="rounded-[1.75rem] border-black/10 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle className="text-xl tracking-[-0.05em]">First-response router</CardTitle>
              <CardDescription className="text-black/58">三路路由是产品状态，不是用户需要先选的模式。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {routeLabels.map((route) => <div key={route.label} className={cn('rounded-[1.2rem] border p-3', creationCase.route === route.route ? routeTone[route.route] : 'border-black/10 bg-[#fffdf6] text-black/64')}>
                <b className="text-sm text-black">{route.label}</b>
                <p className="mt-1 text-xs leading-5">{route.detail}</p>
              </div>)}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card data-testid="reference-territories" className="rounded-[1.75rem] border-black/10 bg-white/86 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <CardHeader>
            <Badge className="w-fit rounded-full bg-black text-white">Reference Canvas</Badge>
            <CardTitle className="text-2xl tracking-[-0.055em]">Reference Territory Board</CardTitle>
            <CardDescription className="text-black/58">参考是方向簇，不是模板库；Ask-first 会显示 Unblocker Card。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div data-testid="visual-stage-unblocker" className="rounded-[1.35rem] border border-[#ff75c3]/45 bg-[#ff75c3]/14 p-4">
              <b className="text-sm">{creationCase.blocker?.title ?? 'Unblocker Card · 不让舞台死掉'}</b>
              <p className="mt-1 text-xs leading-5 text-black/62">缺少主体、来源或权利信息时，只补齐关键锚点，不把用户退回问卷。</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(creationCase.blocker?.actions ?? ['上传照片', '抽象头像']).map((action) => <Badge key={action} variant="outline" className="rounded-full border-black/10 bg-white/70 text-black">{action}</Badge>)}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {territories.map((territory, index) => <div key={territory.id} className={cn('min-w-0 rounded-[1.35rem] border border-black/10 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]', index % 3 === 0 ? 'bg-[#00d084]/22' : index % 3 === 1 ? 'bg-[#ffd02f]/28' : 'bg-[#8b5cf6]/18')}>
                <b className="text-sm">{territory.label}</b>
                <p className="mt-2 text-xs leading-5 text-black/62">{territory.reason}</p>
                <p className="mt-3 text-[0.68rem] text-black/48">{territory.cues.join(' · ')}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="visual-stage-champion" className="rounded-[1.75rem] border-black/10 bg-white/88 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <CardHeader>
            <Badge className="w-fit rounded-full bg-[#00d084] text-black">Mood before settings</Badge>
            <CardTitle className="text-2xl tracking-[-0.055em]">Champion + Comparison Set</CardTitle>
            <CardDescription className="text-black/58">当前最佳与 2–4 个有意义备选保持可见，反馈从判断开始。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.5rem] border border-black bg-black p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <b>{champion.label}</b>
              <p className="mt-2 text-sm leading-6 text-white/68">{champion.summary}</p>
            </div>
            <div data-testid="visual-stage-comparison" className="grid gap-3 md:grid-cols-2">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-black/45 md:col-span-2">Comparison Set · 对比备选</div>
              {comparisons.map((candidate, index) => <div key={candidate.id} className={cn('rounded-[1.25rem] border border-black/10 p-4', index % 3 === 0 ? 'bg-[#fff6a8]/55' : index % 3 === 1 ? 'bg-[#e9f7ff]' : 'bg-[#f7f2ff]')}>
                <b>{candidate.label}</b>
                <p className="mt-2 text-sm leading-6 text-black/62">{candidate.summary}</p>
              </div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full bg-black text-white hover:bg-black/85" onClick={() => setCommitted(true)} disabled={!started || creationCase.route === 'ask-first'}>用这个 · Commit champion</Button>
              {feedbackActions.map((action) => <Button key={action.label} variant={action.variant} size="sm" className="rounded-full border-black/10" onClick={() => addJudgmentFeedback(action.label, action.summary)}>{action.button}</Button>)}
            </div>
            <p data-testid="visual-stage-feedback-status" className="min-h-5 text-sm font-medium text-[#04543a]">{feedbackMessage}</p>
          </CardContent>
        </Card>
      </div>

      {committed ? <Card data-testid="visual-stage-delivery-package" className="rounded-[1.75rem] border-black/10 bg-[#f7f2ff] shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.055em]">Delivery Package · 交付包</CardTitle>
          <CardDescription className="text-black/58">完成条件是 Champion 可用于具体用途；这里先生成本地 mock 交付摘要，不接真实下载或生产存储。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-black/10 bg-white p-4">
            <b>Selected champion</b>
            <p className="mt-1 text-black/62">{champion.label} — {champion.summary}</p>
          </div>
          <div className="rounded-[1.25rem] border border-black/10 bg-white p-4">
            <b>Use context / 用途</b>
            <p className="mt-1 text-black/62">{creationCase.anchors.find((anchor) => anchor.key === 'useContext')?.value ?? '社媒海报 / use context 待补齐'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-black/10 bg-white p-4">
            <b>Assumptions / 假设</b>
            <p className="mt-1 text-black/62">{(creationCase.assumptions.length ? creationCase.assumptions : ['无额外假设']).join('；')}</p>
          </div>
          <p className="text-xs text-black/55 md:col-span-2">来源/权利提示：本阶段仅记录创作案摘要与 mock 资产，不写入生产存储。</p>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button size="sm" className="rounded-full bg-black text-white hover:bg-black/85">导出 mock 包</Button>
            <Button variant="outline" size="sm" className="rounded-full border-black/10">继续做变体</Button>
          </div>
        </CardContent>
      </Card> : null}
    </div>
  </section>;
}
