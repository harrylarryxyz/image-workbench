import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statusVariant, withApi } from './canvas-utils';
import type { CanvasRun, CanvasRunResult } from './types';

type RunOutputPanelProps = {
  runItems: CanvasRunResult['created'];
  visibleRuns: CanvasRun[];
  replayRun: (id: string) => void;
};

export function RunOutputPanel({ runItems = [], visibleRuns, replayRun }: RunOutputPanelProps) {
  return <Card>
    <CardHeader>
      <p className="eyebrow">Run output</p>
      <CardTitle>{runItems.length ? `${runItems.length} 个节点已创建任务` : '运行记录与缩略图'}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="task-list">
        {runItems.map((item) => <Card key={`${item.nodeId}-${item.taskId}`}>
          <CardContent className="space-y-3 pt-6">
            <div className="task-head"><Badge variant={statusVariant(item.status)}>{item.status}</Badge><span className="fine-print">{item.nodeId}</span></div>
            <h3>{item.taskId}</h3>
            <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/tasks/${item.taskId}`}>打开任务详情</Link></Button></div>
          </CardContent>
        </Card>)}
        {visibleRuns.map((run) => (run.nodes ?? []).map((node) => <Card key={node.id}>
          <CardContent className="space-y-3 pt-6">
            <div className="task-head"><Badge variant={statusVariant(node.status)}>{node.status}</Badge><span className="fine-print">{node.nodeId}</span></div>
            <h3>{node.taskId ?? node.id}</h3>
            <div className="reference-strip">
              {(node.images ?? []).map((image, index) => {
                const src = withApi(image.thumbnailUrl ?? image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
                return src ? <Link className="reference-card" href={`/gallery?q=${encodeURIComponent(image.storageKey ?? '')}`} key={`${node.id}-${index}`}><img src={src} alt="canvas run result" /></Link> : null;
              })}
            </div>
            {node.taskId ? <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/tasks/${node.taskId}`}>任务详情</Link></Button><Button size="sm" variant="outline" type="button" onClick={() => replayRun(run.id)}>Replay run</Button></div> : null}
          </CardContent>
        </Card>))}
      </div>
    </CardContent>
  </Card>;
}
