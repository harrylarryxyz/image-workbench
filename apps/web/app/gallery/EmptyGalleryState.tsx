import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GalleryImage } from './types';

type EmptyGalleryStateProps = { images: GalleryImage[] };

export function EmptyGalleryState({ images }: EmptyGalleryStateProps) {
  return <Card className="mt-5">
    <CardHeader>
      <p className="eyebrow">Empty state</p>
      <CardTitle>还没有可展示的资产</CardTitle>
      <CardDescription>先从 Create Studio 生成图片，或在 Edit 上传参考图；素材会自动出现在这里。</CardDescription>
    </CardHeader>
    {images[0]?.error ? <CardContent><div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">素材加载失败，请稍后重试。</div></CardContent> : null}
  </Card>;
}
