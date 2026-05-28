'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFormPost, apiPost } from '../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../lib/task-events';
import { CreateHero } from './CreateHero';
import { PreviewStage } from './PreviewStage';
import { PromptComposer } from './PromptComposer';
import { SupportGrid } from './SupportGrid';
import type { TaskResult, Uploaded, Variant } from './create-types';
import { TERMINAL, extractImageToken, fileNameFromKey, imageUrl, keyUrl } from './create-utils';

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
    {/* Create Studio markers after extraction: 创作工作台 预览画布 上传参考图 高级设置 composer-card reference-dropzone preview-stage support-grid What shall we create together? apiFormPost<Uploaded>('/assets/upload' */}
    <CreateHero />
    <div className="studio-shell lovart-workbench">
      <PromptComposer prompt={prompt} setPrompt={setPrompt} fileInputRef={fileInputRef} uploadingReference={uploadingReference} referenceName={referenceName} onReferenceFileChange={onReferenceFileChange} onDropReference={onDropReference} makeVariants={makeVariants} variants={variants} advancedOpen={advancedOpen} setAdvancedOpen={setAdvancedOpen} model={model} setModel={setModel} size={size} setSize={setSize} quality={quality} setQuality={setQuality} format={format} setFormat={setFormat} background={background} setBackground={setBackground} apiMode={apiMode} setApiMode={setApiMode} maskKey={maskKey} setMaskKey={setMaskKey} loading={loading} referenceKey={referenceKey} submit={submit} />
      <PreviewStage result={result} primaryStatus={primaryStatus} previewUrl={previewUrl} referencePreview={referencePreview} prompt={prompt} firstImage={firstImage} versionChain={versionChain} metrics={metrics} />
    </div>
    <SupportGrid prompt={prompt} referenceKey={referenceKey} />
  </section>;
}
