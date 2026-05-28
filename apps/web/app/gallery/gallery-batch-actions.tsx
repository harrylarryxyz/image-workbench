'use client';

import { FormEvent, useState } from 'react';
import { apiPost } from '../../lib/api';

export function GalleryBatchActions({ images }: { images: Array<{ id: string; prompt?: string }> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  async function batchDelete(event: FormEvent) {
    event.preventDefault();
    if (!selected.length) return;
    const result = await apiPost<{ deleted: number }>('/gallery/batch/delete', { ids: selected });
    setMessage(`Deleted ${result.deleted} image(s). Refresh to update gallery.`);
  }
  return <form className="card" onSubmit={batchDelete} style={{ marginTop: 20 }}>
    <p className="eyebrow">Batch actions</p>
    <p className="muted">选择图库项目后可批量删除数据库记录（本地原始文件保留，可由运维清理脚本处理）。</p>
    <div className="actions">
      <button className="pill" type="button" onClick={() => setSelected(images.map((image) => image.id))}>全选</button>
      <button className="pill" type="button" onClick={() => setSelected([])}>清空</button>
      <button className="pill" type="submit" disabled={!selected.length}>删除选中 ({selected.length})</button>
    </div>
    {message ? <pre>{message}</pre> : null}
    <div className="gallery" style={{ marginTop: 12 }}>
      {images.map((image) => <label className="pill" key={image.id} style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={selected.includes(image.id)} onChange={() => toggle(image.id)} /> {image.prompt?.slice(0, 36) || image.id}
      </label>)}
    </div>
  </form>;
}
