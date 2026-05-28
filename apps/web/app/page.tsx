'use client';

import Link from 'next/link';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { apiFormPost, apiPost } from '../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../lib/task-events';

type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
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
  if (normalized === 'running' || normalized === 'queued') return 'secondary';
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

function fileNameFromKey(key: string) {
  const clean = decodeURIComponent(key).split('?')[0];
  return clean.split('/').pop() || '参考图';
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
  const [referenceName, setReferenceName] = useState('');
  const [maskKey, setMaskKey] = useState('');
  const [versionChain, setVersionChain] = useState<TaskResult[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (ref) {
      setReferenceKey(ref);
      setReferenceName(fileNameFromKey(ref));
    }
  }, []);

  useEffect(() => {
    const token = extractImageToken(prompt);
    if (token && !referenceKey) {
      setReferenceKey(token);
      setReferenceName(fileNameFromKey(token));
    }
  }, [prompt, referenceKey]);

  async function watchTask(id: string) {
    let fallbackStarted = false;
    const onTask = (task: TaskResult) => {
      setResult(task);
      if (TERMINAL.has(task.status ?? '')) {
        setVersionChain((prev) => [task, ...prev.filter((item) => item.id !== task.id)].slice(0, 8));
      }
    };
    const fallback = async (error?: unknown) => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      if (error) console.warn('Task stream unavailable; using status polling', error);
      await pollTaskUntilTerminal<TaskResult>(id, onTask);
    };
    const unsubscribe = subscribeTaskEvents<TaskResult>(id, (task) => {
      onTask(task);
      if (TERMINAL.has(task.status ?? '')) unsubscribe();
    }, fallback);
  }

  async function uploadReference(file?: File | null) {
    if (!file) return;
    setUploadingReference(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const uploaded = await apiFormPost<Uploaded>('/assets/upload', form);
      setReferenceKey(uploaded.storageKey);
      setReferenceName(uploaded.originalName ?? file.name);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setUploadingReference(false);
    }
  }

  function onReferenceFileChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadReference(event.target.files?.[0]);
    event.currentTarget.value = '';
  }

  function onDropReference(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadReference(event.dataTransfer.files?.[0]);
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
    ['模式', referenceKey.trim() ? '参考图编辑' : '文字生成'],
    ['模型', model],
    ['画幅', size],
    ['质量', quality],
  ], [referenceKey, model, size, quality]);

  return <section className="lovart-shell">
    <div className="studio-hero lovart-hero">
      <p className="eyebrow">YOUR AI IMAGE PARTNER</p>
      <h1>你想创作什么？</h1>
      <p className="sub">把创意、参考图和输出预览放在同一层级：先表达意图，再按需展开高级参数，最后把结果送往图库、编辑或画布。</p>
    </div>

    <div className="studio-shell lovart-workbench">
      <Card className="composer-card gap-5 bg-card/85">
        <CardHeader>
          <p className="eyebrow">Create Studio</p>
          <CardTitle>What shall we create together?</CardTitle>
          <CardDescription>默认只保留创作必需项；模型、尺寸、质量和格式统一收进高级设置。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prompt">画面描述</Label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-44 text-base leading-7" />
          </div>

          <div
            className="reference-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDropReference}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click(); }}
          >
            <Input ref={fileInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={onReferenceFileChange} />
            <div>
              <b>上传参考图</b>
              <p>点击上传或拖拽图片到这里；选择后自动用于参考图编辑。</p>
              {referenceName ? <span>{referenceName}</span> : null}
            </div>
            <Button type="button" variant="secondary" disabled={uploadingReference} onClick={() => fileInputRef.current?.click()}>{uploadingReference ? '上传中…' : '选择图片'}</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={makeVariants}>生成 Prompt 变体</Button>
            <Button asChild type="button" variant="outline"><Link href="/prompts">Prompt Library</Link></Button>
            <Button asChild type="button" variant="outline"><Link href="/gallery">从素材库选择</Link></Button>
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

          <div className="rounded-2xl border border-border/70 bg-muted/20">
            <Button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" type="button" variant="ghost" onClick={() => setAdvancedOpen((value) => !value)} aria-expanded={advancedOpen}>
              <span><b>高级设置</b><small className="mt-1 block text-muted-foreground">Model / Size / Quality / Format</small></span>
              <span className="text-xl leading-none">{advancedOpen ? '−' : '+'}</span>
            </Button>
            {advancedOpen ? <div className="grid gap-4 border-t border-border/70 p-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="size">Size</Label><NativeSelect id="size" value={size} onChange={(e) => setSize(e.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option><option>auto</option></NativeSelect></div>
              <div className="space-y-2"><Label htmlFor="quality">Quality</Label><NativeSelect id="quality" value={quality} onChange={(e) => setQuality(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>auto</option></NativeSelect></div>
              <div className="space-y-2"><Label htmlFor="format">Format</Label><NativeSelect id="format" value={format} onChange={(e) => setFormat(e.target.value)}><option>png</option><option>jpeg</option><option>webp</option></NativeSelect></div>
              <div className="space-y-2"><Label htmlFor="background">Background</Label><NativeSelect id="background" value={background} onChange={(e) => setBackground(e.target.value)}><option>auto</option><option>opaque</option><option>transparent</option></NativeSelect></div>
              <div className="space-y-2"><Label htmlFor="api-mode">API Mode</Label><NativeSelect id="api-mode" value={apiMode} onChange={(e) => setApiMode(e.target.value)}><option>auto</option><option>images</option><option>responses</option></NativeSelect></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="mask-key">Mask</Label><Input id="mask-key" value={maskKey} onChange={(e) => setMaskKey(e.target.value)} placeholder="从 Edit 工作区生成后自动带入，通常无需填写" /></div>
            </div> : null}
          </div>

          <Button className="h-12 w-full rounded-full text-base" disabled={loading} onClick={submit}>
            {loading ? '正在创作…' : referenceKey.trim() ? '基于参考图创作' : '开始生成'}
          </Button>
        </CardContent>
      </Card>

      <section className="preview-stage" aria-label="预览画布">
        <div className="task-head">
          <div>
            <p className="eyebrow">LIVE CANVAS</p>
            <h2>{result?.id ? `作品 ${result.id.slice(0, 8)}` : '预览画布'}</h2>
          </div>
          <Badge variant={statusVariant(primaryStatus)}>{primaryStatus}</Badge>
        </div>
        <div className={referencePreview && previewUrl ? 'compare-stage' : 'preview-frame'}>
          {referencePreview && previewUrl ? <>
            <div><span>Before</span><img src={referencePreview} alt="reference before" /></div>
            <div><span>After</span><img src={previewUrl} alt={prompt || 'generated image'} /></div>
          </> : previewUrl ? <img src={previewUrl} alt={prompt || 'generated image'} /> : referencePreview ? <div className="preview-empty"><b>参考图已载入</b><img src={referencePreview} alt="reference" /></div> : <div className="preview-empty"><b>等待创作</b><span>输入描述或上传参考图后，作品会在这里呈现。</span></div>}
        </div>
        <div>
          <div className="metric-grid">
            {metrics.map(([label, value]) => <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <div className="image-action-toolbar">
            {previewUrl ? <Button asChild type="button" size="sm" variant="outline"><a href={previewUrl} target="_blank" rel="noreferrer" download>下载原图</a></Button> : null}
            {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/edit?ref=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>继续编辑</Link></Button> : null}
            {firstImage?.storageKey ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/canvas?image=${encodeURIComponent(firstImage.storageKey)}&prompt=${encodeURIComponent(prompt)}`}>发送 Canvas</Link></Button> : null}
            {result?.id ? <Button asChild type="button" size="sm" variant="outline"><Link href={`/tasks/${result.id}`}>任务详情</Link></Button> : null}
          </div>
          {versionChain.length ? <div className="version-strip">
            {versionChain.map((task) => <Button asChild type="button" size="sm" variant="outline" key={task.id ?? Math.random()}><Link href={task.id ? `/tasks/${task.id}` : '#'}>{task.type ?? 'task'} · {task.status ?? 'created'} · {task.id?.slice(0, 8)}</Link></Button>)}
          </div> : null}
          {result?.error || result?.errorMessage ? <Card className="mt-4 border-destructive/40 bg-destructive/10"><CardContent className="pt-6 text-sm text-destructive">{result.errorMessage ?? result.error}</CardContent></Card> : null}
        </div>
      </section>
    </div>

    <div className="support-grid">
      <Card className="bg-card/70"><CardHeader><p className="eyebrow">Touch Edit</p><CardTitle>局部修改</CardTitle><CardDescription>进入 Mask 工作区，针对画面局部继续调整。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href="/edit">打开 Edit</Link></Button></CardContent></Card>
      <Card className="bg-card/70"><CardHeader><p className="eyebrow">Asset Flow</p><CardTitle>素材复用</CardTitle><CardDescription>从图库挑选作品，回到创作台或发送到画布。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href="/gallery">浏览素材库</Link></Button></CardContent></Card>
      <Card className="bg-card/70"><CardHeader><p className="eyebrow">Workflow</p><CardTitle>画布编排</CardTitle><CardDescription>把 Prompt、图像和任务节点组合成可复用流程。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/canvas?prompt=${encodeURIComponent(prompt)}${referenceKey ? `&image=${encodeURIComponent(referenceKey)}` : ''}`}>发送到 Canvas</Link></Button></CardContent></Card>
    </div>
  </section>;
}
