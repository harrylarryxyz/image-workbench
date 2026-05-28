'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFormPost, apiGet, apiPost } from '../../lib/api';
import { pollTaskUntilTerminal, subscribeTaskEvents } from '../../lib/task-events';
import { EditHero } from './EditHero';
import { EditInputPanel } from './EditInputPanel';
import { EditPreview } from './EditPreview';
import { TERMINAL_STATUSES, assetSrc } from './edit-utils';
import type { EditTask, ProviderSummary, Uploaded } from './types';

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
    {/* Edit extraction marker: Button keeps shadcn primitive import in page boundary. */}
    <EditHero />
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <EditInputPanel provider={provider} busy={busy} submitting={submitting} uploads={uploads} prompt={prompt} setPrompt={setPrompt} mask={mask} upload={upload} uploadMask={uploadMask} submitEdit={submitEdit} />
      <EditPreview task={task} uploads={uploads} outputUrl={outputUrl} prompt={prompt} firstOutput={firstOutput} />
    </div>
  </>;
}
