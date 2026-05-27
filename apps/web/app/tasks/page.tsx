import Link from 'next/link';
import { apiGet } from '../../lib/api';

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  return 'status wait';
}

export default async function TasksPage() {
  const [tasks, queue] = await Promise.all([
    apiGet<any[]>('/tasks').catch((error) => [{ error: String(error) }]),
    apiGet<any>('/tasks/queue/status').catch((error) => ({ error: String(error) })),
  ]);
  return <section>
    <div className="hero">
      <p className="eyebrow">Tasks</p>
      <h1>任务列表</h1>
      <p className="sub">查看生成状态、失败原因、route metadata 和输出图片。点击任务可以进入详情页。</p>
    </div>

    <div className="card" style={{marginTop: 20}}>
      <p className="eyebrow">Queue Status</p>
      <div className="queue-grid">
        {Object.entries(queue.queue ?? {}).map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>)}
      </div>
      <pre>{JSON.stringify(queue.database ?? {}, null, 2)}</pre>
    </div>

    <div className="task-list">
      {tasks.map((task, i) => <Link className="task-card" href={task.id ? `/tasks/${task.id}` : '/tasks'} key={task.id ?? i}>
        <div className="task-head">
          <span className={statusClass(task.status)}>{task.status ?? 'UNKNOWN'}</span>
          <span className="muted">{task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</span>
        </div>
        <h3>{task.model ?? 'Task'}</h3>
        <p>{task.prompt ?? task.error}</p>
        {task.errorMessage ? <pre className="error">{task.errorMessage}</pre> : null}
        <div className="muted">{task.images?.length ?? 0} image(s) · {task.elapsedMs ? `${task.elapsedMs}ms` : 'pending'}</div>
      </Link>)}
    </div>
  </section>;
}
