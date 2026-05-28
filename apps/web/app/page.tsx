'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../lib/task-events';

type TaskImage = { id?: string; storageKey: string; assetUrl?: string; format: string; sizeBytes: number; width?: number | null; height?: number | null };
type TaskResult = {
  id?: string;
  status?: string;
  error?: string | null;
  errorMessage?: string | null;
  model?: string;
  prompt?: string;
  elapsedMs?: number | null;
  routeJson?: unknown;
  images?: TaskImage[];
  [key: string]: unknown;
};

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  if (normalized === 'queued' || normalized === 'pending') return 'status wait';
  return 'status neutral';
}

function imageUrl(image?: TaskImage | null) {
  if (!image) return null;
  if (image.assetUrl?.startsWith('/assets/')) return `/api${image.assetUrl}`;
  if (image.assetUrl) return image.assetUrl;
  return `/api/assets/file?key=${encodeURIComponent(image.storageKey)}`;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('A detailed square illustration of a small orange robot fixing a glowing blue sign outside a cozy rainy-night cyberpunk cafe.');
  const [model, setModel] = useState('gpt-image-2');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('low');
  const [format, setFormat] = useState('png');
  const [background, setBackground] = useState('auto');
  const [apiMode, setApiMode] = useState('auto');
  const [result, setResult] = useState<TaskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPrompt = params.get('prompt');
    if (nextPrompt) setPrompt(nextPrompt);
    const nextModel = params.get('model');
    if (nextModel) setModel(nextModel);
    const nextSize = params.get('size');
    if (nextSize) setSize(nextSize);
    const nextQuality = params.get('quality');
    if (nextQuality) setQuality(nextQuality);
    const nextFormat = params.get('format');
    if (nextFormat) setFormat(nextFormat);
    const nextApiMode = params.get('apiMode');
    if (nextApiMode) setApiMode(nextApiMode);
  }, []);

  async function watchTask(id: string) {
    let fallbackStarted = false;
    setStreaming(true);
    const fallback = async (error?: unknown) => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      if (error) console.warn('Task SSE unavailable; falling back to polling', error);
      await pollTaskUntilTerminal<TaskResult>(id, (task) => {
        setResult(task);
        if (TERMINAL.has(task.status ?? '')) setStreaming(false);
      });
    };
    const unsubscribe = subscribeTaskEvents<TaskResult>(id, (task) => {
      setResult(task);
      if (TERMINAL.has(task.status ?? '')) {
        setStreaming(false);
        unsubscribe();
      }
    }, fallback);
  }

  async function submit() {
    setLoading(true);
    try {
      const created = await apiPost<TaskResult>('/tasks/generate', { prompt, model, size, quality, format, background, apiMode, count: 1, timeoutSec: 600 });
      setResult(created);
      if (created.id) await watchTask(created.id);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  const firstImage = result?.images?.[0] ?? null;
  const previewUrl = imageUrl(firstImage);
  const primaryStatus = result?.status ?? (loading ? 'QUEUED' : 'READY');
  const metrics = useMemo(() => [
    ['Model', model],
    ['Size', size],
    ['Quality', quality],
    ['Format', format.toUpperCase()],
  ], [model, size, quality, format]);

  return <>
    <section className="studio-hero">
      <p className="eyebrow">Create Studio</p>
      <h1>创作工作台</h1>
      <p className="sub">把文生图、结果预览、复用动作和任务诊断收进同一个创作界面。主界面只展示决策信息，工程响应放入 Diagnostics。</p>
    </section>

    <div className="studio-shell">
      <section className="studio-panel control-stack">
        <div>
          <p className="eyebrow">Prompt</p>
          <h2>描述你要生成的画面</h2>
          <p className="muted">从 Prompt Library 或 Gallery 复用时会自动带入这里。</p>
        </div>
        <div>
          <label>Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="form-grid">
          <div><label>Model</label><input value={model} onChange={(e) => setModel(e.target.value)} /></div>
          <div><label>Size</label><select value={size} onChange={(e) => setSize(e.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option><option>auto</option></select></div>
          <div><label>Quality</label><select value={quality} onChange={(e) => setQuality(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>auto</option></select></div>
          <div><label>Format</label><select value={format} onChange={(e) => setFormat(e.target.value)}><option>png</option><option>jpeg</option><option>webp</option></select></div>
          <div><label>Background</label><select value={background} onChange={(e) => setBackground(e.target.value)}><option>auto</option><option>opaque</option><option>transparent</option></select></div>
          <div><label>API Mode</label><select value={apiMode} onChange={(e) => setApiMode(e.target.value)}><option>auto</option><option>images</option><option>responses</option></select></div>
        </div>
        <button className="btn" disabled={loading} onClick={submit}>{loading ? '生成中，等待实时状态…' : '提交生成任务'}</button>
        <div className="actions">
          <Link className="pill" href="/edit">上传参考图编辑</Link>
          <Link className="pill" href="/prompts">打开 Prompt Library</Link>
          <Link className="pill" href="/gallery">浏览 Asset Library</Link>
        </div>
      </section>

      <section className="preview-stage" aria-label="PreviewStage">
        <div className="task-head">
          <div>
            <p className="eyebrow">PreviewStage</p>
            <h2>{result?.id ? `Task ${result.id.slice(0, 8)}` : '等待第一张作品'}</h2>
          </div>
          <span className={statusClass(primaryStatus)}>{primaryStatus}</span>
        </div>
        <div className="preview-frame">
          {previewUrl ? <img src={previewUrl} alt={prompt || 'generated image'} /> : <div className="preview-empty"><b>ImageActionToolbar ready</b><span>提交任务后，结果会在这里实时出现；下载、继续编辑、发送到画布都会显示在下方。</span></div>}
        </div>
        <div>
          <div className="metric-grid">
            {metrics.map(([label, value]) => <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <div className="image-action-toolbar">
            {previewUrl ? <a className="pill" href={previewUrl} target="_blank" rel="noreferrer" download>下载原图</a> : null}
            {firstImage?.storageKey ? <Link className="pill" href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>作为参考图继续编辑</Link> : null}
            {firstImage?.storageKey ? <Link className="pill" href={`/canvas?image=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送到 Canvas</Link> : null}
            {result?.id ? <Link className="pill" href={`/tasks/${result.id}`}>任务详情</Link> : null}
            <span className="pill">{streaming ? 'SSE 实时更新' : 'SSE / fallback ready'}</span>
          </div>
          {result?.error || result?.errorMessage ? <div className="notice error">{result.errorMessage ?? result.error}</div> : null}
          <details className="diagnostics">
            <summary>Diagnostics · 原始任务响应</summary>
            <pre className="debug-json">{JSON.stringify(result ?? { hint: 'Submit a task to see task id.' }, null, 2)}</pre>
          </details>
        </div>
      </section>
    </div>
  </>;
}
