import Link from 'next/link';
import { apiGet } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  return 'status wait';
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await apiGet<any>(`/tasks/${id}`).catch((error) => ({ id, error: String(error) }));
  const firstImage = task.images?.[0];
  const reuseHref = `/?prompt=${encodeURIComponent(task.prompt ?? '')}&model=${encodeURIComponent(task.model ?? 'gpt-image-2')}&size=${encodeURIComponent(task.params?.size ?? '1024x1024')}&quality=${encodeURIComponent(task.params?.quality ?? 'low')}&format=${encodeURIComponent(task.params?.format ?? 'png')}&apiMode=${encodeURIComponent(task.params?.apiMode ?? 'auto')}`;

  return <section className="grid two">
    <div className="card">
      <p className="eyebrow">Task Detail</p>
      <h1>{task.model ?? 'Task'}</h1>
      <div className="task-head"><span className={statusClass(task.status)}>{task.status ?? 'UNKNOWN'}</span><span className="muted">{task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</span></div>
      <p className="sub">{task.prompt ?? task.error}</p>
      <div className="actions">
        <Link className="pill" href="/tasks">返回任务列表</Link>
        <Link className="pill" href={reuseHref}>复用参数生成</Link>
        <Link className="pill" href="/gallery">打开 Gallery</Link>
        {task.status === 'FAILED' || task.status === 'CANCELLED' ? <form action={`/api/tasks/${task.id}/retry`} method="post"><button className="pill" type="submit">重试任务</button></form> : null}
        {task.status === 'QUEUED' ? <form action={`/api/tasks/${task.id}/cancel`} method="post"><button className="pill" type="submit">取消排队</button></form> : null}
      </div>
      {firstImage ? <img className="preview" src={`${API_BASE}${firstImage.assetUrl}`} alt={task.prompt ?? 'generated image'} /> : null}
      {task.errorMessage ? <pre className="error">{task.errorMessage}</pre> : null}
    </div>
    <div className="card">
      <p className="eyebrow">Diagnostics</p>
      <h1>请求详情</h1>
      <h3>Route</h3>
      <pre>{JSON.stringify(task.route ?? {}, null, 2)}</pre>
      <h3>Params</h3>
      <pre>{JSON.stringify(task.params ?? {}, null, 2)}</pre>
      <h3>Diagnostics</h3>
      <pre>{JSON.stringify(task.diagnostics ?? {}, null, 2)}</pre>
      <h3>Images</h3>
      <pre>{JSON.stringify(task.images ?? [], null, 2)}</pre>
    </div>
  </section>;
}
