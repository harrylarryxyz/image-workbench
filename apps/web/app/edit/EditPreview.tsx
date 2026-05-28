import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/product/state';
import { assetSrc, statusVariant } from './edit-utils';
import type { EditTask, Uploaded } from './types';

type EditPreviewProps = {
  task: EditTask | null;
  uploads: Uploaded[];
  outputUrl: string;
  prompt: string;
  firstOutput?: { storageKey?: string } | null;
};

export function EditPreview({ task, uploads, outputUrl, prompt, firstOutput }: EditPreviewProps) {
  return <section className="preview-stage">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="eyebrow">PreviewStage</p><h2>{task?.id ?? `${uploads.length} / 4 references`}</h2></div>
      <Badge variant={statusVariant(task?.status)}>{task?.status ?? 'READY'}</Badge>
    </div>
    <div className="preview-frame">
      {outputUrl ? <img src={outputUrl} alt={task?.prompt ?? 'edited image'} /> : uploads[0] ? <img src={assetSrc(uploads[0].assetUrl)} alt={uploads[0].originalName ?? 'reference'} /> : <div className="preview-empty"><b>上传参考图开始编辑</b><span>输出图会替换这里的参考预览；图片工具条会提供下载、继续编辑和发送到 Canvas。</span></div>}
    </div>
    <div className="flex flex-wrap gap-2">
      {outputUrl ? <Button asChild variant="secondary"><a href={outputUrl} target="_blank" rel="noreferrer" download>下载输出</a></Button> : null}
      {firstOutput?.storageKey ? <Button asChild variant="secondary"><Link href={`/edit?ref=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑输出</Link></Button> : null}
      {firstOutput?.storageKey ? <Button asChild variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送到 Canvas</Link></Button> : null}
      {task?.id ? <Button asChild variant="outline"><Link href={`/tasks/${task.id}`}>任务详情</Link></Button> : null}
    </div>
    <div className="reference-strip">
      {uploads.map((item) => <Card key={item.storageKey} className="overflow-hidden p-0">
        <img src={assetSrc(item.assetUrl)} alt={item.originalName ?? 'reference'} />
        <CardContent className="p-3"><p className="text-xs text-muted-foreground">{item.originalName ?? item.storageKey}</p></CardContent>
      </Card>)}
    </div>
    {task?.errorMessage ? <ErrorState title="编辑任务没有完成" description="编辑服务暂时不可用，参考图和 mask 已保留，可稍后重试。" actionHref={task.id ? `/tasks/${task.id}` : '/tasks'} actionLabel="查看任务" /> : null}
  </section>;
}
