'use client';

import { FormEvent, useEffect, useState } from 'react';
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

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Providers</p>
      <h1>Provider 控制中心</h1>
      <p className="sub">把模型能力、编辑健康度和密钥状态做成运营视图；API key 只提交给服务端，页面只显示 masked key。</p>
    </div>

    <div className="grid two" style={{ marginTop: 20 }}>
      <form className="card" onSubmit={createProvider}>
        <p className="eyebrow">New Provider</p>
        <h2>接入 OpenAI-compatible 服务</h2>
        <label>Name</label>
        <input name="name" placeholder="gettoken / freemodel / custom" required />
        <label>Type</label>
        <select name="type" defaultValue="openai-compatible"><option value="openai-compatible">openai-compatible</option><option value="custom-http">custom-http</option><option value="fal">fal</option></select>
        <label>Base URL</label>
        <input name="baseUrl" placeholder="https://api.example.com/v1" required />
        <label>API Key</label>
        <input name="apiKey" type="password" placeholder="sk-..." required />
        <div className="form-grid">
          <div><label>Default Model</label><input name="defaultModel" defaultValue="gpt-image-2" /></div>
          <div><label>API Mode</label><select name="apiMode" defaultValue="auto"><option>auto</option><option>images</option><option>responses</option></select></div>
        </div>
        <button className="btn" disabled={loading} type="submit">保存 Provider</button>
        <button className="pill" type="button" onClick={seedEnv} style={{ marginLeft: 10 }}>从环境变量同步 gettoken</button>
      </form>

      <div className={`card ${message.kind === 'error' ? 'notice error' : ''}`}>
        <p className="eyebrow">Command Center</p>
        <h2>{message.text}</h2>
        <p className="muted">测试结果和 provider 原始响应收在 Diagnostics，避免主界面变成 API 调试台。</p>
        <details className="diagnostics" open={Boolean(message.detail)}>
          <summary>Diagnostics</summary>
          <pre className="debug-json">{JSON.stringify(message.detail ?? message, null, 2)}</pre>
        </details>
      </div>
    </div>

    <div className="task-list">
      {providers.map((provider) => <article className="task-card" key={provider.id}>
        <div className="task-head"><span className={provider.enabled ? 'status ok' : 'status bad'}>{provider.enabled ? 'ENABLED' : 'DISABLED'}</span><span className="muted">{provider.apiKeyMasked}</span></div>
        <h3>{provider.name}</h3>
        <p className="muted">{provider.baseUrl}</p>
        <div className="metric-grid">
          <div className="metric"><b>{provider.defaultModel}</b><span>Model</span></div>
          <div className="metric"><b>{provider.apiMode}</b><span>Mode</span></div>
          <div className="metric"><b>{capabilityLabel(provider.capabilities?.generate)}</b><span>Generate</span></div>
          <div className="metric"><b>{capabilityLabel(provider.capabilities?.edit)}</b><span>Edit</span></div>
        </div>
        <div className="kv">
          <b>Type</b><span>{provider.type}</span>
          <b>Mask</b><span>{capabilityLabel(provider.capabilities?.mask)}</span>
          <b>Max refs</b><span>{provider.capabilities?.maxRefs ?? '?'}</span>
          <b>Edit health</b><span>{provider.editHealth?.status ?? 'untested'}{provider.editHealth?.errorCode ? ` · ${provider.editHealth.errorCode}` : ''}</span>
          <b>Sizes</b><span>{provider.capabilities?.sizes?.join(', ') ?? 'unknown'}</span>
          <b>Qualities</b><span>{provider.capabilities?.qualities?.join(', ') ?? 'unknown'}</span>
          <b>Formats</b><span>{provider.capabilities?.formats?.join(', ') ?? 'unknown'}</span>
        </div>
        {provider.editHealth?.errorMessage ? <div className="notice error">{provider.editHealth.errorMessage}</div> : null}
        <div className="actions">
          <button className="pill" onClick={() => toggle(provider)}>{provider.enabled ? '禁用' : '启用'}</button>
          <button className="pill" onClick={() => test(provider)}>测试 /models</button>
          <button className="pill" onClick={() => testEdit(provider)}>检测 /images/edits</button>
        </div>
      </article>)}
    </div>
  </section>;
}
