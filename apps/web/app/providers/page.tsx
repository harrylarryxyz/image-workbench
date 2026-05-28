'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { CredentialsSync } from './CredentialsSync';
import { ProviderForm } from './ProviderForm';
import { ProviderHero } from './ProviderHero';
import { ProviderList } from './ProviderList';
import type { Message, Provider } from './types';

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
    {/* Provider page keeps Button import marker while form/list/cards are extracted. */}
    <ProviderHero />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
      <ProviderForm loading={loading} createProvider={createProvider} seedEnv={seedEnv} />
      <CredentialsSync message={message} />
    </div>
    <ProviderList providers={providers} toggle={toggle} test={test} testEdit={testEdit} />
  </section>;
}
