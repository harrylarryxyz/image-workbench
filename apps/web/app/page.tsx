'use client';
import { useState } from 'react';
import { apiPost } from '../lib/api';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('A detailed square illustration of a small orange robot fixing a glowing blue sign outside a cozy rainy-night cyberpunk cafe.');
  const [model, setModel] = useState('gpt-image-2');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('low');
  const [format, setFormat] = useState('png');
  const [background, setBackground] = useState('auto');
  const [apiMode, setApiMode] = useState('auto');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const created = await apiPost('/tasks/generate', { prompt, model, size, quality, format, background, apiMode, count: 1, timeoutSec: 600 });
      setResult(created);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  return <div className="grid two">
    <section className="card">
      <p className="eyebrow">Generate</p>
      <h1>创建图像任务</h1>
      <p className="sub">任务会进入 BullMQ 队列，后端 worker 调用 provider；后续 Gallery/Diagnostics 会读取任务状态和 route metadata。</p>
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
      <button className="btn" disabled={loading} onClick={submit}>{loading ? '提交中…' : '提交生成任务'}</button>
    </section>
    <section className="card">
      <p className="eyebrow">Result</p>
      <h1>任务响应</h1>
      <pre>{JSON.stringify(result ?? { hint: 'Submit a task to see task id.' }, null, 2)}</pre>
    </section>
  </div>;
}
