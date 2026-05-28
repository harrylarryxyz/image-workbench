'use client';

import { FormEvent, useState } from 'react';
import { apiPost } from '../../lib/api';

export function GalleryBatchActions({ images }: { images: Array<{ id: string; prompt?: string }> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState('Campaign picks');
  const [message, setMessage] = useState('');
  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  async function batchDelete(event: FormEvent) {
    event.preventDefault();
    if (!selected.length) return;
    if (!window.confirm('I understand this changes production data')) return;
    const result = await apiPost<{ deleted: number }>('/gallery/batch/delete', { ids: selected });
    setMessage(`Deleted ${result.deleted} image(s). Refresh to update gallery.`);
  }
  async function createCollection() {
    if (!selected.length) return;
    const collection = await apiPost<{ id: string; name: string }>('/gallery/collections', { name: collectionName });
    const reply = await apiPost<{ added: number }>(`/gallery/collections/${collection.id}/items`, { ids: selected });
    setMessage(`Collection “${collection.name}” created with ${reply.added} item(s).`);
  }
  const ids = selected.join(',');
  return <form className="card" onSubmit={batchDelete} style={{ marginTop: 20 }}>
    <p className="eyebrow">Batch actions</p>
    <p className="muted">选择图库项目后可建 Collection、下载 zip/manifest，删除前必须通过浏览器危险操作确认。</p>
    <div className="actions">
      <button className="pill" type="button" onClick={() => setSelected(images.map((image) => image.id))}>全选</button>
      <button className="pill" type="button" onClick={() => setSelected([])}>清空</button>
      <button className="pill" type="submit" disabled={!selected.length}>删除选中 ({selected.length})</button>
      <a className="pill" href={ids ? `/api/gallery/batch/download.zip?ids=${encodeURIComponent(ids)}` : '#'}>批量下载 ZIP</a>
      <a className="pill" href={ids ? `/api/gallery/batch/manifest?ids=${encodeURIComponent(ids)}` : '#'}>导出 Manifest</a>
    </div>
    <div className="form-grid">
      <label>Collection name<input value={collectionName} onChange={(event) => setCollectionName(event.target.value)} /></label>
      <div style={{ alignSelf: 'end' }}><button className="btn" type="button" onClick={createCollection} disabled={!selected.length}>加入新 Collection</button></div>
    </div>
    {message ? <pre className="debug-json">{message}</pre> : null}
    <div className="gallery" style={{ marginTop: 12 }}>
      {images.map((image) => <label className="pill" key={image.id} style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={selected.includes(image.id)} onChange={() => toggle(image.id)} /> {image.prompt?.slice(0, 36) || image.id}
      </label>)}
    </div>
  </form>;
}
