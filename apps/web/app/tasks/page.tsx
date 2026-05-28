import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, friendlyError } from '@/components/product/state';
import { apiGet } from '../../lib/api';

type Task = { id?: string; status?: string; model?: string; prompt?: string; error?: string; errorMessage?: string; images?: unknown[]; elapsedMs?: number | null; createdAt?: string };
type QueueStatus = { queue?: Record<string, number>; database?: unknown; error?: string };

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
}

function taskTitle(task: Task) {
  if (task.error) return '历史暂时不可用';
  return task.model ?? 'Creative task';
}

function taskDescription(task: Task) {
  if (task.error || task.errorMessage) return '任务服务暂时没有返回历史记录，稍后刷新即可。';
  return task.prompt ?? '没有记录 prompt，打开详情可查看任务上下文。';
}

export default async function TasksPage() {
  const [tasks, queue] = await Promise.all([
    apiGet<Task[]>('/tasks').catch((error): Task[] => [{ error: friendlyError(error, '任务历史暂时不可用') }]),
    apiGet<QueueStatus>('/tasks/queue/status').catch((): QueueStatus => ({ error: '队列指标暂时不可用' })),
  ]);
  const queueEntries = Object.entries(queue.queue ?? {});
  const hasTaskError = Boolean(tasks[0]?.error && !tasks[0]?.id);
  const visibleTasks = hasTaskError ? [] : tasks;

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">History</p>
      <h1>创作历史</h1>
      <p className="sub">按作品流查看任务状态、输出数量和继续创作入口；队列细节保留到 Ops。</p>
    </div>

    <Card className="mt-5">
      <CardHeader>
        <div className="task-head"><div><p className="eyebrow">Queue pulse</p><CardTitle>队列概览</CardTitle></div><Button asChild variant="outline"><Link href="/ops">打开 Ops</Link></Button></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="queue-grid">
          {queueEntries.length ? queueEntries.map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>) : <EmptyState eyebrow="QUEUE" title="暂无队列指标" description="本地预览或服务短暂不可达时，创作历史仍会保持可浏览。" />}
        </div>
      </CardContent>
    </Card>

    {hasTaskError ? <div className="mt-5"><ErrorState title="创作历史暂时不可用" description={tasks[0]?.error} actionHref="/ops" actionLabel="查看服务状态" /></div> : null}
    {!hasTaskError && visibleTasks.length === 0 ? <div className="mt-5"><EmptyState title="还没有创作历史" description="从 Create Studio 生成第一张图后，任务和作品链路会出现在这里。" action={<Button asChild><Link href="/">开始创作</Link></Button>} /></div> : null}

    <div className="task-list">
      {visibleTasks.map((task, i) => <Link className="block" href={task.id ? `/tasks/${task.id}` : '/tasks'} key={task.id ?? i}>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="task-head">
              <Badge variant={statusVariant(task.status)}>{task.status ?? 'Queued'}</Badge>
              <span className="muted">{task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</span>
            </div>
            <h3>{taskTitle(task)}</h3>
            <p>{taskDescription(task)}</p>
            <div className="muted">{task.images?.length ?? 0} image(s) · {task.elapsedMs ? `${task.elapsedMs}ms` : 'in progress'}</div>
          </CardContent>
        </Card>
      </Link>)}
    </div>
  </section>;
}
