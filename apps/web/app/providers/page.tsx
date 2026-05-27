import { apiGet } from '../../lib/api';

export default async function ProvidersPage() {
  const providers = await apiGet<any[]>('/providers').catch((error) => [{ error: String(error) }]);
  return <section className="card"><p className="eyebrow">Providers</p><h1>Provider 配置</h1><p className="sub">Key 默认只在服务端保存，页面只显示 masked key。</p><pre>{JSON.stringify(providers, null, 2)}</pre></section>;
}
