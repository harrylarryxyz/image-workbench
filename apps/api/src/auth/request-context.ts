import { createHash } from 'node:crypto';
import type { Request } from 'express';

export type RequestContext = { workspaceId: string; tokenHash?: string; label?: string };

export const DEFAULT_WORKSPACE_ID = 'default';

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getRequestContext(req?: Request | any): RequestContext {
  const token = String(req?.headers?.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  const explicitWorkspace = String(req?.headers?.['x-workspace-id'] ?? '').trim();
  return {
    workspaceId: explicitWorkspace || DEFAULT_WORKSPACE_ID,
    tokenHash: token ? tokenHash(token) : undefined,
  };
}
