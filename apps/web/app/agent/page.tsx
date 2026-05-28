'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type Suggestion = { id: string; kind: string; title: string; content: string; sourceType?: string; sourceId?: string | null; status?: string; payloadJson?: any; createdAt?: string };

export default function AgentPage() {
  const [prompt, setPrompt] = useState('A cinematic product shot of an AI image workstation with floating node graph UI.');
  const [imageId, setImageId] = useState('');
  const [canvasId, setCanvasId] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const rows = await apiGet<Suggestion[]>('/agent/suggestions').catch(() => []);
    setSuggestions(rows);
  }
  useEffect(() => { load(); }, []);

  async function promptVariants() {
    const reply = await apiPost<{ suggestions: Suggestion[] }>('/agent/prompt-variants', { prompt });
    setSuggestions((prev) => [...reply.suggestions, ...prev]);
  }

  async function suggest() {
    const reply = await apiPost<{ suggestions: Suggestion[] }>('/agent/suggest', { prompt, imageId: imageId || undefined, canvasId: canvasId || undefined });
    setSuggestions((prev) => [...reply.suggestions, ...prev]);
  }

  async function apply(id: string, action: string) {
    const reply = await apiPost<any>(`/agent/suggestions/${id}/apply`, { action });
    setMessage(action === 'create-task' && reply.task?.id ? `Created task ${reply.task.id}` : 'Suggestion applied');
    await load();
  }

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Creative Agent</p>
      <h1>创作 Agent</h1>
      <p className="sub">Agent 不做聊天壳，而是给当前图片、Prompt、Canvas 提出可执行建议：生成 Prompt 变体、下一步节点、继续改图方向，并可直接转任务或节点 payload。</p>
    </div>

    <div className="grid two" style={{ marginTop: 20 }}>
      <section className="card control-stack">
        <p className="eyebrow">Brief</p>
        <h2>给 Agent 当前创作上下文</h2>
        <label>Prompt / current intent</label>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        <div className="form-grid">
          <label>Image ID / source asset<input value={imageId} onChange={(event) => setImageId(event.target.value)} placeholder="可选：图库 image id" /></label>
          <label>Canvas ID<input value={canvasId} onChange={(event) => setCanvasId(event.target.value)} placeholder="可选：当前 canvas project id" /></label>
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={suggest}>生成创作建议</button>
          <button className="pill" type="button" onClick={promptVariants}>生成 Prompt 变体</button>
          <Link className="pill" href={`/canvas${canvasId ? `?project=${canvasId}` : ''}`}>打开 Canvas</Link>
          <Link className="pill" href="/gallery">打开 Asset Library</Link>
        </div>
        {message ? <div className="notice success">{message}</div> : null}
      </section>

      <section className="card">
        <p className="eyebrow">Suggestions</p>
        <h2>可执行建议</h2>
        <div className="task-list">
          {suggestions.map((item) => <article className="task-card" key={item.id}>
            <div className="task-head"><span className="status neutral">{item.kind}</span><span className="fine-print">{item.status ?? 'draft'}</span></div>
            <h3>{item.title}</h3>
            <p className="muted">{item.content}</p>
            <div className="actions">
              <button className="pill" type="button" onClick={() => setPrompt(item.payloadJson?.prompt ?? item.content)}>载入 Prompt</button>
              <button className="pill" type="button" onClick={() => apply(item.id, 'create-task')}>转为生成任务</button>
              <button className="pill" type="button" onClick={() => apply(item.id, 'ack')}>标记已采纳</button>
            </div>
            <details className="diagnostics"><summary>Payload</summary><pre className="debug-json">{JSON.stringify(item.payloadJson ?? {}, null, 2)}</pre></details>
          </article>)}
        </div>
      </section>
    </div>
  </section>;
}
