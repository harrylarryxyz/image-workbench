'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'secondary';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running' || normalized === 'queued' || normalized === 'pending') return 'outline';
  return 'default';
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
        maskMode: mask ? 'painted-area' : undefined,
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

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardDescription>Create Studio · Edit</CardDescription>
          <CardTitle>编辑输入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-3">
            <b className="block text-sm">编辑能力</b>
            <p className="mt-1 text-sm text-muted-foreground">{provider?.capabilities?.edit === false ? '当前 Provider 暂不支持参考图编辑，请切换后再试。' : '可上传参考图并按需绘制局部编辑区域。'}</p>
          </div>
          <form className="space-y-3" onSubmit={upload}>
            <Label htmlFor="reference-image">Reference Image</Label>
            <Input id="reference-image" name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
            <Button disabled={busy} type="submit">上传参考图</Button>
          </form>
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">Edit Prompt</Label>
            <Textarea id="edit-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="space-y-3">
            <div><h3 className="text-base font-semibold">Mask 编辑器</h3><p className="text-sm text-muted-foreground">在第一张参考图上绘制白色区域，支持 mask 的 provider 会只编辑选中区域。</p></div>
            <MaskEditor imageUrl={assetSrc(uploads[0]?.assetUrl)} onMaskReady={uploadMask} />
            {mask ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">局部编辑区域已保存</div> : <p className="text-xs text-muted-foreground">Mask optional；不需要局部修改时可留空。</p>}
          </div>
          <Button disabled={submitting || uploads.length === 0} onClick={submitEdit}>{submitting ? '提交中…' : '创建编辑任务'}</Button>
        </CardContent>
      </Card>

      <section className="preview-stage">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">PreviewStage</p><h2>{task?.id ?? `${uploads.length} / 4 references`}</h2></div>
          <Badge variant={statusVariant(task?.status)}>{task?.status ?? 'READY'}</Badge>
        </div>
        <div className="preview-frame">
          {outputUrl ? <img src={outputUrl} alt={task?.prompt ?? 'edited image'} /> : uploads[0] ? <img src={assetSrc(uploads[0].assetUrl)} alt={uploads[0].originalName ?? 'reference'} /> : <div className="preview-empty"><b>上传参考图开始编辑</b><span>输出图会替换这里的参考预览；图片工具条会提供下载、继续编辑和发送到 Canvas。</span></div>}
        </div>
        <div className="flex flex-wrap gap-2">
          {outputUrl ? <Button asChild variant="secondary"><a href={outputUrl} target="_blank" rel="noreferrer" download>下载输出</a></Button> : null}
          {firstOutput?.storageKey ? <Button asChild variant="secondary"><Link href={`/edit?ref=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑输出</Link></Button> : null}
          {firstOutput?.storageKey ? <Button asChild variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstOutput.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送到 Canvas</Link></Button> : null}
          {task?.id ? <Button asChild variant="outline"><Link href={`/tasks/${task.id}`}>任务详情</Link></Button> : null}
        </div>
        <div className="reference-strip">
          {uploads.map((item) => <Card key={item.storageKey} className="overflow-hidden p-0">
            <img src={assetSrc(item.assetUrl)} alt={item.originalName ?? 'reference'} />
            <CardContent className="p-3"><p className="text-xs text-muted-foreground">{item.originalName ?? item.storageKey}</p></CardContent>
          </Card>)}
        </div>
        {task?.errorMessage ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{task.errorMessage}</div> : null}
      </section>
    </div>
  </>;
}
