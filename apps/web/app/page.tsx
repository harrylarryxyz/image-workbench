'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

type TaskResult = {
  id?: string;
  status?: string;
  error?: string | null;
  errorMessage?: string | null;
  routeJson?: unknown;
  images?: Array<{ storageKey: string; format: string; sizeBytes: number }>;
  [key: string]: unknown;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  async function pollTask(id: string) {
    for (let i = 0; i < 90; i += 1) {
      await sleep(i < 6 ? 2000 : 5000);
      const task = await apiGet<TaskResult>(`/tasks/${id}`);
      setResult(task);
      if (task.status === 'SUCCEEDED' || task.status === 'FAILED' || task.status === 'CANCELLED') return;
    }
  }

  async function submit() {
    setLoading(true);
    try {
      const created = await apiPost<TaskResult>('/tasks/generate', { prompt, model, size, quality, format, background, apiMode, count: 1, timeoutSec: 600 });
      setResult(created);
      if (created.id) await pollTask(created.id);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  const firstImage = result?.images?.[0];
  const imageUrl = firstImage ? `/api/assets/file?key=${encodeURIComponent(firstImage.storageKey)}` : null;

  return <div className="grid two">
    <section className="card">
      <p className="eyebrow">Generate</p>
      <h1>创建图像任务</h1>
      <p className="sub">提交后会自动轮询任务状态；生成完成后会在右侧显示图片，也可以到 Gallery 查看历史。</p>
      <label>Prompt</label>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="row">
        <div><label>Model</label><input value={model} onChange={(e) => setModel(e.target.value)} /></div>
        <div><label>Size</label><select value={size} onChange={(e) => setSize(e.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option><option>auto</option></select></div>
        <div><label>Quality</label><select value={quality} onChange={(e) => setQuality(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>auto</option></select></div>
        <div><label>Format</label><select value={format} onChange={(e) => setFormat(e.target.value)}><option>png</option><option>jpeg</option><option>webp</option></select></div>
        <div><label>Background</label><select value={background} onChange={(e) => setBackground(e.target.value)}><option>auto</option><option>opaque</option><option>transparent</option></select></div>
        <div><label>API Mode</label><select value={apiMode} onChange={(e) => setApiMode(e.target.value)}><option>auto</option><option>images</option><option>responses</option></select></div>
      </div>
      <button className="btn" disabled={loading} onClick={submit}>{loading ? '生成中，正在轮询…' : '提交生成任务'}</button>
    </section>
    <section className="card">
      <p className="eyebrow">Result</p>
      <h1>{result?.status ? `任务状态：${result.status}` : '任务响应'}</h1>
      {imageUrl ? <img className="thumb-img" src={imageUrl} alt="generated image" /> : null}
      {result?.errorMessage ? <pre>{result.errorMessage}</pre> : null}
      <pre>{JSON.stringify(result ?? { hint: 'Submit a task to see task id.' }, null, 2)}</pre>
    </section>
  </div>;
}
