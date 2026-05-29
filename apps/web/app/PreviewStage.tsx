import Link from 'next/link';
import {
  Eyebrow,
  StudioActionToolbar,
  StudioCompareFrame,
  StudioComparePane,
  StudioEmptyPreview,
  StudioMetricGrid,
  StudioMetricItem,
  StudioPreviewFrame,
  StudioPreviewStage,
} from '@/components/product/studio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/product/state';
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
  const taskHref = result?.id ? `/tasks/${result.id}` : '/tasks';
  return <StudioPreviewStage aria-label="预览画布">
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <Eyebrow>LIVE CANVAS</Eyebrow>
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{result?.id ? `作品 ${result.id.slice(0, 8)}` : '预览画布'}</h2>
      </div>
      <Badge variant={statusVariant(primaryStatus)}>{primaryStatus}</Badge>
    </div>
    {referencePreview && previewUrl ? <StudioCompareFrame>
      <StudioComparePane>
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-3 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">Before</span>
        <img className="h-full max-h-[620px] w-full object-contain" src={referencePreview} alt="reference before" />
      </StudioComparePane>
      <StudioComparePane>
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-3 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">After</span>
        <img className="h-full max-h-[620px] w-full object-contain" src={previewUrl} alt={prompt || 'generated image'} />
      </StudioComparePane>
    </StudioCompareFrame> : <StudioPreviewFrame>
      {previewUrl ? <img className="h-full max-h-[620px] w-full object-contain" src={previewUrl} alt={prompt || 'generated image'} /> : referencePreview ? <StudioEmptyPreview><b className="text-lg text-foreground">参考图已载入</b><img className="max-h-[420px] w-full object-contain" src={referencePreview} alt="reference" /></StudioEmptyPreview> : <StudioEmptyPreview><b className="text-lg text-foreground">等待创作</b><span>输入描述或上传参考图后，作品会在这里呈现。</span></StudioEmptyPreview>}
    </StudioPreviewFrame>}
    <div className="relative z-10 space-y-3">
      <StudioMetricGrid>
        {metrics.map(([label, value]) => <StudioMetricItem label={label} value={value} key={label} />)}
      </StudioMetricGrid>
      <StudioActionToolbar>
        {previewUrl ? <Button asChild type="button" size="sm" variant="outline"><a href={previewUrl} target="_blank" rel="noreferrer" download>下载原图</a></Button> : null}
        {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑</Link></Button> : null}
        {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送 Canvas</Link></Button> : null}
        {result?.id ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/tasks/${result.id}`}>任务详情</Link></Button> : null}
      </StudioActionToolbar>
      {versionChain.length ? <StudioActionToolbar>
        {versionChain.map((task) => <Button asChild type="button" size="sm" variant="outline" key={task.id ?? Math.random()}><Link href={task.id ? `/tasks/${task.id}` : '#'}>{task.type ?? 'task'} · {task.status ?? 'created'} · {task.id?.slice(0, 8)}</Link></Button>)}
      </StudioActionToolbar> : null}
      {result?.error || result?.errorMessage ? <div className="mt-4"><ErrorState title="这次创作没有完成" description="生成服务暂时不可用，作品参数已保留，可稍后重试或查看任务详情。" actionHref={taskHref} actionLabel="查看任务" /></div> : null}
    </div>
  </StudioPreviewStage>;
}
