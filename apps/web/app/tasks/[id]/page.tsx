import Link from 'next/link';
import { apiGet } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type TaskImage = { id?: string; assetUrl?: string; storageKey?: string; format?: string; sizeBytes?: number; width?: number | null; height?: number | null };
type TaskDetail = { id: string; status?: string; model?: string; prompt?: string; type?: string; params?: Record<string, unknown>; route?: unknown; diagnostics?: unknown; images?: TaskImage[]; error?: string; errorMessage?: string; elapsedMs?: number | null; createdAt?: string };

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  if (normalized === 'queued' || normalized === 'pending') return 'status wait';
  return 'status neutral';
}

function imageHref(image?: TaskImage) {
  if (!image) return null;
  if (image.assetUrl?.startsWith('/assets/')) return `${API_BASE}${image.assetUrl}`;
  if (image.assetUrl) return image.assetUrl;
  if (image.storageKey) return `${API_BASE}/assets/file?key=${encodeURIComponent(image.storageKey)}`;
  return null;
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await apiGet<TaskDetail>(`/tasks/${id}`).catch((error) => ({ id, error: String(error) } as TaskDetail));
  const firstImage = task.images?.[0];
  const firstImageUrl = imageHref(firstImage);
  const reuseHref = `/?prompt=${encodeURIComponent(task.prompt ?? '')}&model=${encodeURIComponent(task.model ?? 'gpt-image-2')}&size=${encodeURIComponent(String(task.params?.size ?? '1024x1024'))}&quality=${encodeURIComponent(String(task.params?.quality ?? 'low'))}&format=${encodeURIComponent(String(task.params?.format ?? 'png'))}&apiMode=${encodeURIComponent(String(task.params?.apiMode ?? 'auto'))}`;

  return <section className="grid two">
    <div className="preview-stage">
      <div className="task-head"><div><p className="eyebrow">Task Detail</p><h1>{task.model ?? 'Task'}</h1></div><span className={statusClass(task.status)}>{task.status ?? 'UNKNOWN'}</span></div>
      <p className="sub">{task.prompt ?? task.error}</p>
      <div className="preview-frame">
        {firstImageUrl ? <img src={firstImageUrl} alt={task.prompt ?? 'generated image'} /> : <div className="preview-empty"><b>没有输出图片</b><span>任务失败、取消或仍在队列中时，这里会保持空状态。</span></div>}
      </div>
      <div className="image-action-toolbar">
        <Link className="pill" href="/tasks">返回任务列表</Link>
        <Link className="pill" href={reuseHref}>复用参数生成</Link>
        <Link className="pill" href="/gallery">打开 Asset Library</Link>
        {firstImage?.storageKey ? <Link className="pill" href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(task.prompt ?? '')}`}>作为参考图编辑</Link> : null}
        {firstImageUrl ? <a className="pill" href={firstImageUrl} download>下载输出</a> : null}
        {task.status === 'FAILED' || task.status === 'CANCELLED' ? <form action={`/api/tasks/${task.id}/retry`} method="post"><button className="pill" type="submit">重试任务</button></form> : null}
        {task.status === 'QUEUED' ? <form action={`/api/tasks/${task.id}/cancel`} method="post"><button className="pill" type="submit">取消排队</button></form> : null}
      </div>
      {task.errorMessage ? <div className="notice error">{task.errorMessage}</div> : null}
    </div>

    <div className="card">
      <p className="eyebrow">Diagnostics</p>
      <h2>请求详情</h2>
      <div className="kv">
        <b>Task</b><span>{task.id}</span>
        <b>Type</b><span>{task.type ?? '-'}</span>
        <b>Elapsed</b><span>{task.elapsedMs ? `${task.elapsedMs}ms` : 'pending'}</span>
        <b>Created</b><span>{task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</span>
      </div>
      <details className="diagnostics" open>
        <summary>Route / Params / Images</summary>
        <pre className="debug-json">{JSON.stringify({ route: task.route ?? {}, params: task.params ?? {}, diagnostics: task.diagnostics ?? {}, images: task.images ?? [] }, null, 2)}</pre>
      </details>
    </div>
  </section>;
}
