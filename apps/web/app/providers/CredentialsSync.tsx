import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { messageBadge } from './provider-utils';
import type { Message } from './types';

type CredentialsSyncProps = { message: Message };

export function CredentialsSync({ message }: CredentialsSyncProps) {
  return <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3"><CardDescription>Command Center</CardDescription><Badge variant={messageBadge(message.kind)}>{message.kind}</Badge></div>
      <CardTitle>{message.text}</CardTitle>
      <CardDescription>这里显示最近一次保存、启用或连通性检测结果。</CardDescription>
    </CardHeader>
  </Card>;
}
