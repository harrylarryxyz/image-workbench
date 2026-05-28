import { createHash } from 'node:crypto';
import type { Request } from 'express';

export type WorkbenchRole = 'owner' | 'admin' | 'operator' | 'viewer';
export type RequestContext = {
  workspaceId: string;
  tokenHash?: string;
  label?: string | null;
  role: WorkbenchRole;
  ip?: string;
  userAgent?: string;
  authSource: 'admin-token' | 'session' | 'anonymous-dev';
};

export const DEFAULT_WORKSPACE_ID = 'default';
const ROLES: WorkbenchRole[] = ['viewer', 'operator', 'admin', 'owner'];

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(header?: string) {
  return Object.fromEntries(String(header ?? '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const idx = part.indexOf('=');
    return idx === -1 ? [part, ''] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
  }));
}

export function readBearerToken(req?: Request | any): string | null {
  const header = String(req?.headers?.authorization ?? '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match?.[1]) return match[1].trim();
  const cookieToken = parseCookies(req?.headers?.cookie).workbench_token;
  return cookieToken || null;
}

export function normalizeRole(value: unknown): WorkbenchRole {
  const role = String(value ?? 'viewer').toLowerCase();
  return (ROLES as string[]).includes(role) ? role as WorkbenchRole : 'viewer';
}

export function roleAtLeast(role: WorkbenchRole, minimum: WorkbenchRole) {
  return ROLES.indexOf(role) >= ROLES.indexOf(minimum);
}

export function canUseMethod(role: WorkbenchRole, method: string, path = '') {
  const verb = method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(verb)) return true;
  const normalized = path.toLowerCase();
  if (normalized.startsWith('/providers') || normalized.startsWith('/workspaces') || normalized.startsWith('/auth/tokens')) return roleAtLeast(role, 'admin');
  if (verb === 'DELETE') return roleAtLeast(role, 'admin');
  return roleAtLeast(role, 'operator');
}

export function getRequestContext(req?: Request | any): RequestContext {
  if (req?.workbenchContext) return req.workbenchContext as RequestContext;
  const token = readBearerToken(req);
  const explicitWorkspace = String(req?.headers?.['x-workspace-id'] ?? '').trim();
  return {
    workspaceId: explicitWorkspace || DEFAULT_WORKSPACE_ID,
    tokenHash: token ? tokenHash(token) : undefined,
    role: 'owner',
    ip: req?.ip,
    userAgent: String(req?.headers?.['user-agent'] ?? ''),
    authSource: 'anonymous-dev',
  };
}

export async function resolveRequestContext(prisma: any, req?: Request | any): Promise<RequestContext> {
  const explicitWorkspace = String(req?.headers?.['x-workspace-id'] ?? '').trim();
  const token = readBearerToken(req);
  if (!token) return getRequestContext(req);
  const hash = tokenHash(token);
  const session = await prisma.userSession.findUnique({ where: { tokenHash: hash } });
  const now = new Date();
  if (!session || session.revokedAt || (session.expiresAt && session.expiresAt < now)) {
    return { ...getRequestContext(req), tokenHash: hash, role: 'viewer', authSource: 'session' };
  }
  await prisma.userSession.update({ where: { tokenHash: hash }, data: { lastSeenAt: now } }).catch(() => undefined);
  return {
    workspaceId: session.workspaceId || DEFAULT_WORKSPACE_ID,
    tokenHash: hash,
    label: session.label,
    role: normalizeRole(session.role),
    ip: req?.ip,
    userAgent: String(req?.headers?.['user-agent'] ?? ''),
    authSource: 'session',
  };
}

export function attachRequestContext(req: any, ctx: RequestContext) {
  req.workbenchContext = ctx;
  return ctx;
}
