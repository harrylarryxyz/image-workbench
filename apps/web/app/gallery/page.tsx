import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { GalleryBatchActions } from './gallery-batch-actions';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const TERMINAL = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

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
  createdAt?: string;
};

function withBase(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE}${url}`;
}

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  return 'status wait';
}

export default async function GalleryPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['type', 'status', 'model']) {
    const value = query?.[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  const path = params.toString() ? `/gallery?${params}` : '/gallery';
  const images: GalleryImage[] = await apiGet<GalleryImage[]>(path).catch((error): GalleryImage[] => [{ error: String(error) }]);
  const hasImages = Array.isArray(images) && !images[0]?.error && images.length > 0;

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Asset Library</p>
      <h1>素材库</h1>
      <p className="sub">借鉴图像工作台的 masonry 浏览体验：图片优先，操作隐藏到 hover toolbar；工程字段只作为诊断信息保留。</p>
    </div>

    <form className="card row" style={{ marginTop: 20 }}>
      <div><label>Type</label><select name="type" defaultValue={typeof query?.type === 'string' ? query.type : ''}><option value="">全部</option><option value="image.generate">生成</option><option value="image.edit">编辑</option></select></div>
      <div><label>Status</label><select name="status" defaultValue={typeof query?.status === 'string' ? query.status : ''}><option value="">全部</option>{TERMINAL.map((status) => <option key={status}>{status}</option>)}</select></div>
      <div><label>Model</label><input name="model" defaultValue={typeof query?.model === 'string' ? query.model : ''} placeholder="gpt-image-2" /></div>
      <div style={{ alignSelf: 'end' }}><button className="btn" type="submit">筛选素材</button></div>
    </form>

    {hasImages ? <GalleryBatchActions images={images.flatMap((image) => image.id ? [{ id: image.id, prompt: image.prompt }] : [])} /> : null}

    {!hasImages ? <div className="card" style={{ marginTop: 20 }}>
      <p className="eyebrow">Empty state</p>
      <h2>还没有可展示的资产</h2>
      <p className="muted">先从 Create Studio 生成图片，或在 Edit 上传参考图。错误信息可在下方 Diagnostics 查看。</p>
      <details className="diagnostics" open={Boolean(images[0]?.error)}>
        <summary>Diagnostics</summary>
        <pre className="debug-json">{JSON.stringify(images, null, 2)}</pre>
      </details>
    </div> : null}

    <div className="masonry-grid" style={{ marginTop: 20 }}>{hasImages ? images.map((image, i) => {
      const assetUrl = withBase(image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
      const thumbUrl = withBase(image.thumbnailUrl ?? image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
      const reuseHref = `/?prompt=${encodeURIComponent(image.prompt ?? '')}&model=${encodeURIComponent(image.model ?? 'gpt-image-2')}&size=${encodeURIComponent(image.params?.size ?? '1024x1024')}&quality=${encodeURIComponent(image.params?.quality ?? 'low')}&format=${encodeURIComponent(image.format ?? 'png')}`;
      const referenceHref = `/edit?ref=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
      const canvasHref = `/canvas?image=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
      return <article className="image-card" key={image.id ?? i}>
        <a className="lightbox-link" href={assetUrl ?? '#'} target={assetUrl ? '_blank' : undefined} rel="noreferrer">
          {thumbUrl ? <img className="thumb-img" src={thumbUrl} alt={image.prompt ?? 'generated image'} /> : <div className="thumb">{image.format ?? 'image'}</div>}
        </a>
        <div className="hover-toolbar">
          {image.taskId ? <Link className="pill" href={`/tasks/${image.taskId}`}>任务</Link> : null}
          {assetUrl ? <a className="pill" href={assetUrl} download>下载</a> : null}
          <Link className="pill" href={reuseHref}>复用</Link>
          {image.storageKey ? <Link className="pill" href={referenceHref}>编辑</Link> : null}
          {image.storageKey ? <Link className="pill" href={canvasHref}>Canvas</Link> : null}
        </div>
        <div className="image-card-body">
          <p className="image-card-title">{image.prompt ?? image.error}</p>
          <div className="task-head">
            <span className={statusClass(image.taskStatus)}>{image.taskStatus ?? image.taskType ?? 'IMAGE'}</span>
            <span className="fine-print">{image.createdAt ? new Date(image.createdAt).toLocaleDateString() : ''}</span>
          </div>
          <div className="fine-print">{image.model ?? 'model unknown'} · {image.width && image.height ? `${image.width}×${image.height}` : image.format} · {image.sizeBytes ? `${Math.round(image.sizeBytes / 1024)} KB` : 'size pending'}</div>
          <details className="diagnostics">
            <summary>Diagnostics</summary>
            <pre className="debug-json">{JSON.stringify({ id: image.id, taskId: image.taskId, storageKey: image.storageKey, params: image.params }, null, 2)}</pre>
          </details>
        </div>
      </article>;
    }) : null}</div>
  </section>;
}
