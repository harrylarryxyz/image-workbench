import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { assetUrls, statusVariant } from './gallery-utils';
import type { GalleryImage } from './types';

type GalleryCardProps = { image: GalleryImage; index: number };

export function GalleryCard({ image, index }: GalleryCardProps) {
  const { assetUrl, thumbUrl } = assetUrls(image);
  const reuseHref = `/?prompt=${encodeURIComponent(image.prompt ?? '')}&model=${encodeURIComponent(image.model ?? 'gpt-image-2')}&size=${encodeURIComponent(image.params?.size ?? '1024x1024')}&quality=${encodeURIComponent(image.params?.quality ?? 'low')}&format=${encodeURIComponent(image.format ?? 'png')}`;
  const referenceHref = `/edit?ref=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
  const canvasHref = `/canvas?image=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
  return <article className="image-card">
    <Link className="lightbox-link" href={image.id ? `/gallery?selected=${image.id}` : assetUrl ?? '#'}>
      {thumbUrl ? <img className="thumb-img" src={thumbUrl} alt={image.prompt ?? 'generated image'} /> : <div className="thumb">{image.format ?? 'image'}</div>}
    </Link>
    <div className="hover-toolbar">
      {image.taskId ? <Button asChild size="sm" variant="secondary"><Link href={`/tasks/${image.taskId}`}>任务</Link></Button> : null}
      {assetUrl ? <Button asChild size="sm" variant="secondary"><a href={assetUrl} download>下载</a></Button> : null}
      <Button asChild size="sm" variant="secondary"><Link href={reuseHref}>复用</Link></Button>
      {image.storageKey ? <Button asChild size="sm" variant="secondary"><Link href={referenceHref}>编辑</Link></Button> : null}
      {image.storageKey ? <Button asChild size="sm" variant="secondary"><Link href={canvasHref}>Canvas</Link></Button> : null}
    </div>
    <div className="image-card-body">
      <p className="image-card-title">{image.favorite ? '★ ' : ''}{image.prompt ?? 'Untitled asset'}</p>
      <div className="task-head">
        <Badge variant={statusVariant(image.taskStatus)}>{image.taskStatus ?? image.taskType ?? 'IMAGE'}</Badge>
        <span className="fine-print">{image.createdAt ? new Date(image.createdAt).toLocaleDateString() : ''}</span>
      </div>
      <div className="fine-print">{image.model ?? 'default model'} · {image.width && image.height ? `${image.width}×${image.height}` : image.format} · {image.sizeBytes ? `${Math.round(image.sizeBytes / 1024)} KB` : 'preparing'}</div>
      <div className="flex flex-wrap gap-2">{image.tags?.slice(0, 4).map((tag) => <Button asChild size="sm" variant="outline" key={tag}><Link href={`/gallery?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></Button>)}</div>
    </div>
  </article>;
}
