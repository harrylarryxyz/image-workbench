'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiFormPost, apiGet, apiPost } from '../../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../../lib/task-events';
import { MaskEditor } from './mask-editor';

type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
type TaskImage = { id: string; assetUrl: string; storageKey?: string; format: string; sizeBytes: number; width?: number | null; height?: number | null; createdAt?: string };
type EditTask = { id: string; type?: string; status: string; model?: string; prompt?: string; errorCode?: string | null; errorMessage?: string | null; elapsedMs?: number | null; images?: TaskImage[]; createdAt?: string; updatedAt?: string };
type ProviderSummary = { name: string; enabled: boolean; capabilities?: { edit: boolean | null; maxRefs: number | null; source: string }; editHealth?: { status: string; errorCode: string | null; errorMessage: string | null } };

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

function assetSrc(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/assets/')) return `/api${url}`;
  return url;
}

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  if (normalized === 'queued' || normalized === 'pending') return 'status wait';
  return 'status neutral';
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
  const [mask, setMask] = useState<Uploaded | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setUploads([{ storageKey: ref, assetUrl: `/assets/file?key=${encodeURIComponent(ref)}`, originalName: ref.split('/').pop(), format: ref.split('.').pop() ?? 'image', sizeBytes: 0 }]);
    const nextPrompt = params.get('prompt');
    if (nextPrompt) setPrompt(nextPrompt);
  }, []);

  useEffect(() => {
    apiGet<ProviderSummary[]>('/providers')
      .then((rows) => setProvider(rows.find((item) => item.enabled) ?? rows[0] ?? null))
      .catch(() => setProvider(null));
  }, []);

  useEffect(() => {
    if (!activeTaskId) return;
    let cancelled = false;
    const unsubscribe = subscribeTaskEvents<EditTask>(activeTaskId, (next) => {
      if (cancelled) return;
      setTask(next);
      setResult(next);
      if (TERMINAL_STATUSES.has(next.status)) {
        setActiveTaskId(null);
        unsubscribe();
      }
    }, async () => {
      await pollTaskUntilTerminal<EditTask>(activeTaskId, (next) => {
        if (cancelled) return;
        setTask(next);
        setResult(next);
        if (TERMINAL_STATUSES.has(next.status)) setActiveTaskId(null);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeTaskId]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const uploaded = await apiFormPost<Uploaded>('/assets/upload', form);
      setUploads((prev) => [...prev, uploaded].slice(0, 4));
      setResult({ uploaded: uploaded.storageKey });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  async function uploadMask(file: File) {
    setBusy(true);
    const form = new FormData();
    form.set('file', file);
    try {
      const uploaded = await apiFormPost<Uploaded>('/assets/upload', form);
      setMask(uploaded);
      setResult({ mask: uploaded.storageKey });
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
        maskKey: mask?.storageKey,
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

  const firstOutput = task?.images?.[0];
  const outputUrl = assetSrc(firstOutput?.assetUrl);

  return <>
    <section className="studio-hero">
      <p className="eyebrow">Create Studio · Edit</p>
      <h1>参考图编辑工作台</h1>
      <p className="sub">上传参考图、绘制 Mask、提交编辑任务，并在同一屏完成预览、下载、继续创作和诊断。</p>
    </section>

    <div className="studio-shell">
      <section className="studio-panel control-stack">
        <div className="notice">
          <b>Provider readiness</b>
          <p className="muted" style={{ margin: '6px 0 0' }}>{provider ? `${provider.name} · edit ${provider.capabilities?.edit === true ? `supported · max refs ${provider.capabilities.maxRefs ?? '?'}` : provider.capabilities?.edit === false ? 'unsupported' : 'unknown'} · health ${provider.editHealth?.status ?? 'untested'}` : 'Provider capability loading…'}</p>
        </div>
        <form onSubmit={upload}>
          <label>Reference Image</label>
          <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
          <button className="btn" disabled={busy} type="submit">上传参考图</button>
        </form>
        <div>
          <label>Edit Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div>
          <h3>Mask 编辑器</h3>
          <p className="muted">在第一张参考图上绘制白色区域，支持 mask 的 provider 会只编辑选中区域。</p>
          <MaskEditor imageUrl={assetSrc(uploads[0]?.assetUrl)} onMaskReady={uploadMask} />
          {mask ? <div className="notice success">Mask ready: {mask.originalName ?? mask.storageKey.split('/').pop()}</div> : <div className="fine-print">Mask optional；不需要局部修改时可留空。</div>}
        </div>
        <button className="btn" disabled={submitting || uploads.length === 0} onClick={submitEdit}>{submitting ? '提交中…' : '创建编辑任务'}</button>
      </section>

      <section className="preview-stage">
        <div className="task-head">
          <div><p className="eyebrow">PreviewStage</p><h2>{task?.id ?? `${uploads.length} / 4 references`}</h2></div>
          <span className={statusClass(task?.status)}>{task?.status ?? 'READY'}</span>
        </div>
        <div className="preview-frame">
          {outputUrl ? <img src={outputUrl} alt={task?.prompt ?? 'edited image'} /> : uploads[0] ? <img src={assetSrc(uploads[0].assetUrl)} alt={uploads[0].originalName ?? 'reference'} /> : <div className="preview-empty"><b>上传参考图开始编辑</b><span>输出图会替换这里的参考预览；图片工具条会提供下载、继续编辑和发送到 Canvas。</span></div>}
        </div>
        <div className="image-action-toolbar">
          {outputUrl ? <a className="pill" href={outputUrl} target="_blank" rel="noreferrer" download>下载输出</a> : null}
          {firstOutput?.storageKey ? <Link className="pill" href={`/edit?ref=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑输出</Link> : null}
          {firstOutput?.storageKey ? <Link className="pill" href={`/canvas?image=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送到 Canvas</Link> : null}
          {task?.id ? <Link className="pill" href={`/tasks/${task.id}`}>任务详情</Link> : null}
          <span className="pill">{activeTaskId ? 'SSE 实时更新中…' : 'Ready'}</span>
        </div>
        <div className="reference-strip">
          {uploads.map((item) => <div className="reference-card" key={item.storageKey}>
            <img src={assetSrc(item.assetUrl)} alt={item.originalName ?? 'reference'} />
            <p className="fine-print">{item.originalName ?? item.storageKey}</p>
          </div>)}
        </div>
        {task?.errorMessage ? <div className="notice error">{task.errorMessage}</div> : null}
        <details className="diagnostics">
          <summary>Diagnostics · 上传与编辑任务响应</summary>
          <pre className="debug-json">{JSON.stringify(result ?? { hint: 'Upload reference images, then create edit task.' }, null, 2)}</pre>
        </details>
      </section>
    </div>
  </>;
}
