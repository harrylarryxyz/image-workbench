import Link from 'next/link';
import { apiGet } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';

export default async function GalleryPage() {
  const images = await apiGet<any[]>('/gallery').catch((error) => [{ error: String(error) }]);
  return <section>
    <div className="hero"><p className="eyebrow">Gallery</p><h1>历史图库</h1><p className="sub">查看已生成图片；支持打开任务详情、下载原图和复用 prompt。</p></div>
    <div className="gallery" style={{marginTop: 20}}>{images.map((image, i) => {
      const assetUrl = image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null);
      const fullAssetUrl = assetUrl ? `${API_BASE}${assetUrl}` : null;
      const reuseHref = `/?prompt=${encodeURIComponent(image.prompt ?? '')}`;
      return <div className="card" key={image.id ?? i}>
        {fullAssetUrl ? <img className="thumb-img" src={fullAssetUrl} alt={image.prompt ?? 'generated image'} /> : <div className="thumb">{image.format ?? 'image'}</div>}
        <p>{image.prompt ?? image.error}</p>
        <div className="actions">
          {image.taskId ? <Link className="pill" href={`/tasks/${image.taskId}`}>任务详情</Link> : null}
          {fullAssetUrl ? <a className="pill" href={fullAssetUrl} download>下载</a> : null}
          <Link className="pill" href={reuseHref}>复用 Prompt</Link>
        </div>
        <div className="muted">{image.format} · {image.sizeBytes ? `${Math.round(image.sizeBytes / 1024)} KB` : ''}</div>
      </div>;
    })}</div>
  </section>;
}
