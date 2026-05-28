import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { friendlyError } from '@/components/product/state';
import { messageBadge } from './provider-utils';
import type { Message } from './types';

type CredentialsSyncProps = { message: Message };

function messageTitle(message: Message) {
  if (message.kind === 'idle') return '等待操作';
  if (message.kind === 'error') return friendlyError(message.text, 'Provider 操作暂时无法完成');
  return message.text;
}

export function CredentialsSync({ message }: CredentialsSyncProps) {
  return <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3"><CardDescription>Command Center</CardDescription><Badge variant={messageBadge(message.kind)}>{message.kind}</Badge></div>
      <CardTitle>{messageTitle(message)}</CardTitle>
      <CardDescription>这里显示最近一次保存、启用或连通性检测结果；技术细节保留在服务日志和 Ops。</CardDescription>
    </CardHeader>
  </Card>;
}
