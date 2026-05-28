import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { assetUrls } from './gallery-utils';
import type { GalleryImage } from './types';

type GalleryLightboxProps = { selected: GalleryImage | null };

export function GalleryLightbox({ selected }: GalleryLightboxProps) {
  if (!selected) return null;
  return <Card className="mt-5 lightbox-panel bg-card/85">
    <CardContent className="grid gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Lightbox detail</p>
          <CardTitle className="mt-2 leading-7">{selected.prompt ?? selected.storageKey}</CardTitle>
          <CardDescription className="mt-2">{selected.model ?? 'model unknown'} · {selected.width && selected.height ? `${selected.width}×${selected.height}` : selected.format} · {selected.sizeBytes ? `${Math.round(selected.sizeBytes / 1024)} KB` : 'size pending'}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.taskId ? <Button asChild size="sm" variant="outline"><Link href={`/tasks/${selected.taskId}`}>任务详情</Link></Button> : null}
          {selected.storageKey ? <Button asChild size="sm" variant="outline"><Link href={`/edit?ref=${encodeURIComponent(selected.storageKey)}&prompt=${encodeURIComponent(selected.prompt ?? '')}`}>作为参考图编辑</Link></Button> : null}
          {selected.storageKey ? <Button asChild size="sm" variant="outline"><Link href={`/canvas?image=${encodeURIComponent(selected.storageKey)}&prompt=${encodeURIComponent(selected.prompt ?? '')}`}>发送 Canvas</Link></Button> : null}
          {selected.storageKey ? <Button asChild size="sm" variant="outline"><Link href={`/?prompt=${encodeURIComponent(`@image(${selected.storageKey}) ${selected.prompt ?? ''}`)}`}>@image 引用</Link></Button> : null}
        </div>
        <div className="flex flex-wrap gap-2">{selected.tags?.map((tag) => <Button asChild size="sm" variant="secondary" key={tag}><Link href={`/gallery?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></Button>)}</div>
        {selected.sourceAsset || selected.derivatives?.length ? <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">这张图包含来源链路或派生版本，可通过上方动作继续复用。</div> : null}
      </div>
      {assetUrls(selected).assetUrl ? <a href={assetUrls(selected).assetUrl ?? '#'} target="_blank" rel="noreferrer"><img className="lightbox-image" src={assetUrls(selected).assetUrl ?? ''} alt={selected.prompt ?? 'asset'} /></a> : null}
    </CardContent>
  </Card>;
}
