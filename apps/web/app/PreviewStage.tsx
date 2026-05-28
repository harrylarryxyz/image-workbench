import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TaskImage, TaskResult } from './create-types';
import { statusVariant } from './create-utils';

type PreviewStageProps = {
  result: TaskResult | null;
  primaryStatus: string;
  previewUrl: string | null;
  referencePreview: string | null;
  prompt: string;
  firstImage: TaskImage | null;
  versionChain: TaskResult[];
  metrics: string[][];
};

export function PreviewStage({ result, primaryStatus, previewUrl, referencePreview, prompt, firstImage, versionChain, metrics }: PreviewStageProps) {
  return <section className="preview-stage" aria-label="预览画布">
    <div className="task-head">
      <div>
        <p className="eyebrow">LIVE CANVAS</p>
        <h2>{result?.id ? `作品 ${result.id.slice(0, 8)}` : '预览画布'}</h2>
      </div>
      <Badge variant={statusVariant(primaryStatus)}>{primaryStatus}</Badge>
    </div>
    <div className={referencePreview && previewUrl ? 'compare-stage' : 'preview-frame'}>
      {referencePreview && previewUrl ? <>
        <div><span>Before</span><img src={referencePreview} alt="reference before" /></div>
        <div><span>After</span><img src={previewUrl} alt={prompt || 'generated image'} /></div>
      </> : previewUrl ? <img src={previewUrl} alt={prompt || 'generated image'} /> : referencePreview ? <div className="preview-empty"><b>参考图已载入</b><img src={referencePreview} alt="reference" /></div> : <div className="preview-empty"><b>等待创作</b><span>输入描述或上传参考图后，作品会在这里呈现。</span></div>}
    </div>
    <div>
      <div className="metric-grid">
        {metrics.map(([label, value]) => <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>)}
      </div>
      <div className="image-action-toolbar">
        {previewUrl ? <Button asChild type="button" size="sm" variant="outline"><a href={previewUrl} target="_blank" rel="noreferrer" download>下载原图</a></Button> : null}
        {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑</Link></Button> : null}
        {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送 Canvas</Link></Button> : null}
        {result?.id ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/tasks/${result.id}`}>任务详情</Link></Button> : null}
      </div>
      {versionChain.length ? <div className="version-strip">
        {versionChain.map((task) => <Button asChild type="button" size="sm" variant="outline" key={task.id ?? Math.random()}><Link href={task.id ? `/tasks/${task.id}` : '#'}>{task.type ?? 'task'} · {task.status ?? 'created'} · {task.id?.slice(0, 8)}</Link></Button>)}
      </div> : null}
      {result?.error || result?.errorMessage ? <Card className="mt-4 border-destructive/40 bg-destructive/10"><CardContent className="pt-6 text-sm text-destructive">{result.errorMessage ?? result.error}</CardContent></Card> : null}
    </div>
  </section>;
}
