'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  return <Card className="mt-3">
    <CardContent className="space-y-3">
      <form onSubmit={render} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <Input name="subject" placeholder="subject variable" />
        <Input name="product" placeholder="product variable" />
        <Button variant="secondary" type="submit">渲染变量</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" type="button" onClick={saveVariant}>保存变体</Button>
        <Button variant="outline" type="button" onClick={loadVersions}>版本历史</Button>
      </div>
      {message ? <pre className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{message}</pre> : null}
      {versions.length ? <pre className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{JSON.stringify(versions.slice(0, 5), null, 2)}</pre> : null}
    </CardContent>
  </Card>;
}
