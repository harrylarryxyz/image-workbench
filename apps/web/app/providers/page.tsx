'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

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
    source: string;
  };
  editHealth?: {
    status: 'healthy' | 'failing' | 'unknown' | 'untested';
    lastTaskStatus: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    checkedAt: string | null;
  };
  updatedAt?: string;
};

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? '/api'}${path}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const rows = await apiGet<Provider[]>('/providers');
    setProviders(rows);
  }

  useEffect(() => { void refresh().catch((error) => setMessage(String(error))); }, []);

  async function createProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
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
      setMessage('Provider saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function toggle(provider: Provider) {
    await apiPatch(`/providers/${provider.id}`, { enabled: !provider.enabled });
    await refresh();
  }

  async function test(provider: Provider) {
    setMessage(`Testing ${provider.name} /models...`);
    try {
      const result = await apiPost(`/providers/${provider.id}/test`, {});
      setMessage(JSON.stringify(result, null, 2));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function testEdit(provider: Provider) {
    setMessage(`Testing ${provider.name} /images/edits with a tiny probe image...`);
    try {
      const result = await apiPost(`/providers/${provider.id}/test-edit`, {});
      setMessage(JSON.stringify(result, null, 2));
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function seedEnv() {
    await apiPost('/providers/seed-env', { name: 'gettoken' });
    await refresh();
  }

  return <section>
    <div className="hero">
      <p className="eyebrow">Providers</p>
      <h1>Provider 配置</h1>
      <p className="sub">管理 OpenAI-compatible 图像 provider。API key 只提交给服务端，页面只显示 masked key。</p>
    </div>

    <div className="grid two" style={{ marginTop: 20 }}>
      <form className="card" onSubmit={createProvider}>
        <p className="eyebrow">New Provider</p>
        <label>Name</label>
        <input name="name" placeholder="gettoken / freemodel / custom" required />
        <label>Type</label>
        <select name="type" defaultValue="openai-compatible"><option value="openai-compatible">openai-compatible</option><option value="custom-http">custom-http</option><option value="fal">fal</option></select>
        <label>Base URL</label>
        <input name="baseUrl" placeholder="https://api.example.com/v1" required />
        <label>API Key</label>
        <input name="apiKey" type="password" placeholder="sk-..." required />
        <div className="row">
          <div><label>Default Model</label><input name="defaultModel" defaultValue="gpt-image-2" /></div>
          <div><label>API Mode</label><select name="apiMode" defaultValue="auto"><option>auto</option><option>images</option><option>responses</option></select></div>
        </div>
        <button className="btn" disabled={loading} type="submit">保存 Provider</button>
        <button className="pill" type="button" onClick={seedEnv} style={{ marginLeft: 10 }}>从环境变量同步 gettoken</button>
      </form>

      <div className="card">
        <p className="eyebrow">Message</p>
        <pre>{message || 'No message.'}</pre>
      </div>
    </div>

    <div className="task-list">
      {providers.map((provider) => <div className="task-card" key={provider.id}>
        <div className="task-head"><span className={provider.enabled ? 'status ok' : 'status bad'}>{provider.enabled ? 'ENABLED' : 'DISABLED'}</span><span className="muted">{provider.apiKeyMasked}</span></div>
        <h3>{provider.name}</h3>
        <p>{provider.baseUrl}</p>
        <div className="kv">
          <b>Model</b><span>{provider.defaultModel}</span>
          <b>Mode</b><span>{provider.apiMode}</span>
          <b>Type</b><span>{provider.type}</span>
          <b>Generate</b><span>{provider.capabilities?.generate === true ? 'supported' : provider.capabilities?.generate === false ? 'unsupported' : 'unknown'}</span>
          <b>Edit</b><span>{provider.capabilities?.edit === true ? `supported · max refs ${provider.capabilities.maxRefs ?? '?'}` : provider.capabilities?.edit === false ? 'unsupported' : 'unknown'}</span>
          <b>Edit health</b><span>{provider.editHealth?.status ?? 'untested'}{provider.editHealth?.errorCode ? ` · ${provider.editHealth.errorCode}` : ''}</span>
        </div>
        {provider.editHealth?.errorMessage ? <pre className="error">{provider.editHealth.errorMessage}</pre> : null}
        <div className="actions">
          <button className="pill" onClick={() => toggle(provider)}>{provider.enabled ? '禁用' : '启用'}</button>
          <button className="pill" onClick={() => test(provider)}>测试 /models</button>
          <button className="pill" onClick={() => testEdit(provider)}>检测 /images/edits</button>
        </div>
      </div>)}
    </div>
  </section>;
}
