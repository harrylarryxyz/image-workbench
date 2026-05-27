import Link from 'next/link';
import { apiGet } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const TERMINAL = ['SUCCEEDED', 'FAILED', 'CANCELLED'];

function withBase(url?: string | null) {
  if (!url) return null;
  return `${API_BASE}${url}`;
}

export default async function GalleryPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['type', 'status', 'model']) {
    const value = query?.[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  const path = params.toString() ? `/gallery?${params}` : '/gallery';
  const images = await apiGet<any[]>(path).catch((error) => [{ error: String(error) }]);
  return <section>
    <div className="hero"><p className="eyebrow">Gallery 2.0</p><h1>历史图库</h1><p className="sub">按类型、状态、模型筛选；支持打开任务详情、下载原图、复用 prompt 和作为参考图继续编辑。</p></div>
    <form className="card row" style={{marginTop: 20}}>
      <div><label>Type</label><select name="type" defaultValue={typeof query?.type === 'string' ? query.type : ''}><option value="">全部</option><option value="image.generate">生成</option><option value="image.edit">编辑</option></select></div>
      <div><label>Status</label><select name="status" defaultValue={typeof query?.status === 'string' ? query.status : ''}><option value="">全部</option>{TERMINAL.map((status) => <option key={status}>{status}</option>)}</select></div>
      <div><label>Model</label><input name="model" defaultValue={typeof query?.model === 'string' ? query.model : ''} placeholder="gpt-image-2" /></div>
      <div style={{alignSelf: 'end'}}><button className="pill" type="submit">筛选</button></div>
    </form>
    <div className="gallery" style={{marginTop: 20}}>{images.map((image, i) => {
      const assetUrl = withBase(image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
      const thumbUrl = withBase(image.thumbnailUrl ?? image.assetUrl);
      const reuseHref = `/?prompt=${encodeURIComponent(image.prompt ?? '')}&model=${encodeURIComponent(image.model ?? 'gpt-image-2')}&size=${encodeURIComponent(image.params?.size ?? '1024x1024')}&quality=${encodeURIComponent(image.params?.quality ?? 'low')}&format=${encodeURIComponent(image.format ?? 'png')}`;
      const referenceHref = `/edit?ref=${encodeURIComponent(image.storageKey ?? '')}&prompt=${encodeURIComponent(image.prompt ?? '')}`;
      return <div className="card" key={image.id ?? i}>
        {thumbUrl ? <img className="thumb-img" src={thumbUrl} alt={image.prompt ?? 'generated image'} /> : <div className="thumb">{image.format ?? 'image'}</div>}
        <p>{image.prompt ?? image.error}</p>
        <div className="actions">
          {image.taskId ? <Link className="pill" href={`/tasks/${image.taskId}`}>任务详情</Link> : null}
          {assetUrl ? <a className="pill" href={assetUrl} download>下载原图</a> : null}
          <Link className="pill" href={reuseHref}>复用 Prompt</Link>
          {image.storageKey ? <Link className="pill" href={referenceHref}>作为参考图</Link> : null}
        </div>
        <div className="muted">{image.taskType ?? 'image'} · {image.taskStatus ?? ''} · {image.model ?? ''}</div>
        <div className="muted">{image.width && image.height ? `${image.width}×${image.height}` : image.format} · {image.sizeBytes ? `${Math.round(image.sizeBytes / 1024)} KB` : ''} · {image.createdAt ? new Date(image.createdAt).toLocaleString() : ''}</div>
      </div>;
    })}</div>
  </section>;
}
