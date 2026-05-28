function apiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? '/api';
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const envToken = process.env.NEXT_PUBLIC_WORKBENCH_TOKEN;
  const envWorkspace = process.env.NEXT_PUBLIC_WORKSPACE_ID;
  if (envToken) headers.authorization = `Bearer ${envToken}`;
  if (envWorkspace) headers['x-workspace-id'] = envWorkspace;
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('workbench_token');
    const workspace = window.localStorage.getItem('workbench_workspace_id');
    if (token) headers.authorization = `Bearer ${token}`;
    if (workspace) headers['x-workspace-id'] = workspace;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { cache: 'no-store', headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify(body), cache: 'no-store' });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { method: 'PATCH', headers: { 'content-type': 'application/json', ...authHeaders() }, body: JSON.stringify(body), cache: 'no-store' });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { method: 'DELETE', cache: 'no-store', headers: authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
