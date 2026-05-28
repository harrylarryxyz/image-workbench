import { apiGet } from '../../lib/api';

type QueueStatus = { queue?: Record<string, number | boolean>; database?: unknown; error?: string };
type StatusMetric = { status?: string; _count?: { status?: number }; _avg?: { elapsedMs?: number | null } };
type ModelMetric = { model?: string | null; _count?: { model?: number }; _avg?: { elapsedMs?: number | null } };
type MetricsSummary = {
  byStatus?: StatusMetric[];
  byModel?: ModelMetric[];
  images?: { count?: number; sizeBytes?: number };
  cost?: { estimatedUsd?: number };
  quality?: { failureRate?: number };
  error?: string;
  [key: string]: unknown;
};
type AuditLog = { id: string; action: string; targetType?: string | null; targetId?: string | null; actorRole?: string | null; createdAt?: string };

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
  const [queue, metrics, audit] = await Promise.all([
    apiGet<QueueStatus>('/tasks/queue/status').catch((error): QueueStatus => ({ error: String(error) })),
    apiGet<MetricsSummary>('/tasks/metrics/summary').catch((error): MetricsSummary => ({ error: String(error) })),
    apiGet<AuditLog[]>('/audit-logs?take=20').catch(() => []),
  ]);
  const statusEntries = metrics.byStatus ?? [];
  const queueEntries = Object.entries(queue.queue ?? {});
  const modelEntries = metrics.byModel ?? [];

  return <section>
    <div className="studio-hero"><p className="eyebrow">Operations</p><h1>运营与用量</h1><p className="sub">队列、状态分布、模型用量、存储体量和审计日志，以可扫描的运营面板展示；原始响应统一进 Diagnostics。</p></div>

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
        <p className="eyebrow">Model usage</p>
        {modelEntries.length ? modelEntries.map((row, index) => <div className="task-card" key={`${row.model}-${index}`} style={{ marginTop: 10 }}><div className="task-head"><b>{row.model ?? 'unknown model'}</b><span className="pill">{row._count?.model ?? 0} tasks</span></div><p className="muted">Average latency {msLabel(row._avg?.elapsedMs)}</p></div>) : <p className="muted">No model usage yet.</p>}
      </div>
      <div className="card">
        <p className="eyebrow">Audit log</p>
        {audit.length ? audit.map((row) => <div className="task-card" key={row.id} style={{ marginTop: 10 }}><div className="task-head"><b>{row.action}</b><span className="fine-print">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</span></div><p className="muted">{row.targetType ?? '-'} · {row.targetId ?? '-'} · {row.actorRole ?? 'actor'}</p></div>) : <p className="muted">No audit entries.</p>}
      </div>
    </div>

    <details className="diagnostics" style={{ marginTop: 20 }}>
      <summary>Diagnostics · ops raw payloads</summary>
      <pre className="debug-json">{JSON.stringify({ queue, metrics }, null, 2)}</pre>
    </details>
  </section>;
}
