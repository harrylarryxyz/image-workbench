import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function friendlyError(error: unknown, fallback = '当前内容暂时无法加载') {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (!message || /fetch failed|failed to fetch|networkerror|load failed/i.test(message)) return fallback;
  if (/404|not found/i.test(message)) return '没有找到对应内容，请刷新或返回上一步。';
  if (/401|403|unauthorized|forbidden/i.test(message)) return '当前会话无权访问，请在 Settings 中重新登录。';
  if (/500|internal/i.test(message)) return '服务端暂时没有准备好，请稍后重试或查看 Ops。';
  return fallback;
}

export function ProductStatusBadge({ status }: { status?: string | null }) {
  const raw = (status || 'ready').toLowerCase();
  const label = raw === 'unknown' ? 'waiting' : raw;
  const variant = raw.includes('fail') || raw.includes('error') ? 'destructive' : raw.includes('success') || raw.includes('active') || raw.includes('ready') ? 'secondary' : 'outline';
  return <Badge variant={variant as 'default' | 'secondary' | 'destructive' | 'outline'}>{label}</Badge>;
}

export function EmptyState({ eyebrow = 'EMPTY STATE', title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <Card className="state-card border-dashed border-border/70 bg-muted/20 text-center">
    <CardHeader>
      <p className="eyebrow">{eyebrow}</p>
      <CardTitle>{title}</CardTitle>
      {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </CardHeader>
    {action ? <CardContent>{action}</CardContent> : null}
  </Card>;
}

export function ErrorState({ title = '暂时无法加载', description = '数据服务没有返回可展示内容。你可以稍后重试，或在运维页查看服务状态。', actionHref, actionLabel = '查看 Ops' }: { title?: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return <Card className="state-card border-destructive/30 bg-destructive/10">
    <CardHeader>
      <p className="eyebrow text-destructive">NEEDS ATTENTION</p>
      <CardTitle>{title}</CardTitle>
      <p className="text-sm leading-6 text-muted-foreground">{friendlyError(description, description)}</p>
    </CardHeader>
    {actionHref ? <CardContent><Button asChild variant="outline"><Link href={actionHref}>{actionLabel}</Link></Button></CardContent> : null}
  </Card>;
}

export function LoadingState({ title = '正在加载创作空间…' }: { title?: string }) {
  return <Card className="state-card border-border/60 bg-muted/20"><CardContent className="space-y-3 pt-6 text-sm text-muted-foreground"><div className="skeleton-line w-2/3" /><div className="skeleton-line w-1/2" />{title}</CardContent></Card>;
}
