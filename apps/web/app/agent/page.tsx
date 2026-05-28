'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

    <div className="grid gap-4 md:grid-cols-2 mt-5">
      <Card>
        <CardHeader>
          <p className="eyebrow">Brief</p>
          <CardTitle>给 Agent 当前创作上下文</CardTitle>
          <CardDescription>输入当前创作意图，可附加图片或 Canvas 项目 ID，让建议可直接转成任务。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="agent-prompt">Prompt / current intent</Label>
            <Textarea id="agent-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent-image">Image ID / source asset</Label>
              <Input id="agent-image" value={imageId} onChange={(event) => setImageId(event.target.value)} placeholder="可选：图库 image id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-canvas">Canvas ID</Label>
              <Input id="agent-canvas" value={canvasId} onChange={(event) => setCanvasId(event.target.value)} placeholder="可选：当前 canvas project id" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={suggest}>生成创作建议</Button>
            <Button variant="outline" type="button" onClick={promptVariants}>生成 Prompt 变体</Button>
            <Button asChild variant="outline"><Link href={`/canvas${canvasId ? `?project=${canvasId}` : ''}`}>打开 Canvas</Link></Button>
            <Button asChild variant="outline"><Link href="/gallery">打开 Asset Library</Link></Button>
          </div>
          {message ? <Card className="border-emerald-500/30 bg-emerald-500/10"><CardContent className="pt-6 text-sm text-emerald-200">{message}</CardContent></Card> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="eyebrow">Suggestions</p>
          <CardTitle>可执行建议</CardTitle>
          <CardDescription>每条建议都能载入 Prompt、转为任务，或作为已采纳记录保留。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="task-list">
            {suggestions.map((item) => <Card key={item.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="task-head"><Badge variant="secondary">{item.kind}</Badge><span className="fine-print">{item.status ?? 'draft'}</span></div>
                <h3>{item.title}</h3>
                <p className="muted">{item.content}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => setPrompt(item.payloadJson?.prompt ?? item.content)}>载入 Prompt</Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => apply(item.id, 'create-task')}>转为生成任务</Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => apply(item.id, 'ack')}>标记已采纳</Button>
                </div>
                <details className="diagnostics"><summary>Payload</summary><pre className="debug-json">{JSON.stringify(item.payloadJson ?? {}, null, 2)}</pre></details>
              </CardContent>
            </Card>)}
          </div>
        </CardContent>
      </Card>
    </div>
  </section>;
}
