'use client';

import { useState } from 'react';
import { apiPost } from '../../lib/api';

type TokenRow = { id: string; label?: string | null; role: string; tokenHashMasked?: string; createdAt?: string; lastSeenAt?: string | null; revokedAt?: string | null };

export function SettingsActions({ tokens }: { tokens: TokenRow[] }) {
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('default');
  const [label, setLabel] = useState('team token');
  const [role, setRole] = useState('operator');
  const [created, setCreated] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function saveLocalToken() {
    if (token.trim()) window.localStorage.setItem('workbench_token', token.trim());
    if (workspaceId.trim()) window.localStorage.setItem('workbench_workspace_id', workspaceId.trim());
    setMessage('已保存到当前浏览器 localStorage。');
  }

  async function createToken() {
    const row = await apiPost<{ token: string }>('/auth/tokens', { workspaceId, label, role });
    setCreated(row.token);
    setMessage('新 token 只显示一次，请立即复制保存。');
  }

  async function revoke(id: string) {
    await apiPost(`/auth/tokens/${id}/revoke`, {});
    setMessage('已撤销 token，刷新页面可见最新状态。');
  }

  return (
    <section className="card stack">
      <h2>登录与 Token 管理</h2>
      <label>Token<input value={token} onChange={(event) => setToken(event.target.value)} placeholder="WORKBENCH_ADMIN_TOKEN 或 session token" /></label>
      <label>Workspace ID<input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} /></label>
      <div className="row"><button type="button" onClick={saveLocalToken}>保存到浏览器</button><button type="button" onClick={createToken}>生成新 Session Token</button></div>
      <div className="grid two">
        <label>新 Token 标签<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>角色<select value={role} onChange={(event) => setRole(event.target.value)}><option value="viewer">viewer</option><option value="operator">operator</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
      </div>
      {created ? <pre className="codeblock">{created}</pre> : null}
      {message ? <p className="muted">{message}</p> : null}
      <h3>当前 Workspace Sessions</h3>
      <div className="stack small">
        {tokens.map((item) => <div key={item.id} className="card compact"><strong>{item.label ?? 'unnamed'}</strong><p className="muted">{item.role} · {item.tokenHashMasked} · last seen {item.lastSeenAt ?? 'never'} {item.revokedAt ? `· revoked ${item.revokedAt}` : ''}</p><button type="button" onClick={() => revoke(item.id)} disabled={Boolean(item.revokedAt)}>撤销</button></div>)}
      </div>
    </section>
  );
}
