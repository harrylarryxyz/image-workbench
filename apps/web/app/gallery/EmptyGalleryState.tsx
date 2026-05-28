import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/product/state';
import type { GalleryImage } from './types';

type EmptyGalleryStateProps = { images: GalleryImage[] };

export function EmptyGalleryState({ images }: EmptyGalleryStateProps) {
  if (images[0]?.error) return <div className="mt-5"><ErrorState title="素材库暂时不可用" description="素材服务没有返回图库内容，已有作品不会丢失。" actionHref="/ops" actionLabel="查看服务状态" /></div>;
  return <div className="mt-5"><EmptyState eyebrow="Asset Library" title="还没有可展示的资产" description="从 Create Studio 生成图片，或在 Edit 上传参考图；素材会自动出现在这里。" action={<div className="flex flex-wrap justify-center gap-2"><Button asChild><Link href="/">开始创作</Link></Button><Button asChild variant="outline"><Link href="/edit">上传参考图</Link></Button></div>} /></div>;
}
