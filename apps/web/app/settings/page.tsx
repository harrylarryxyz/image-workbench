import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '../../lib/api';
import { SettingsActions } from './settings-actions';

type Workspace = { id: string; slug: string; name: string };
type Session = { id: string; label?: string | null; role: string; tokenHashMasked?: string; createdAt?: string; lastSeenAt?: string | null; revokedAt?: string | null };

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try { return await apiGet<T>(path); } catch { return fallback; }
}

export default async function SettingsPage() {
  const [me, workspaces, tokens] = await Promise.all([
    safeGet<any>('/auth/me', null),
    safeGet<Workspace[]>('/workspaces', []),
    safeGet<Session[]>('/auth/tokens', []),
  ]);
  return (
    <div className="stack">
      <section className="hero"><h1>Settings</h1><p>生产认证、Invite Token、Workspace 隔离、角色权限和审计入口。团队成员通过一次性 invite/session token 加入，无公开注册面。</p></section>
      <Card><CardHeader><CardTitle>当前上下文</CardTitle></CardHeader><CardContent><div className="grid gap-2 text-sm"><p><b>用户</b>：{me?.user?.email ?? me?.user?.id ?? 'anonymous'}</p><p><b>Workspace</b>：{me?.workspace?.name ?? me?.workspace?.id ?? 'default'}</p><p><b>角色</b>：{me?.role ?? 'member'}</p></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Workspaces</CardTitle></CardHeader><CardContent><div className="stack small">{workspaces.map((workspace) => <div key={workspace.id}><strong>{workspace.name}</strong><p className="muted">{workspace.id} / {workspace.slug}</p></div>)}</div></CardContent></Card>
      <SettingsActions tokens={tokens} />
    </div>
  );
}
