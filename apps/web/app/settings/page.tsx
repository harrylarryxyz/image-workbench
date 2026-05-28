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
      <section className="card"><h2>当前上下文</h2><pre className="codeblock">{JSON.stringify(me, null, 2)}</pre></section>
      <section className="card"><h2>Workspaces</h2><div className="stack small">{workspaces.map((workspace) => <div key={workspace.id}><strong>{workspace.name}</strong><p className="muted">{workspace.id} / {workspace.slug}</p></div>)}</div></section>
      <SettingsActions tokens={tokens} />
    </div>
  );
}
