import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type TaskImage = { id?: string; assetUrl?: string; storageKey?: string; format?: string; sizeBytes?: number; width?: number | null; height?: number | null };
type TaskDetail = { id: string; status?: string; model?: string; prompt?: string; type?: string; params?: Record<string, unknown>; route?: unknown; diagnostics?: unknown; images?: TaskImage[]; error?: string; errorMessage?: string; elapsedMs?: number | null; createdAt?: string };

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
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
      <div className="task-head"><div><p className="eyebrow">Task Detail</p><h1>{task.model ?? 'Task'}</h1></div><Badge variant={statusVariant(task.status)}>{task.status ?? 'UNKNOWN'}</Badge></div>
      <p className="sub">{task.prompt ?? task.error}</p>
      <div className="preview-frame">
        {firstImageUrl ? <img src={firstImageUrl} alt={task.prompt ?? 'generated image'} /> : <div className="preview-empty"><b>没有输出图片</b><span>任务失败、取消或仍在队列中时，这里会保持空状态。</span></div>}
      </div>
      <div className="image-action-toolbar">
        <Button asChild variant="outline"><Link href="/tasks">返回任务列表</Link></Button>
        <Button asChild variant="outline"><Link href={reuseHref}>复用参数生成</Link></Button>
        <Button asChild variant="outline"><Link href="/gallery">打开 Asset Library</Link></Button>
        {firstImage?.storageKey ? <Button asChild variant="outline"><Link href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(task.prompt ?? '')}`}>作为参考图编辑</Link></Button> : null}
        {firstImageUrl ? <Button asChild variant="outline"><a href={firstImageUrl} download>下载输出</a></Button> : null}
        {task.status === 'FAILED' || task.status === 'CANCELLED' ? <form action={`/api/tasks/${task.id}/retry`} method="post"><Button variant="outline" type="submit">重试任务</Button></form> : null}
        {task.status === 'QUEUED' ? <form action={`/api/tasks/${task.id}/cancel`} method="post"><Button variant="outline" type="submit">取消排队</Button></form> : null}
      </div>
      {task.errorMessage ? <Card className="border-destructive/40 bg-destructive/10 mt-4"><CardContent className="pt-6 text-sm text-destructive-foreground">{task.errorMessage}</CardContent></Card> : null}
    </div>

    <Card>
      <CardHeader>
        <p className="eyebrow">Diagnostics</p>
        <CardTitle>请求详情</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  </section>;
}
