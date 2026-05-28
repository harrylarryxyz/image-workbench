'use client';

import { FormEvent, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

export function PromptActions({ prompt }: { prompt: { id: string; title: string; content: string; tags?: string[] } }) {
  const [message, setMessage] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  async function render(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variables = Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
    const result = await apiPost<{ prompt: string }>(`/prompts/${prompt.id}/render`, { variables });
    setMessage(result.prompt);
  }
  async function saveVariant() {
    const next = await apiPatch<any>(`/prompts/${prompt.id}`, { title: `${prompt.title} · variant`, content: `${prompt.content}
-- refined variant`, tags: prompt.tags ?? [] });
    setMessage(`Saved variant ${next.id}; previous content versioned.`);
  }
  async function loadVersions() {
    const rows = await apiGet<any[]>(`/prompts/${prompt.id}/versions`);
    setVersions(rows);
  }
  return <div className="actions" style={{ marginTop: 10 }}>
    <form onSubmit={render} className="row">
      <input name="subject" placeholder="subject variable" />
      <input name="product" placeholder="product variable" />
      <button className="pill" type="submit">渲染变量</button>
    </form>
    <button className="pill" type="button" onClick={saveVariant}>保存变体</button>
    <button className="pill" type="button" onClick={loadVersions}>版本历史</button>
    {message ? <pre>{message}</pre> : null}
    {versions.length ? <pre>{JSON.stringify(versions.slice(0, 5), null, 2)}</pre> : null}
  </div>;
}
