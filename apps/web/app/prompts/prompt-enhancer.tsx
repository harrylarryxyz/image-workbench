'use client';

import { FormEvent, useState } from 'react';

type PromptEnhancerProps = { initial?: string };

export function PromptEnhancer({ initial = '' }: PromptEnhancerProps) {
  const [subject, setSubject] = useState(initial);
  const [style, setStyle] = useState('cinematic');
  const [enhanced, setEnhanced] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const res = await fetch('/api/prompts/enhance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, style }) });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const json = await res.json();
    setEnhanced(json.prompt);
  }

  return <form className="card" onSubmit={submit}>
    <p className="eyebrow">Local Enhancer</p>
    <label>Subject / Rough prompt</label>
    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="orange robot repairing a neon sign" />
    <label>Style</label>
    <select value={style} onChange={(e) => setStyle(e.target.value)}>
      <option>cinematic</option>
      <option>warm hand-painted illustration</option>
      <option>premium product photography</option>
      <option>minimal vector icon</option>
    </select>
    <button className="btn" type="submit">本地增强</button>
    {error ? <pre className="error">{error}</pre> : null}
    {enhanced ? <>
      <label>Enhanced Prompt</label>
      <textarea readOnly value={enhanced} />
      <div className="actions"><a className="pill" href={`/?prompt=${encodeURIComponent(enhanced)}`}>套用到 Generate</a></div>
    </> : null}
  </form>;
}
