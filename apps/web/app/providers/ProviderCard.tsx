import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { capabilityLabel } from './provider-utils';
import type { Provider } from './types';

type ProviderCardProps = {
  provider: Provider;
  toggle: (provider: Provider) => void;
  test: (provider: Provider) => void;
  testEdit: (provider: Provider) => void;
};

export function ProviderCard({ provider, toggle, test, testEdit }: ProviderCardProps) {
  return <Card>
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
  </Card>;
}
