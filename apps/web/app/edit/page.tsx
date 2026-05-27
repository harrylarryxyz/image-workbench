'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
type TaskImage = { id: string; assetUrl: string; format: string; sizeBytes: number; width?: number | null; height?: number | null; createdAt?: string };
type EditTask = { id: string; type?: string; status: string; model?: string; prompt?: string; errorCode?: string | null; errorMessage?: string | null; elapsedMs?: number | null; images?: TaskImage[]; createdAt?: string; updatedAt?: string };
type ProviderSummary = { name: string; enabled: boolean; capabilities?: { edit: boolean | null; maxRefs: number | null; source: string }; editHealth?: { status: string; errorCode: string | null; errorMessage: string | null } };

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  return 'status wait';
}

export default function EditPage() {
  const [uploads, setUploads] = useState<Uploaded[]>([]);
  const [prompt, setPrompt] = useState('Use the reference image and transform it into a polished cinematic illustration, preserving the main subject.');
  const [result, setResult] = useState<unknown>(null);
  const [task, setTask] = useState<EditTask | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`providers failed: ${res.status}`)))
      .then((rows: ProviderSummary[]) => setProvider(rows.find((item) => item.enabled) ?? rows[0] ?? null))
      .catch(() => setProvider(null));
  }, []);

  useEffect(() => {
    if (!activeTaskId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const next = await apiGet<EditTask>(`/tasks/${activeTaskId}`);
        if (cancelled) return;
        setTask(next);
        setResult(next);
        if (!TERMINAL_STATUSES.has(next.status)) timer = setTimeout(poll, next.status === 'RUNNING' ? 1800 : 2500);
        else setActiveTaskId(null);
      } catch (error) {
        if (cancelled) return;
        setResult({ error: error instanceof Error ? error.message : String(error), taskId: activeTaskId });
        timer = setTimeout(poll, 4000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeTaskId]);

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
    setSubmitting(true);
    setTask(null);
    setActiveTaskId(null);
    try {
      const created = await apiPost<EditTask>('/tasks/edit', {
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
      setTask(created);
      setResult(created);
      setActiveTaskId(created.id);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setSubmitting(false);
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
      <button className="btn" disabled={submitting || uploads.length === 0} onClick={submitEdit}>{submitting ? '提交中…' : '创建编辑任务'}</button>
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
      {task ? <div className="result-panel">
        <div className="task-head">
          <span className={statusClass(task.status)}>{task.status}</span>
          <span className="muted">{activeTaskId ? '自动轮询中…' : task.elapsedMs ? `${task.elapsedMs}ms` : '已停止轮询'}</span>
        </div>
        {task.errorMessage ? <pre className="error">{task.errorMessage}</pre> : null}
        {task.images?.length ? <div className="gallery result-gallery">
          {task.images.map((image) => <a className="card" href={`/api${image.assetUrl}`} target="_blank" rel="noreferrer" key={image.id}>
            <img className="thumb-img" src={`/api${image.assetUrl}`} alt={task.prompt ?? 'edited image'} />
            <div className="muted">{image.format} · {Math.round(image.sizeBytes / 1024)} KB{image.width && image.height ? ` · ${image.width}×${image.height}` : ''}</div>
          </a>)}
        </div> : <div className="thumb">{TERMINAL_STATUSES.has(task.status) ? 'No image returned' : 'Waiting for edited image…'}</div>}
      </div> : null}
      <pre>{JSON.stringify(result ?? { hint: 'Upload reference images, then create edit task.' }, null, 2)}</pre>
    </div>
  </section>;
}
