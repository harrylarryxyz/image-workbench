import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <p className="sub">任务列表聚焦创作决策：状态、模型、耗时和缩略摘要。</p>
    </div>

    <Card className="mt-5">
      <CardHeader>
        <div className="task-head"><div><p className="eyebrow">Queue Status</p><CardTitle>队列状态</CardTitle></div><Button asChild variant="outline"><Link href="/ops">打开 Ops</Link></Button></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="queue-grid">
          {queueEntries.length ? queueEntries.map(([key, value]) => <div className="metric" key={key}><b>{String(value)}</b><span>{key}</span></div>) : <Card className="border-border/70 bg-muted/30"><CardContent className="pt-6 text-sm text-muted-foreground">No queue metrics available.</CardContent></Card>}
        </div>
      </CardContent>
    </Card>

    <div className="task-list">
      {tasks.map((task, i) => <Link className="block" href={task.id ? `/tasks/${task.id}` : '/tasks'} key={task.id ?? i}>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="task-head">
              <Badge variant={statusVariant(task.status)}>{task.status ?? 'UNKNOWN'}</Badge>
              <span className="muted">{task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</span>
            </div>
            <h3>{task.model ?? 'Task'}</h3>
            <p>{task.prompt ?? task.error}</p>
            {task.errorMessage ? <Card className="border-destructive/40 bg-destructive/10"><CardContent className="pt-6 text-sm text-destructive-foreground">{task.errorMessage}</CardContent></Card> : null}
            <div className="muted">{task.images?.length ?? 0} image(s) · {task.elapsedMs ? `${task.elapsedMs}ms` : 'pending'}</div>
          </CardContent>
        </Card>
      </Link>)}
    </div>
  </section>;
}
