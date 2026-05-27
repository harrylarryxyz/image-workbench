function apiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3100';
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
