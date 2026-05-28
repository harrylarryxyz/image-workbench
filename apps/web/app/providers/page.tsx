'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type Provider = {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  defaultModel: string;
  apiMode: string;
  enabled: boolean;
  apiKeyMasked: string;
  capabilities?: {
    generate: boolean | null;
    edit: boolean | null;
    mask: boolean | null;
    transparent: boolean | null;
    multipleRefs: boolean | null;
    maxRefs: number | null;
    recommendedTimeoutSec: number | null;
    maxOutputCount?: number | null;
    sizes?: string[] | null;
    qualities?: string[] | null;
    formats?: string[] | null;
    apiModes?: string[] | null;
    source: string;
  };
  editHealth?: {
    status: 'healthy' | 'failing' | 'unknown' | 'untested' | 'ok';
    lastTaskStatus: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    checkedAt: string | null;
  };
  updatedAt?: string;
};

type Message = { kind: 'idle' | 'success' | 'error' | 'info'; text: string; detail?: unknown };

function capabilityLabel(value?: boolean | null) {
  if (value === true) return 'supported';
  if (value === false) return 'unsupported';
  return 'unknown';
}

function messageBadge(kind: Message['kind']) {
  if (kind === 'error') return 'destructive';
  if (kind === 'success') return 'secondary';
  return 'outline';
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [message, setMessage] = useState<Message>({ kind: 'idle', text: 'No message.' });
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const rows = await apiGet<Provider[]>('/providers');
    setProviders(rows);
  }

  useEffect(() => { void refresh().catch((error) => setMessage({ kind: 'error', text: String(error) })); }, []);

  async function createProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage({ kind: 'info', text: 'Saving provider…' });
    const form = new FormData(event.currentTarget);
    try {
      await apiPost('/providers', {
        name: form.get('name'),
        type: form.get('type'),
        baseUrl: form.get('baseUrl'),
        apiKey: form.get('apiKey'),
        defaultModel: form.get('defaultModel'),
        apiMode: form.get('apiMode'),
        enabled: true,
      });
      event.currentTarget.reset();
      await refresh();
      setMessage({ kind: 'success', text: 'Provider saved.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  async function toggle(provider: Provider) {
    await apiPatch(`/providers/${provider.id}`, { enabled: !provider.enabled });
    await refresh();
    setMessage({ kind: 'success', text: `${provider.name} ${provider.enabled ? 'disabled' : 'enabled'}.` });
  }

  async function test(provider: Provider) {
    setMessage({ kind: 'info', text: `Testing ${provider.name} /models…` });
    try {
      const result = await apiPost(`/providers/${provider.id}/test`, {});
      setMessage({ kind: 'success', text: `${provider.name} /models responded.`, detail: result });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    }
  }

  async function testEdit(provider: Provider) {
    setMessage({ kind: 'info', text: `Testing ${provider.name} /images/edits…` });
    try {
      const result = await apiPost(`/providers/${provider.id}/test-edit`, {});
      setMessage({ kind: 'success', text: `${provider.name} edit probe finished.`, detail: result });
      await refresh();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    }
  }

  async function seedEnv() {
    await apiPost('/providers/seed-env', { name: 'gettoken' });
    await refresh();
    setMessage({ kind: 'success', text: 'Provider synchronized from environment.' });
  }

  return <section className="space-y-5">
    <div className="studio-hero">
      <p className="eyebrow">Providers</p>
      <h1>Provider 控制中心</h1>
      <p className="sub">把模型能力、编辑健康度和密钥状态做成运营视图；API key 只提交给服务端，页面只显示 masked key。</p>
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
      <Card>
        <form onSubmit={createProvider}>
          <CardHeader>
            <CardDescription>New Provider</CardDescription>
            <CardTitle>接入 OpenAI-compatible 服务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="provider-name">Name</Label><Input id="provider-name" name="name" placeholder="gettoken / freemodel / custom" required /></div>
            <div className="space-y-2"><Label>Type</Label><Select name="type" defaultValue="openai-compatible"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai-compatible">openai-compatible</SelectItem><SelectItem value="custom-http">custom-http</SelectItem><SelectItem value="fal">fal</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="provider-base-url">Base URL</Label><Input id="provider-base-url" name="baseUrl" placeholder="https://api.example.com/v1" required /></div>
            <div className="space-y-2"><Label htmlFor="provider-api-key">API Key</Label><Input id="provider-api-key" name="apiKey" type="password" placeholder="sk-..." required /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="provider-default-model">Default Model</Label><Input id="provider-default-model" name="defaultModel" defaultValue="gpt-image-2" /></div>
              <div className="space-y-2"><Label>API Mode</Label><Select name="apiMode" defaultValue="auto"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">auto</SelectItem><SelectItem value="images">images</SelectItem><SelectItem value="responses">responses</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button disabled={loading} type="submit">保存 Provider</Button>
              <Button variant="secondary" type="button" onClick={seedEnv}>从环境变量同步 gettoken</Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3"><CardDescription>Command Center</CardDescription><Badge variant={messageBadge(message.kind)}>{message.kind}</Badge></div>
          <CardTitle>{message.text}</CardTitle>
          <CardDescription>测试结果和 provider 原始响应收在 Diagnostics，避免主界面变成 API 调试台。</CardDescription>
        </CardHeader>
        <CardContent>
          <details className="diagnostics" open={Boolean(message.detail)}>
            <summary>Diagnostics</summary>
            <pre className="debug-json">{JSON.stringify(message.detail ?? message, null, 2)}</pre>
          </details>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4">
      {providers.map((provider) => <Card key={provider.id}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={provider.enabled ? 'secondary' : 'destructive'}>{provider.enabled ? 'ENABLED' : 'DISABLED'}</Badge>
            <span className="text-sm text-muted-foreground">{provider.apiKeyMasked}</span>
          </div>
          <CardTitle>{provider.name}</CardTitle>
          <CardDescription>{provider.baseUrl}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[['Model', provider.defaultModel], ['Mode', provider.apiMode], ['Generate', capabilityLabel(provider.capabilities?.generate)], ['Edit', capabilityLabel(provider.capabilities?.edit)]].map(([label, value]) => <div className="rounded-lg border bg-muted/30 p-3" key={label}><b className="block text-sm">{value}</b><span className="text-xs text-muted-foreground">{label}</span></div>)}
          </div>
          <dl className="grid gap-x-4 gap-y-2 text-sm md:grid-cols-[140px_1fr]">
            <dt className="text-muted-foreground">Type</dt><dd>{provider.type}</dd>
            <dt className="text-muted-foreground">Mask</dt><dd>{capabilityLabel(provider.capabilities?.mask)}</dd>
            <dt className="text-muted-foreground">Max refs</dt><dd>{provider.capabilities?.maxRefs ?? '?'}</dd>
            <dt className="text-muted-foreground">Edit health</dt><dd>{provider.editHealth?.status ?? 'untested'}{provider.editHealth?.errorCode ? ` · ${provider.editHealth.errorCode}` : ''}</dd>
            <dt className="text-muted-foreground">Sizes</dt><dd>{provider.capabilities?.sizes?.join(', ') ?? 'unknown'}</dd>
            <dt className="text-muted-foreground">Qualities</dt><dd>{provider.capabilities?.qualities?.join(', ') ?? 'unknown'}</dd>
            <dt className="text-muted-foreground">Formats</dt><dd>{provider.capabilities?.formats?.join(', ') ?? 'unknown'}</dd>
          </dl>
          {provider.editHealth?.errorMessage ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{provider.editHealth.errorMessage}</div> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" type="button" onClick={() => toggle(provider)}>{provider.enabled ? '禁用' : '启用'}</Button>
            <Button variant="outline" type="button" onClick={() => test(provider)}>测试 /models</Button>
            <Button variant="outline" type="button" onClick={() => testEdit(provider)}>检测 /images/edits</Button>
          </div>
        </CardContent>
      </Card>)}
    </div>
  </section>;
}
