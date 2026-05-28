import { ProviderCard } from './ProviderCard';
import type { Provider } from './types';

type ProviderListProps = {
  providers: Provider[];
  toggle: (provider: Provider) => void;
  test: (provider: Provider) => void;
  testEdit: (provider: Provider) => void;
};

export function ProviderList({ providers, toggle, test, testEdit }: ProviderListProps) {
  return <div className="grid gap-4">
    {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} toggle={toggle} test={test} testEdit={testEdit} />)}
  </div>;
}
