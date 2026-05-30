function localApiBase(): string {
  const host = process.env.API_INTERNAL_HOST ?? '127.0.0.1';
  const port = process.env.API_INTERNAL_PORT ?? '3100';
  return `http://${host}:${port}`;
}

function apiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? localApiBase();
  }
  return '/api';
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const value = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser
    ? window.localStorage.getItem('workbench_token') || process.env.NEXT_PUBLIC_WORKBENCH_TOKEN
    : process.env.WORKBENCH_ADMIN_TOKEN || process.env.NEXT_PUBLIC_WORKBENCH_TOKEN;
  const workspace = isBrowser
    ? window.localStorage.getItem('workbench_workspace') || window.localStorage.getItem('workbench_workspace_id') || process.env.NEXT_PUBLIC_WORKSPACE_ID
    : process.env.WORKBENCH_WORKSPACE_ID || process.env.NEXT_PUBLIC_WORKSPACE_ID;
  const csrf = isBrowser ? readBrowserCookie('workbench_csrf') : null;
  if (token) headers.authorization = `Bearer ${token}`;
  if (workspace) headers['x-workspace-id'] = workspace;
  if (csrf) headers['x-csrf-token'] = csrf;
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

export async function apiFormPost<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { method: 'POST', headers: authHeaders(), body, cache: 'no-store' });
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
