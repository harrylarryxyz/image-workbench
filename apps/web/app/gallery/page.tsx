import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { apiGet } from '../../lib/api';
import { GalleryBatchActions } from './gallery-batch-actions';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const TERMINAL = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

type Collection = { id: string; name: string; count?: number; preview?: GalleryImage[] };
type GalleryImage = {
  id?: string;
  prompt?: string;
  error?: string;
  storageKey?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  taskId?: string;
  taskType?: string;
  taskStatus?: string;
  model?: string;
  params?: { size?: string; quality?: string };
  format?: string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  favorite?: boolean;
  rating?: number | null;
  tags?: string[];
  collections?: Array<{ id: string; name: string }>;
  derivatives?: Array<{ id: string; storageKey: string; thumbnailUrl?: string }>;
  sourceAsset?: GalleryImage | null;
  sourceAssetId?: string | null;
  createdAt?: string;
};

function withBase(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE}${url}`;
}

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
}

function assetUrls(image: GalleryImage) {
  const assetUrl = withBase(image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
  const thumbUrl = withBase(image.thumbnailUrl ?? image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
  return { assetUrl, thumbUrl };
}

export default async function GalleryPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['type', 'status', 'model', 'q', 'tag', 'collectionId', 'favorite']) {
    const value = query?.[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  const selectedId = typeof query?.selected === 'string' ? query.selected : '';
  const path = params.toString() ? `/gallery?${params}` : '/gallery';
  const [images, collections, selected] = await Promise.all([
    apiGet<GalleryImage[]>(path).catch((error): GalleryImage[] => [{ error: String(error) }]),
    apiGet<Collection[]>('/gallery/collections').catch(() => []),
    selectedId ? apiGet<GalleryImage>(`/gallery/${selectedId}`).catch(() => null) : Promise.resolve(null),
  ]);
  const hasImages = Array.isArray(images) && !images[0]?.error && images.length > 0;

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Asset Library 2.0</p>
      <h1>素材资产中心</h1>
      <p className="sub">搜索、收藏、标签、Collection、批量下载、详情 Lightbox、来源链路和派生图都在图库里完成；Canvas 与 Create Studio 复用同一套资产入口。</p>
    </div>

    <Card className="mt-5 bg-card/85">
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <div className="space-y-2"><Label htmlFor="gallery-q">Search</Label><Input id="gallery-q" name="q" defaultValue={typeof query?.q === 'string' ? query.q : ''} placeholder="prompt / key / model" /></div>
          <div className="space-y-2"><Label htmlFor="gallery-tag">Tag</Label><Input id="gallery-tag" name="tag" defaultValue={typeof query?.tag === 'string' ? query.tag : ''} placeholder="favorite style" /></div>
          <div className="space-y-2"><Label htmlFor="gallery-type">Type</Label><NativeSelect id="gallery-type" name="type" defaultValue={typeof query?.type === 'string' ? query.type : ''}><option value="">全部</option><option value="image.generate">生成</option><option value="image.edit">编辑</option></NativeSelect></div>
          <div className="space-y-2"><Label htmlFor="gallery-status">Status</Label><NativeSelect id="gallery-status" name="status" defaultValue={typeof query?.status === 'string' ? query.status : ''}><option value="">全部</option>{TERMINAL.map((status) => <option key={status}>{status}</option>)}</NativeSelect></div>
          <div className="space-y-2"><Label htmlFor="gallery-model">Model</Label><Input id="gallery-model" name="model" defaultValue={typeof query?.model === 'string' ? query.model : ''} placeholder="gpt-image-2" /></div>
          <div className="space-y-2"><Label htmlFor="gallery-collection">Collection</Label><NativeSelect id="gallery-collection" name="collectionId" defaultValue={typeof query?.collectionId === 'string' ? query.collectionId : ''}><option value="">全部 Collection</option>{collections.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.count ?? 0})</option>)}</NativeSelect></div>
          <div className="flex items-end"><Button className="w-full" type="submit">筛选素材</Button></div>
        </form>
      </CardContent>
    </Card>

    {collections.length ? <div className="collection-strip">
      {collections.map((collection) => <Button asChild key={collection.id} variant="outline" className="h-auto rounded-full px-4 py-2"><Link href={`/gallery?collectionId=${collection.id}`}><b>{collection.name}</b><span className="text-muted-foreground">{collection.count ?? 0} assets</span></Link></Button>)}
    </div> : null}

    {selected ? <Card className="mt-5 lightbox-panel bg-card/85">
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
          {selected.sourceAsset || selected.derivatives?.length ? <details className="diagnostics" open><summary>Lineage</summary><pre className="debug-json">{JSON.stringify({ sourceAsset: selected.sourceAsset, derivatives: selected.derivatives }, null, 2)}</pre></details> : null}
        </div>
        {assetUrls(selected).assetUrl ? <a href={assetUrls(selected).assetUrl ?? '#'} target="_blank" rel="noreferrer"><img className="lightbox-image" src={assetUrls(selected).assetUrl ?? ''} alt={selected.prompt ?? 'asset'} /></a> : null}
      </CardContent>
    </Card> : null}

    {hasImages ? <GalleryBatchActions images={images.flatMap((image) => image.id ? [{ id: image.id, prompt: image.prompt }] : [])} /> : null}

    {!hasImages ? <Card className="mt-5">
      <CardHeader>
        <p className="eyebrow">Empty state</p>
        <CardTitle>还没有可展示的资产</CardTitle>
        <CardDescription>先从 Create Studio 生成图片，或在 Edit 上传参考图。错误信息可在下方 Diagnostics 查看。</CardDescription>
      </CardHeader>
      <CardContent>
        <details className="diagnostics" open={Boolean(images[0]?.error)}>
          <summary>Diagnostics</summary>
          <pre className="debug-json">{JSON.stringify(images, null, 2)}</pre>
        </details>
      </CardContent>
    </Card> : null}

    <div className="masonry-grid mt-5">{hasImages ? images.map((image, i) => {
      const { assetUrl, thumbUrl } = assetUrls(image);
      const reuseHref = `/?prompt=${encodeURIComponent(image.prompt ?? '')}&model=${encodeURIComponent(image.model ?? 'gpt-image-2')}&size=${encodeURIComponent(image.params?.size ?? '1024x1024')}&quality=${encodeURIComponent(image.params?.quality ?? 'low')}&format=${encodeURIComponent(image.format ?? 'png')}`;
      const referenceHref = `/edit?ref=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
      const canvasHref = `/canvas?image=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
      return <article className="image-card" key={image.id ?? i}>
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
          <p className="image-card-title">{image.favorite ? '★ ' : ''}{image.prompt ?? image.error}</p>
          <div className="task-head">
            <Badge variant={statusVariant(image.taskStatus)}>{image.taskStatus ?? image.taskType ?? 'IMAGE'}</Badge>
            <span className="fine-print">{image.createdAt ? new Date(image.createdAt).toLocaleDateString() : ''}</span>
          </div>
          <div className="fine-print">{image.model ?? 'model unknown'} · {image.width && image.height ? `${image.width}×${image.height}` : image.format} · {image.sizeBytes ? `${Math.round(image.sizeBytes / 1024)} KB` : 'size pending'}</div>
          <div className="flex flex-wrap gap-2">{image.tags?.slice(0, 4).map((tag) => <Button asChild size="sm" variant="outline" key={tag}><Link href={`/gallery?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></Button>)}</div>
          <details className="diagnostics">
            <summary>Diagnostics</summary>
            <pre className="debug-json">{JSON.stringify({ id: image.id, taskId: image.taskId, storageKey: image.storageKey, params: image.params, collections: image.collections }, null, 2)}</pre>
          </details>
        </div>
      </article>;
    }) : null}</div>
  </section>;
}
