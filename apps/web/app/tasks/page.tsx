import Link from 'next/link';
import { apiGet } from '../../lib/api';

type Task = { id?: string; status?: string; model?: string; prompt?: string; error?: string; errorMessage?: string; images?: unknown[]; elapsedMs?: number | null; createdAt?: string };
type QueueStatus = { queue?: Record<string, number>; database?: unknown; error?: string };

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  if (normalized === 'queued' || normalized === 'pending') return 'status wait';
  return 'status neutral';
}

export default async function TasksPage() {
  const [tasks, queue] = await Promise.all([
    apiGet<Task[]>('/tasks').catch((error): Task[] => [{ error: String(error) }]),
    apiGet<QueueStatus>('/tasks/queue/status').catch((error): QueueStatus => ({ error: String(error) })),
  ]);
  const queueEntries = Object.entries(queue.queue ?? {});

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Tasks</p>
      <h1>任务控制台</h1>
      <p className="sub">任务列表只展示创作决策：状态、模型、耗时和缩略摘要；数据库/队列原始响应放在 Diagnostics。</p>
    </div>

    <div className="card" style={{ marginTop: 20 }}>
      <div className="task-head"><div><p className="eyebrow">Queue Status</p><h2>队列状态</h2></div><Link className="pill" href="/ops">打开 Ops</Link></div>
      <div className="queue-grid">
        {queueEntries.length ? queueEntries.map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>) : <div className="notice">No queue metrics available.</div>}
      </div>
      <details className="diagnostics">
        <summary>Diagnostics · queue/database</summary>
        <pre className="debug-json">{JSON.stringify(queue, null, 2)}</pre>
      </details>
    </div>

    <div className="task-list">
      {tasks.map((task, i) => <Link className="task-card" href={task.id ? `/tasks/${task.id}` : '/tasks'} key={task.id ?? i}>
        <div className="task-head">
          <span className={statusClass(task.status)}>{task.status ?? 'UNKNOWN'}</span>
          <span className="muted">{task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</span>
        </div>
        <h3>{task.model ?? 'Task'}</h3>
        <p>{task.prompt ?? task.error}</p>
        {task.errorMessage ? <div className="notice error">{task.errorMessage}</div> : null}
        <div className="muted">{task.images?.length ?? 0} image(s) · {task.elapsedMs ? `${task.elapsedMs}ms` : 'pending'}</div>
      </Link>)}
    </div>
  </section>;
}
