import Link from 'next/link';
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
    apiGet<QueueStatus>('/tasks/queue/status').catch((error): QueueStatus => ({ error: String(error) })),
    apiGet<MetricsSummary>('/tasks/metrics/summary').catch((error): MetricsSummary => ({ error: String(error) })),
    apiGet<AuditLog[]>('/audit-logs?take=20').catch(() => []),
    apiGet<any>('/health/ready').catch((error) => ({ status: 'error', error: String(error) })),
    apiGet<any>('/health/version').catch((error) => ({ error: String(error) })),
    apiGet<{ alerts: Alert[] }>('/ops/alerts').catch(() => ({ alerts: [] })),
    apiGet<any>('/ops/storage').catch((error) => ({ error: String(error) })),
    apiGet<any[]>('/ops/providers/health').catch(() => []),
    apiGet<any>('/ops/backup/status').catch((error) => ({ error: String(error) })),
  ]);
  const statusEntries = metrics.byStatus ?? [];
  const queueEntries = Object.entries(queue.queue ?? {});
  const modelEntries = metrics.byModel ?? [];

  return <section>
    <div className="studio-hero"><p className="eyebrow">Operations 2.0</p><h1>运营、健康与恢复</h1><p className="sub">队列、状态分布、Provider 健康、存储压力、备份状态、审计导出和生产 readiness 集中在一个运营面板。</p></div>

    <div className="grid three" style={{ marginTop: 20 }}>
      <div className="card"><p className="eyebrow">Health</p><h2>{health.status ?? 'unknown'}</h2><p className="muted">commit {version.commit ?? 'unknown'} · build {version.buildTime ?? 'runtime'}</p><details className="diagnostics"><summary>Health JSON</summary><pre className="debug-json">{JSON.stringify({ health, version }, null, 2)}</pre></details></div>
      <div className="card"><p className="eyebrow">Storage</p><h2>{storage.backend ?? 'unknown'}</h2><p className="muted">{storage.images?.count ?? 0} assets · {bytesLabel(storage.images?.sizeBytes)}</p><p className="fine-print">migration: {storage.migration?.status ?? 'unknown'}</p></div>
      <div className="card"><p className="eyebrow">Backup</p><h2>{backup.configured ? 'configured' : 'runbook ready'}</h2><p className="muted">{backup.manifestPath ?? 'latest manifest pending'}</p><Link className="pill" href="/api/ops/backup/status">查看状态 JSON</Link></div>
    </div>

    {alerts.alerts?.length ? <div className="card" style={{ marginTop: 20 }}>
      <p className="eyebrow">Alerts</p>
      <div className="task-list">{alerts.alerts.map((alert) => <div className={`notice ${alert.level === 'critical' ? 'error' : ''}`} key={alert.code}><b>{alert.code}</b><p>{alert.message}</p>{alert.action ? <p className="fine-print">Action: {alert.action}</p> : null}</div>)}</div>
    </div> : null}

    <div className="grid two" style={{ marginTop: 20 }}>
      <div className="card">
        <p className="eyebrow">Queue</p>
        <h2>实时队列</h2>
        <div className="queue-grid">
          {queueEntries.length ? queueEntries.map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>) : <div className="notice">Queue metrics unavailable.</div>}
        </div>
      </div>
      <div className="card">
        <p className="eyebrow">Usage metrics</p>
        <h2>创作用量</h2>
        <div className="metric-grid">
          {statusEntries.map((row) => <div className="metric" key={row.status ?? 'unknown'}><b>{row._count?.status ?? 0}</b><span>{row.status ?? 'unknown'}</span><small>avg {msLabel(row._avg?.elapsedMs)}</small></div>)}
          <div className="metric"><b>{metrics.images?.count ?? 0}</b><span>assets</span></div>
          <div className="metric"><b>{bytesLabel(metrics.images?.sizeBytes)}</b><span>storage</span></div>
          <div className="metric"><b>{((metrics.quality?.failureRate ?? 0) * 100).toFixed(1)}%</b><span>failure rate</span></div>
          <div className="metric"><b>${(metrics.cost?.estimatedUsd ?? 0).toFixed(2)}</b><span>est. cost</span></div>
        </div>
      </div>
    </div>

    <div className="grid two" style={{ marginTop: 20 }}>
      <div className="card">
        <p className="eyebrow">Provider health & quota</p>
        {providers.length ? providers.map((row) => <div className="task-card" key={row.id} style={{ marginTop: 10 }}><div className="task-head"><b>{row.name}</b><span className={row.enabled ? 'status ok' : 'status bad'}>{row.enabled ? 'enabled' : 'disabled'}</span></div><p className="muted">{row.defaultModel} · failure {(Number(row.failureRate ?? 0) * 100).toFixed(1)}% · quota {row.quota?.configured ? 'configured' : 'external'}</p></div>) : <p className="muted">No provider usage yet.</p>}
      </div>
      <div className="card">
        <p className="eyebrow">Model usage</p>
        {modelEntries.length ? modelEntries.map((row, index) => <div className="task-card" key={`${row.model}-${index}`} style={{ marginTop: 10 }}><div className="task-head"><b>{row.model ?? 'unknown model'}</b><span className="pill">{row._count?.model ?? 0} tasks</span></div><p className="muted">Average latency {msLabel(row._avg?.elapsedMs)}</p></div>) : <p className="muted">No model usage yet.</p>}
      </div>
    </div>

    <div className="card" style={{ marginTop: 20 }}>
      <p className="eyebrow">Audit log</p>
      <div className="actions"><a className="pill" href="/api/audit-logs/export.csv">导出 CSV</a><Link className="pill" href="/settings">管理 Session / Invite</Link></div>
      {audit.length ? audit.map((row) => <div className="task-card" key={row.id} style={{ marginTop: 10 }}><div className="task-head"><b>{row.action}</b><span className="fine-print">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</span></div><p className="muted">{row.targetType ?? '-'} · {row.targetId ?? '-'} · {row.actorRole ?? 'actor'}</p></div>) : <p className="muted">No audit entries.</p>}
    </div>

    <details className="diagnostics" style={{ marginTop: 20 }}>
      <summary>Diagnostics · ops raw payloads</summary>
      <pre className="debug-json">{JSON.stringify({ queue, metrics, health, version, alerts, storage, providers, backup }, null, 2)}</pre>
    </details>
  </section>;
}
