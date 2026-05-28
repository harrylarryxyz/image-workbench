function apiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? '/api';
}

export function authHeaders(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_WORKBENCH_TOKEN;
  return token ? { authorization: `Bearer ${token}` } : {};
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
