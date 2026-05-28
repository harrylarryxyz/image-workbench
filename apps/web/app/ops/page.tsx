import { apiGet } from '../../lib/api';

export default async function OpsPage() {
  const [queue, metrics, audit] = await Promise.all([
    apiGet<any>('/tasks/queue/status').catch((error) => ({ error: String(error) })),
    apiGet<any>('/tasks/metrics/summary').catch((error) => ({ error: String(error) })),
    apiGet<any[]>('/audit-logs?take=20').catch(() => []),
  ]);
  return <section>
    <div className="hero"><p className="eyebrow">Operations</p><h1>运营与用量</h1><p className="sub">任务队列、状态分布、模型用量、图片存储体量与最近审计日志。</p></div>
    <div className="grid two" style={{ marginTop: 20 }}>
      <div className="card"><p className="eyebrow">Queue</p><pre>{JSON.stringify(queue, null, 2)}</pre></div>
      <div className="card"><p className="eyebrow">Usage metrics</p><pre>{JSON.stringify(metrics, null, 2)}</pre></div>
    </div>
    <div className="card" style={{ marginTop: 20 }}>
      <p className="eyebrow">Audit log</p>
      {audit.length ? audit.map((row) => <p key={row.id}><b>{row.action}</b> · {row.targetType ?? '-'} · {row.targetId ?? '-'} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</p>) : <p className="muted">No audit entries.</p>}
    </div>
  </section>;
}
