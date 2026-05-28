'use client';

import { useEffect, useState } from 'react';
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
    <section className="card stack">
      <h2>登录、Invite 与 Token 管理</h2>
      <div className="notice">生产推荐使用 Cookie session + CSRF；localStorage token 只保留为兼容入口。viewer 只读，operator 可创作，admin 管理 provider，owner 可跨 workspace。</div>
      <label>Token<input value={token} onChange={(event) => setToken(event.target.value)} placeholder="WORKBENCH_ADMIN_TOKEN 或 session token" /></label>
      <label>Workspace ID<input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} /></label>
      <div className="actions">
        <button type="button" className="pill" onClick={loginWithCookie}>Cookie 登录</button>
        <button type="button" className="pill" onClick={logout}>退出</button>
        <button type="button" className="pill" onClick={saveLocalToken}>保存到浏览器</button>
      </div>
      <div className="grid three">
        <label>Invite 标签<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>角色<select value={role} onChange={(event) => setRole(event.target.value)}><option value="viewer">viewer</option><option value="operator">operator</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
        <label>过期时间<input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} placeholder="2026-12-31T00:00:00Z" /></label>
      </div>
      <button className="btn" type="button" onClick={createToken}>生成 Invite / Session Token</button>
      {created ? <div className="card compact">
        <p className="eyebrow">One-time secret</p>
        <pre className="debug-json">{created.token}</pre>
        <div className="actions"><button className="pill" type="button" onClick={() => copy(created.token)}>复制 Token</button><button className="pill" type="button" onClick={() => copy(absoluteInvite)}>复制 Invite Link</button></div>
        {absoluteInvite ? <p className="fine-print">{absoluteInvite}</p> : null}
      </div> : null}
      {message ? <p className="muted">{message}</p> : null}
      <h3>当前 Workspace Sessions</h3>
      <div className="stack small">
        {tokens.map((item) => <div key={item.id} className="card compact"><strong>{item.label ?? 'unnamed'}</strong><p className="muted">{item.role} · {item.tokenHashMasked} · last seen {item.lastSeenAt ?? 'never'} {item.revokedAt ? `· revoked ${item.revokedAt}` : ''}</p><button type="button" className="pill" onClick={() => revoke(item.id)} disabled={Boolean(item.revokedAt)}>撤销</button></div>)}
      </div>
    </section>
  );
}
