'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiPost } from '../../lib/api';

type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
type ProviderSummary = { name: string; enabled: boolean; capabilities?: { edit: boolean | null; maxRefs: number | null; source: string }; editHealth?: { status: string; errorCode: string | null; errorMessage: string | null } };

export default function EditPage() {
  const [uploads, setUploads] = useState<Uploaded[]>([]);
  const [prompt, setPrompt] = useState('Use the reference image and transform it into a polished cinematic illustration, preserving the main subject.');
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`providers failed: ${res.status}`)))
      .then((rows: ProviderSummary[]) => setProvider(rows.find((item) => item.enabled) ?? rows[0] ?? null))
      .catch(() => setProvider(null));
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/assets/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`);
      const uploaded = await res.json();
      setUploads((prev) => [...prev, uploaded].slice(0, 4));
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    setBusy(true);
    try {
      const created = await apiPost('/tasks/edit', {
        prompt,
        model: 'gpt-image-2',
        size: '1024x1024',
        quality: 'low',
        format: 'png',
        background: 'auto',
        apiMode: 'images',
        count: 1,
        timeoutSec: 600,
        refKeys: uploads.map((x) => x.storageKey),
      });
      setResult(created);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  return <section className="grid two">
    <div className="card">
      <p className="eyebrow">Edit</p>
      <h1>参考图编辑</h1>
      <p className="sub">上传 1-4 张参考图，创建 image.edit 任务。当前第一版走 Images API `/images/edits`。</p>
      {provider ? <div className="metric" style={{ margin: '12px 0' }}>
        <span>Current provider</span>
        <b>{provider.name}</b>
        <div className="muted">Edit capability: {provider.capabilities?.edit === true ? `supported · max refs ${provider.capabilities.maxRefs ?? '?'}` : provider.capabilities?.edit === false ? 'unsupported' : 'unknown'} · health: {provider.editHealth?.status ?? 'untested'}{provider.editHealth?.errorCode ? ` · ${provider.editHealth.errorCode}` : ''}</div>
      </div> : null}
      <form onSubmit={upload}>
        <label>Reference Image</label>
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
        <button className="btn" disabled={busy} type="submit">上传参考图</button>
      </form>
      <label>Edit Prompt</label>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button className="btn" disabled={busy || uploads.length === 0} onClick={submitEdit}>{busy ? '处理中…' : '创建编辑任务'}</button>
    </div>
    <div className="card">
      <p className="eyebrow">References</p>
      <h1>{uploads.length} / 4</h1>
      <div className="gallery">
        {uploads.map((item) => <div className="card" key={item.storageKey}>
          <img className="thumb-img" src={`/api${item.assetUrl}`} alt={item.originalName ?? 'reference'} />
          <p>{item.originalName ?? item.storageKey}</p>
          <div className="muted">{item.format} · {Math.round(item.sizeBytes / 1024)} KB</div>
        </div>)}
      </div>
      <h3>Result</h3>
      <pre>{JSON.stringify(result ?? { hint: 'Upload reference images, then create edit task.' }, null, 2)}</pre>
    </div>
  </section>;
}
