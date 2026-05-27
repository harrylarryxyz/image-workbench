import { apiGet } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';

export default async function GalleryPage() {
  const images = await apiGet<any[]>('/gallery').catch((error) => [{ error: String(error) }]);
  return <section>
    <div className="hero"><p className="eyebrow">Gallery</p><h1>历史图库</h1><p className="sub">显示生成图片、prompt 和基础元数据；后续会加入任务详情、复用参数和继续编辑。</p></div>
    <div className="gallery" style={{marginTop: 20}}>{images.map((image, i) => <div className="card" key={image.id ?? i}>
      {image.storageKey ? <img className="thumb-img" src={`${API_BASE}/assets/file?key=${encodeURIComponent(image.storageKey)}`} alt={image.prompt ?? 'generated image'} /> : <div className="thumb">{image.format ?? 'image'}</div>}
      <p>{image.prompt ?? image.error}</p>
      <pre>{JSON.stringify(image, null, 2)}</pre>
    </div>)}</div>
  </section>;
}
