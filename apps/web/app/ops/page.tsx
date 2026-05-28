import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ProductStatusBadge, friendlyError } from '@/components/product/state';
import { apiGet } from '../../lib/api';

type QueueStatus = { queue?: Record<string, number | boolean>; database?: unknown; error?: string };
type StatusMetric = { status?: string; _count?: { status?: number }; _avg?: { elapsedMs?: number | null } };
type ModelMetric = { model?: string | null; _count?: { model?: number }; _avg?: { elapsedMs?: number | null } };
type MetricsSummary = { byStatus?: StatusMetric[]; byModel?: ModelMetric[]; images?: { count?: number; sizeBytes?: number }; cost?: { estimatedUsd?: number }; quality?: { failureRate?: number }; error?: string; [key: string]: unknown };
type AuditLog = { id: string; action: string; targetType?: string | null; targetId?: string | null; actorRole?: string | null; createdAt?: string };
type Alert = { level: string; code: string; message: string; action?: string };

function bytesLabel(bytes?: number) {
  if (!bytes) return '0 MB';
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function msLabel(ms?: number | null) {
  if (!ms) return '—';
  if (ms > 60_000) return `${(ms / 60_000).toFixed(1)} min`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export default async function OpsPage() {
  const [queue, metrics, audit, health, version, alerts, storage, providers, backup] = await Promise.all([
    apiGet<QueueStatus>('/tasks/queue/status').catch((error): QueueStatus => ({ error: friendlyError(error, '队列指标暂时不可用') })),
    apiGet<MetricsSummary>('/tasks/metrics/summary').catch((error): MetricsSummary => ({ error: friendlyError(error, '创作用量暂时不可用') })),
    apiGet<AuditLog[]>('/audit-logs?take=20').catch(() => []),
    apiGet<any>('/health/ready').catch((error) => ({ status: 'degraded', error: friendlyError(error, '服务健康检查暂时不可用') })),
    apiGet<any>('/health/version').catch(() => ({ commit: 'preview', buildTime: 'runtime' })),
    apiGet<{ alerts: Alert[] }>('/ops/alerts').catch(() => ({ alerts: [] })),
    apiGet<any>('/ops/storage').catch((error) => ({ backend: 'local preview', error: friendlyError(error, '存储指标暂时不可用') })),
    apiGet<any[]>('/ops/providers/health').catch(() => []),
    apiGet<any>('/ops/backup/status').catch(() => ({ configured: false, manifestPath: '等待首次备份' })),
  ]);
  const statusEntries = metrics.byStatus ?? [];
  const queueEntries = Object.entries(queue.queue ?? {});
  const modelEntries = metrics.byModel ?? [];

  return <section>
    <div className="studio-hero"><p className="eyebrow">Admin / Operations</p><h1>运营、健康与恢复</h1><p className="sub">创作相关服务的健康摘要集中在这里；异常以可行动状态呈现，技术细节不打断主创作流。</p></div>

    <div className="grid gap-4 md:grid-cols-3 mt-5">
      <Card><CardContent className="space-y-3 pt-6"><p className="eyebrow">Health</p><h2>{health.status === 'error' ? 'degraded' : health.status ?? 'ready'}</h2><ProductStatusBadge status={health.status} /><p className="muted">commit {version.commit ?? 'preview'} · build {version.buildTime ?? 'runtime'}</p></CardContent></Card>
      <Card><CardContent className="space-y-3 pt-6"><p className="eyebrow">Storage</p><h2>{storage.backend ?? 'local preview'}</h2><p className="muted">{storage.images?.count ?? 0} assets · {bytesLabel(storage.images?.sizeBytes)}</p><p className="fine-print">migration: {storage.migration?.status ?? 'pending'}</p></CardContent></Card>
      <Card><CardContent className="space-y-3 pt-6"><p className="eyebrow">Backup</p><h2>{backup.configured ? 'configured' : 'runbook ready'}</h2><p className="muted">{backup.manifestPath ?? '等待首次备份'}</p><Button asChild size="sm" variant="outline"><Link href="/api/ops/backup/status">查看状态</Link></Button></CardContent></Card>
    </div>

    {alerts.alerts?.length ? <Card className="mt-5">
      <CardHeader><p className="eyebrow">Alerts</p><CardTitle>生产告警</CardTitle></CardHeader>
      <CardContent><div className="task-list">{alerts.alerts.map((alert) => <Card className={alert.level === 'critical' ? 'border-destructive/40 bg-destructive/10' : 'bg-muted/30'} key={alert.code}><CardContent className="space-y-2 pt-6"><Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>{alert.code}</Badge><p>{alert.message}</p>{alert.action ? <p className="fine-print">建议：{alert.action}</p> : null}</CardContent></Card>)}</div></CardContent>
    </Card> : null}

    <div className="grid gap-4 md:grid-cols-2 mt-5">
      <Card>
        <CardHeader><p className="eyebrow">Queue</p><CardTitle>实时队列</CardTitle></CardHeader>
        <CardContent><div className="queue-grid">
          {queueEntries.length ? queueEntries.map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>) : <EmptyState eyebrow="QUEUE" title="暂无队列指标" description="本地预览或服务短暂不可达时会显示此状态。" />}
        </div></CardContent>
      </Card>
      <Card>
        <CardHeader><p className="eyebrow">Usage metrics</p><CardTitle>创作用量</CardTitle></CardHeader>
        <CardContent><div className="metric-grid">
          {statusEntries.map((row) => <div className="metric" key={row.status ?? 'pending'}><b>{row._count?.status ?? 0}</b><span>{row.status ?? 'pending'}</span><small>avg {msLabel(row._avg?.elapsedMs)}</small></div>)}
          <div className="metric"><b>{metrics.images?.count ?? 0}</b><span>assets</span></div>
          <div className="metric"><b>{bytesLabel(metrics.images?.sizeBytes)}</b><span>storage</span></div>
          <div className="metric"><b>{((metrics.quality?.failureRate ?? 0) * 100).toFixed(1)}%</b><span>failure rate</span></div>
          <div className="metric"><b>${(metrics.cost?.estimatedUsd ?? 0).toFixed(2)}</b><span>est. cost</span></div>
        </div></CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 mt-5">
      <Card>
        <CardHeader><p className="eyebrow">Provider health & quota</p><CardTitle>Provider 状态</CardTitle></CardHeader>
        <CardContent className="space-y-3">{providers.length ? providers.map((row) => <Card key={row.id}><CardContent className="space-y-2 pt-6"><div className="task-head"><b>{row.name}</b><Badge variant={row.enabled ? 'default' : 'destructive'}>{row.enabled ? 'enabled' : 'disabled'}</Badge></div><p className="muted">{row.defaultModel} · failure {(Number(row.failureRate ?? 0) * 100).toFixed(1)}% · quota {row.quota?.configured ? 'configured' : 'external'}</p></CardContent></Card>) : <EmptyState eyebrow="PROVIDERS" title="暂无 Provider 用量" description="配置 Provider 并完成创作后会显示健康和配额摘要。" />}</CardContent>
      </Card>
      <Card>
        <CardHeader><p className="eyebrow">Model usage</p><CardTitle>模型用量</CardTitle></CardHeader>
        <CardContent className="space-y-3">{modelEntries.length ? modelEntries.map((row, index) => <Card key={`${row.model}-${index}`}><CardContent className="space-y-2 pt-6"><div className="task-head"><b>{row.model ?? 'default model'}</b><Badge variant="secondary">{row._count?.model ?? 0} tasks</Badge></div><p className="muted">Average latency {msLabel(row._avg?.elapsedMs)}</p></CardContent></Card>) : <EmptyState eyebrow="MODELS" title="暂无模型用量" description="完成任务后会自动聚合模型调用和平均耗时。" />}</CardContent>
      </Card>
    </div>

    <Card className="mt-5">
      <CardHeader><p className="eyebrow">Audit log</p><CardTitle>审计日志</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><a href="/api/audit-logs/export.csv">导出 CSV</a></Button><Button asChild size="sm" variant="outline"><Link href="/settings">管理 Session / Invite</Link></Button></div>
        {audit.length ? audit.map((row) => <Card key={row.id}><CardContent className="space-y-2 pt-6"><div className="task-head"><b>{row.action}</b><span className="fine-print">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</span></div><p className="muted">{row.targetType ?? '-'} · {row.targetId ?? '-'} · {row.actorRole ?? 'actor'}</p></CardContent></Card>) : <EmptyState eyebrow="AUDIT" title="暂无审计记录" description="登录、Provider 和关键任务操作会记录在这里。" />}
      </CardContent>
    </Card>

  </section>;
}
