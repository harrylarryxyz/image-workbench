'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { apiPost } from '../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../lib/task-events';

type TaskImage = { id?: string; storageKey: string; assetUrl?: string; thumbnailUrl?: string; format: string; sizeBytes: number; width?: number | null; height?: number | null; sourceAssetId?: string | null };
type TaskResult = {
  id?: string;
  status?: string;
  type?: string;
  error?: string | null;
  errorMessage?: string | null;
  model?: string;
  prompt?: string;
  elapsedMs?: number | null;
  routeJson?: unknown;
  images?: TaskImage[];
  [key: string]: unknown;
};
type Variant = { id?: string; title?: string; content: string; payloadJson?: { prompt?: string } };

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'default';
  if (normalized === 'failed' || normalized === 'cancelled') return 'destructive';
  if (normalized === 'running') return 'secondary';
  return 'outline';
}

function imageUrl(image?: TaskImage | null) {
  if (!image) return null;
  const raw = image.thumbnailUrl ?? image.assetUrl;
  if (raw?.startsWith('/assets/')) return `/api${raw}`;
  if (raw) return raw;
  return `/api/assets/file?key=${encodeURIComponent(image.storageKey)}`;
}

function keyUrl(key?: string) {
  return key ? `/api/assets/file?key=${encodeURIComponent(key)}` : null;
}

function extractImageToken(prompt: string) {
  const match = prompt.match(/@image\(([^)]+)\)|@image:([^\s]+)/i);
  return match?.[1] ?? match?.[2] ?? '';
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('A detailed square illustration of a small orange robot fixing a glowing blue sign outside a cozy rainy-night cyberpunk cafe.');
  const [model, setModel] = useState('gpt-image-2');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('low');
  const [format, setFormat] = useState('png');
  const [background, setBackground] = useState('auto');
  const [apiMode, setApiMode] = useState('auto');
  const [referenceKey, setReferenceKey] = useState('');
  const [maskKey, setMaskKey] = useState('');
  const [versionChain, setVersionChain] = useState<TaskResult[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
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
    const ref = params.get('ref') ?? params.get('image') ?? '';
    if (ref) setReferenceKey(ref);
  }, []);

  useEffect(() => {
    const token = extractImageToken(prompt);
    if (token && !referenceKey) setReferenceKey(token);
  }, [prompt, referenceKey]);

  async function watchTask(id: string) {
    let fallbackStarted = false;
    setStreaming(true);
    const onTask = (task: TaskResult) => {
      setResult(task);
      if (TERMINAL.has(task.status ?? '')) {
        setStreaming(false);
        setVersionChain((prev) => [task, ...prev.filter((item) => item.id !== task.id)].slice(0, 8));
      }
    };
    const fallback = async (error?: unknown) => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      if (error) console.warn('Task SSE unavailable; falling back to polling', error);
      await pollTaskUntilTerminal<TaskResult>(id, onTask);
    };
    const unsubscribe = subscribeTaskEvents<TaskResult>(id, (task) => {
      onTask(task);
      if (TERMINAL.has(task.status ?? '')) unsubscribe();
    }, fallback);
  }

  async function submit() {
    setLoading(true);
    try {
      const ref = referenceKey.trim();
      const endpoint = ref ? '/tasks/edit' : '/tasks/generate';
      const payload = ref
        ? { prompt, model, size, quality, format, background, apiMode, refKeys: [ref], maskKey: maskKey.trim() || undefined, count: 1, timeoutSec: 600 }
        : { prompt, model, size, quality, format, background, apiMode, count: 1, timeoutSec: 600 };
      const created = await apiPost<TaskResult>(endpoint, payload);
      setResult(created);
      setVersionChain((prev) => [created, ...prev.filter((item) => item.id !== created.id)].slice(0, 8));
      if (created.id) await watchTask(created.id);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  async function makeVariants() {
    const reply = await apiPost<{ suggestions: Variant[] }>('/agent/prompt-variants', { prompt, model, size, quality });
    setVariants(reply.suggestions ?? []);
  }

  const firstImage = result?.images?.[0] ?? null;
  const previewUrl = imageUrl(firstImage);
  const referencePreview = keyUrl(referenceKey.trim());
  const primaryStatus = result?.status ?? (loading ? 'QUEUED' : 'READY');
  const metrics = useMemo(() => [
    ['Mode', referenceKey.trim() ? 'Image edit' : 'Text generate'],
    ['Model', model],
    ['Size', size],
    ['Quality', quality],
    ['Format', format.toUpperCase()],
  ], [referenceKey, model, size, quality, format]);

  return <>
    <section className="studio-hero">
      <p className="eyebrow">Create Studio 2.0</p>
      <h1>创作工作台</h1>
      <p className="sub">文生图、参考图改图、Mask、Prompt 变体、@image 引用和版本链收进同一个创作界面；主流程只展示创作决策，工程响应进入 Diagnostics。</p>
    </section>

    <div className="studio-shell">
      <Card className="gap-5 bg-card/85">
        <CardHeader>
          <p className="eyebrow">Prompt</p>
          <CardTitle>描述你要生成或修改的画面</CardTitle>
          <CardDescription>支持 `@image(storageKey)` 或右侧参考图字段；有参考图时自动走 edit workflow。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-40" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={makeVariants}>生成 3 个 Prompt 变体</Button>
            <Button asChild type="button" variant="outline"><Link href="/prompts">打开 Prompt Library</Link></Button>
            <Button asChild type="button" variant="outline"><Link href="/gallery">从 Asset Library 选择图</Link></Button>
          </div>

          {variants.length ? <div className="grid gap-3 md:grid-cols-3">
            {variants.map((variant, index) => <Button
              className="h-auto justify-start whitespace-normal rounded-xl border-border/70 p-4 text-left"
              type="button"
              variant="outline"
              key={variant.id ?? index}
              onClick={() => setPrompt(variant.payloadJson?.prompt ?? variant.content)}
            >
              <span className="grid gap-1">
                <b>{variant.title ?? `Variant ${index + 1}`}</b>
                <span className="text-muted-foreground line-clamp-3 text-xs leading-5">{variant.content}</span>
              </span>
            </Button>)}
          </div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="reference-key">Reference Storage Key</Label><Input id="reference-key" value={referenceKey} onChange={(e) => setReferenceKey(e.target.value)} placeholder="可留空；或 @image(local://uploads/...)" /></div>
            <div className="space-y-2"><Label htmlFor="mask-key">Mask Key</Label><Input id="mask-key" value={maskKey} onChange={(e) => setMaskKey(e.target.value)} placeholder="Edit Mask 上传后得到的 key" /></div>
            <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="size">Size</Label><NativeSelect id="size" value={size} onChange={(e) => setSize(e.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option><option>auto</option></NativeSelect></div>
            <div className="space-y-2"><Label htmlFor="quality">Quality</Label><NativeSelect id="quality" value={quality} onChange={(e) => setQuality(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>auto</option></NativeSelect></div>
            <div className="space-y-2"><Label htmlFor="format">Format</Label><NativeSelect id="format" value={format} onChange={(e) => setFormat(e.target.value)}><option>png</option><option>jpeg</option><option>webp</option></NativeSelect></div>
            <div className="space-y-2"><Label htmlFor="background">Background</Label><NativeSelect id="background" value={background} onChange={(e) => setBackground(e.target.value)}><option>auto</option><option>opaque</option><option>transparent</option></NativeSelect></div>
            <div className="space-y-2"><Label htmlFor="api-mode">API Mode</Label><NativeSelect id="api-mode" value={apiMode} onChange={(e) => setApiMode(e.target.value)}><option>auto</option><option>images</option><option>responses</option></NativeSelect></div>
          </div>

          <Button className="w-full" disabled={loading} onClick={submit}>
            {loading ? '生成中，等待实时状态…' : referenceKey.trim() ? '创建参考图编辑任务' : '提交生成任务'}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline"><Link href="/edit">打开 Mask / Edit 工作区</Link></Button>
            <Button asChild type="button" variant="outline"><Link href={`/canvas?prompt=${encodeURIComponent(prompt)}${referenceKey ? `&image=${encodeURIComponent(referenceKey)}` : ''}`}>发送当前设定到 Canvas</Link></Button>
            <Button asChild type="button" variant="outline"><Link href="/agent">打开创作 Agent</Link></Button>
          </div>
        </CardContent>
      </Card>

      <section className="preview-stage" aria-label="PreviewStage">
        <div className="task-head">
          <div>
            <p className="eyebrow">PreviewStage</p>
            <h2>{result?.id ? `Task ${result.id.slice(0, 8)}` : '等待第一张作品'}</h2>
          </div>
          <Badge variant={statusVariant(primaryStatus)}>{primaryStatus}</Badge>
        </div>
        <div className={referencePreview && previewUrl ? 'compare-stage' : 'preview-frame'}>
          {referencePreview && previewUrl ? <>
            <div><span>Before</span><img src={referencePreview} alt="reference before" /></div>
            <div><span>After</span><img src={previewUrl} alt={prompt || 'generated image'} /></div>
          </> : previewUrl ? <img src={previewUrl} alt={prompt || 'generated image'} /> : referencePreview ? <div className="preview-empty"><b>Reference loaded</b><img src={referencePreview} alt="reference" /></div> : <div className="preview-empty"><b>ImageActionToolbar ready</b><span>提交任务后，结果会在这里实时出现；下载、继续编辑、发送到画布都会显示在下方。</span></div>}
        </div>
        <div>
          <div className="metric-grid">
            {metrics.map(([label, value]) => <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <div className="image-action-toolbar">
            {previewUrl ? <Button asChild type="button" size="sm" variant="outline"><a href={previewUrl} target="_blank" rel="noreferrer" download>下载原图</a></Button> : null}
            {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>作为参考图继续编辑</Link></Button> : null}
            {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送到 Canvas</Link></Button> : null}
            {result?.id ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/tasks/${result.id}`}>任务详情</Link></Button> : null}
            <Badge variant="outline">{streaming ? 'SSE 实时更新' : 'SSE / fallback ready'}</Badge>
          </div>
          {versionChain.length ? <div className="version-strip">
            {versionChain.map((task) => <Button asChild type="button" size="sm" variant="outline" key={task.id ?? Math.random()}><Link href={task.id ? `/tasks/${task.id}` : '#'}>{task.type ?? 'task'} · {task.status ?? 'created'} · {task.id?.slice(0, 8)}</Link></Button>)}
          </div> : null}
          {result?.error || result?.errorMessage ? <Card className="mt-4 border-destructive/40 bg-destructive/10"><CardContent className="pt-6 text-sm text-destructive">{result.errorMessage ?? result.error}</CardContent></Card> : null}
          <details className="diagnostics">
            <summary>Diagnostics · 原始任务响应</summary>
            <pre className="debug-json">{JSON.stringify(result ?? { hint: 'Submit a task to see task id.' }, null, 2)}</pre>
          </details>
        </div>
      </section>
    </div>
  </>;
}
