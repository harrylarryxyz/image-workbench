'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { apiPost } from '../../lib/api';

type TokenRow = { id: string; label?: string | null; role: string; tokenHashMasked?: string; createdAt?: string; lastSeenAt?: string | null; revokedAt?: string | null };
type CreatedToken = { id: string; token: string; role: string; workspaceId: string; inviteUrl?: string; label?: string };

export function SettingsActions({ tokens }: { tokens: TokenRow[] }) {
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('default');
  const [label, setLabel] = useState('team invite');
  const [role, setRole] = useState('operator');
  const [expiresAt, setExpiresAt] = useState('');
  const [created, setCreated] = useState<CreatedToken | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    const workspace = params.get('workspace');
    if (inviteToken) setToken(inviteToken);
    if (workspace) setWorkspaceId(workspace);
    if (inviteToken) setMessage('Invite token detected. Click Cookie 登录 to join this workspace.');
  }, []);

  async function loginWithCookie() {
    await apiPost('/auth/login', { token: token.trim(), workspaceId: workspaceId.trim() || 'default' });
    window.localStorage.setItem('workbench_workspace', workspaceId.trim() || 'default');
    setMessage('已登录并写入 HttpOnly session cookie；页面会刷新。');
    window.location.reload();
  }

  async function logout() {
    await apiPost('/auth/logout', {});
    window.localStorage.removeItem('workbench_token');
    setMessage('已退出当前浏览器 session；页面会刷新。');
    window.location.reload();
  }

  function saveLocalToken() {
    if (token.trim()) window.localStorage.setItem('workbench_token', token.trim());
    if (workspaceId.trim()) window.localStorage.setItem('workbench_workspace', workspaceId.trim());
    setMessage('已保存到当前浏览器 localStorage。优先建议使用上方 Cookie 登录。');
  }

  async function createToken() {
    const row = await apiPost<CreatedToken>('/auth/tokens', { workspaceId, label, role, expiresAt: expiresAt || undefined });
    setCreated(row);
    setMessage('新 token / invite link 只显示一次，请立即复制保存。');
  }

  async function revoke(id: string) {
    if (!window.confirm('I understand this changes production data')) return;
    await apiPost(`/auth/tokens/${id}/revoke`, {});
    setMessage('已撤销 token，刷新页面可见最新状态。');
  }

  function copy(value?: string | null) {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setMessage('已复制。');
  }

  const absoluteInvite = created?.inviteUrl ? `${window.location.origin}${created.inviteUrl}` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>登录、Invite 与 Token 管理</CardTitle>
        <CardDescription>生产推荐使用 Cookie session + CSRF；localStorage token 只保留为兼容入口。viewer 只读，operator 可创作，admin 管理 provider，owner 可跨 workspace。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="settings-token">Token</Label><Input id="settings-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="WORKBENCH_ADMIN_TOKEN 或 session token" /></div>
          <div className="space-y-2"><Label htmlFor="settings-workspace">Workspace ID</Label><Input id="settings-workspace" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loginWithCookie}>Cookie 登录</Button>
          <Button type="button" variant="outline" onClick={logout}>退出</Button>
          <Button type="button" variant="outline" onClick={saveLocalToken}>保存到浏览器</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="invite-label">Invite 标签</Label><Input id="invite-label" value={label} onChange={(event) => setLabel(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="invite-role">角色</Label><NativeSelect id="invite-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="viewer">viewer</option><option value="operator">operator</option><option value="admin">admin</option><option value="owner">owner</option></NativeSelect></div>
          <div className="space-y-2"><Label htmlFor="invite-expires">过期时间</Label><Input id="invite-expires" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} placeholder="2026-12-31T00:00:00Z" /></div>
        </div>
        <Button type="button" onClick={createToken}>生成 Invite / Session Token</Button>
        {created ? <Card className="bg-muted/30">
          <CardContent className="space-y-3 pt-6">
            <p className="eyebrow">Invite token</p>
            <div className="rounded-lg border bg-muted/20 p-3 font-mono text-sm break-all">{created.token}</div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" type="button" onClick={() => copy(created.token)}>复制 Token</Button><Button size="sm" variant="outline" type="button" onClick={() => copy(absoluteInvite)}>复制 Invite Link</Button></div>
            {absoluteInvite ? <p className="fine-print">{absoluteInvite}</p> : null}
          </CardContent>
        </Card> : null}
        {message ? <p className="muted">{message}</p> : null}
        <h3>当前 Workspace Sessions</h3>
        <div className="stack small">
          {tokens.map((item) => <Card key={item.id}><CardContent className="space-y-3 pt-6"><div className="task-head"><strong>{item.label ?? 'unnamed'}</strong><Badge variant={item.revokedAt ? 'destructive' : 'secondary'}>{item.role}</Badge></div><p className="muted">{item.tokenHashMasked} · last seen {item.lastSeenAt ?? 'never'} {item.revokedAt ? `· revoked ${item.revokedAt}` : ''}</p><Button type="button" size="sm" variant="outline" onClick={() => revoke(item.id)} disabled={Boolean(item.revokedAt)}>撤销</Button></CardContent></Card>)}
        </div>
      </CardContent>
    </Card>
  );
}
