'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deriveCreationCase, type ComparisonCandidate, type RouteState } from './creation-case';
import { referenceTerritoryFixtures, visualStageComparisonPlaceholders, visualStageScaffolds } from './visual-stage-fixtures';

const routeLabels: { route: RouteState; label: string; detail: string }[] = [
  { route: 'reference-first', label: 'Reference-first', detail: '模糊审美先看方向，不把用户推入 prompt craft。' },
  { route: 'generate-first', label: 'Generate-first', detail: '锚点足够时先给可判断首稿。' },
  { route: 'ask-first', label: 'Ask-first', detail: '只阻塞硬事实和权利风险，舞台不断电。' },
];

const routeDisplay: Record<RouteState, string> = {
  'reference-first': 'Reference-first',
  'generate-first': 'Generate-first',
  'ask-first': 'Ask-first',
};

function GlowOrb({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;
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

  return <section data-testid="visual-stage-shell" className="relative min-w-0 overflow-hidden pb-10 text-foreground">
    <GlowOrb className="-right-24 top-4 h-72 w-72 bg-primary/20" />
    <GlowOrb className="left-1/4 top-36 h-56 w-56 bg-cyan-300/10" />
    <div className="relative z-10 grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
        <Card className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border-white/10 bg-[radial-gradient(circle_at_50%_-10%,rgba(113,112,255,0.3),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(56,217,150,0.12),transparent_26%),linear-gradient(145deg,rgba(255,255,255,0.085),rgba(255,255,255,0.025))] shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
          <CardContent className="grid min-h-[34rem] content-between gap-8 p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary" className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">Visual Stage</Badge>
              <span className="text-xs text-muted-foreground">专业不降级，兴趣不劝退</span>
            </div>

            <div className="mx-auto grid max-w-3xl justify-items-center gap-5 text-center">
              <div className="relative grid size-36 place-items-center rounded-[2rem] border border-white/10 bg-black/25 shadow-[inset_0_0_80px_rgba(113,112,255,0.12)] md:size-48">
                <div className="absolute inset-5 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))]" />
                <div className="relative grid size-20 place-items-center rounded-full border border-primary/30 bg-primary/10 text-2xl md:size-24">✦</div>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-medium tracking-[-0.055em] md:text-6xl">把粗糙意图变成可判断的创作案</h1>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  Visual Stage 先生成 Creation Case 草稿，再选择 Reference-first、Generate-first 或 Ask-first；反馈从判断开始，围绕 Champion 与 Comparison Set 继续推进。
                </p>
              </div>
            </div>

            <Card data-testid="visual-stage-composer" className="mx-auto w-full max-w-3xl rounded-[1.5rem] border-white/10 bg-black/25 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <CardContent className="grid gap-3 p-3 md:p-4">
                <Textarea
                  aria-label="创作意图 Creation intent"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="一句话说想做什么：做一张高级一点的头像 / 黑金冷萃海报 / 参考图改造成封面..."
                  className="min-h-24 resize-none border-white/10 bg-white/[0.04] text-base"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {visualStageScaffolds.map((scaffold) => <Badge key={scaffold} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-muted-foreground">{scaffold}</Badge>)}
                  </div>
                  <Button onClick={startCase} className="rounded-full px-5" disabled={!intent.trim()}>整理创作案 · Start Visual Stage</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card data-testid="visual-stage-creation-case" className="rounded-[1.5rem] border-white/10 bg-white/[0.045]">
            <CardHeader>
              <CardTitle>Creation Case</CardTitle>
              <CardDescription>紧凑显示系统理解、锚点状态、路由理由和下一步，不把整张表单压给用户。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary/15 text-primary">Route · {routeDisplay[creationCase.route]}</Badge>
                <Badge variant="outline" className="rounded-full border-white/10">{creationCase.nextAction}</Badge>
              </div>
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">{creationCase.intentSummary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {creationCase.anchors.map((anchor) => <div key={anchor.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{anchor.label}</span>
                  <p className="mt-1 text-sm font-medium">{anchor.value ?? 'Missing / 待补齐'}</p>
                  <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.68rem]', anchor.hardBlocker ? 'bg-destructive/15 text-destructive' : 'bg-white/10 text-muted-foreground')}>{anchor.hardBlocker ? 'Hard blocker' : anchor.state}</span>
                </div>)}
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6">
                {creationCase.routeReason}
              </div>
              <div data-testid="visual-stage-assumptions" className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Assumptions / 假设</b>
                {(creationCase.assumptions.length ? creationCase.assumptions : ['No assumptions yet / 暂无假设']).map((assumption) => <span key={assumption}>{assumption}</span>)}
              </div>
              <Button className="rounded-full" disabled={generateDisabled}>开始生成 · Generate mock draft</Button>
            </CardContent>
          </Card>

          <Card data-testid="visual-stage-router" className="rounded-[1.5rem] border-white/10 bg-white/[0.035]">
            <CardHeader>
              <CardTitle>First-response router</CardTitle>
              <CardDescription>三路路由是产品状态，不是用户需要先选的模式。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {routeLabels.map((route) => <div key={route.label} className={cn('rounded-2xl border p-3', creationCase.route === route.route ? 'border-primary/30 bg-primary/10' : 'border-white/10 bg-black/20')}>
                <b className="text-sm">{route.label}</b>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{route.detail}</p>
              </div>)}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <Card data-testid="visual-stage-champion" className="rounded-[1.5rem] border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle>Champion + Comparison Set</CardTitle>
            <CardDescription>当前最佳与 2–4 个有意义备选保持可见，反馈从判断开始。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <b>{champion.label}</b>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{champion.summary}</p>
            </div>
            <div data-testid="visual-stage-comparison" className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Comparison Set · 对比备选</div>
              {comparisons.map((candidate) => <div key={candidate.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <b>{candidate.label}</b>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{candidate.summary}</p>
              </div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setCommitted(true)} disabled={!started || creationCase.route === 'ask-first'}>用这个 · Commit champion</Button>
              <Button variant="secondary" size="sm" onClick={() => addJudgmentFeedback('更克制版', '减少霓虹与装饰，保留黑金质感和专业可信。')}>更克制</Button>
              <Button variant="outline" size="sm" onClick={() => addJudgmentFeedback('更大胆版', '强化对比和视觉冲击，但不牺牲用途清晰度。')}>更大胆</Button>
              <Button variant="outline" size="sm" onClick={() => addJudgmentFeedback('不要霓虹版', '移除赛博霓虹，把高级感转向材质、留白和光影。')}>不要霓虹</Button>
              <Button variant="outline" size="sm" onClick={() => addJudgmentFeedback('更商业版', '强化产品、卖点和投放场景，避免艺术化过头。')}>更商业</Button>
            </div>
            <p data-testid="visual-stage-feedback-status" className="min-h-5 text-sm text-primary">{feedbackMessage}</p>
          </CardContent>
        </Card>

        {committed ? <Card data-testid="visual-stage-delivery-package" className="rounded-[1.5rem] border-primary/30 bg-primary/10">
          <CardHeader>
            <CardTitle>Delivery Package · 交付包</CardTitle>
            <CardDescription>完成条件是 Champion 可用于具体用途；这里先生成本地 mock 交付摘要，不接真实下载或生产存储。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <b>Selected champion</b>
              <p className="mt-1 text-muted-foreground">{champion.label} — {champion.summary}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <b>Use context / 用途</b>
              <p className="mt-1 text-muted-foreground">{creationCase.anchors.find((anchor) => anchor.key === 'useContext')?.value ?? '社媒海报 / use context 待补齐'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <b>Assumptions / 假设</b>
              <p className="mt-1 text-muted-foreground">{(creationCase.assumptions.length ? creationCase.assumptions : ['无额外假设']).join('；')}</p>
            </div>
            <p className="text-xs text-muted-foreground">来源/权利提示：本阶段仅记录创作案摘要与 mock 资产，不写入生产存储。</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">导出 mock 包</Button>
              <Button variant="outline" size="sm">继续做变体</Button>
            </div>
          </CardContent>
        </Card> : null}

        <Card className="rounded-[1.5rem] border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle>Reference Territory Board</CardTitle>
            <CardDescription>参考是方向簇，不是模板库；Ask-first 会显示 Unblocker Card。</CardDescription>
          </CardHeader>
          <CardContent data-testid="reference-territories" className="grid gap-3">
            <div data-testid="visual-stage-unblocker" className="rounded-2xl border border-primary/25 bg-primary/10 p-3">
              <b className="text-sm">{creationCase.blocker?.title ?? 'Unblocker Card · 不让舞台死掉'}</b>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">缺少主体、来源或权利信息时，只补齐关键锚点，不把用户退回问卷。</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(creationCase.blocker?.actions ?? ['上传照片', '抽象头像']).map((action) => <Badge key={action} variant="outline" className="rounded-full border-white/10">{action}</Badge>)}
              </div>
            </div>
            {territories.map((territory) => <div key={territory.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <b className="text-sm">{territory.label}</b>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{territory.reason}</p>
              <p className="mt-2 text-[0.68rem] text-muted-foreground">{territory.cues.join(' · ')}</p>
            </div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  </section>;
}
