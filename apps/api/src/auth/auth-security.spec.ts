import { describe, expect, it, vi } from 'vitest';
import { canUseMethod, resolveRequestContext, tokenHash, verifyCsrfForCookieAuth } from './request-context';

describe('v0.8 auth/workspace security helpers', () => {
  it('resolves persisted token sessions to a workspace/role and touches lastSeenAt', async () => {
    const token = 'team-token';
    const prisma = {
      userSession: {
        findUnique: vi.fn().mockResolvedValue({ workspaceId: 'team-a', role: 'operator', label: 'team ops' }),
        update: vi.fn().mockResolvedValue({}),
      },
    } as any;

    const ctx = await resolveRequestContext(prisma, {
      headers: { authorization: `Bearer ${token}` },
      ip: '127.0.0.1',
    } as any);

    expect(ctx.workspaceId).toBe('team-a');
    expect(ctx.role).toBe('operator');
    expect(ctx.label).toBe('team ops');
    expect(ctx.tokenHash).toBe(tokenHash(token));
    expect(prisma.userSession.findUnique).toHaveBeenCalledWith({ where: { tokenHash: tokenHash(token) } });
    expect(prisma.userSession.update).toHaveBeenCalledWith({ where: { tokenHash: tokenHash(token) }, data: { lastSeenAt: expect.any(Date) } });
  });

  it('does not let a session hop workspaces through headers', async () => {
    const prisma = {
      userSession: {
        findUnique: vi.fn().mockResolvedValue({ workspaceId: 'team-a', tokenHash: tokenHash('tok'), role: 'operator', label: 'op', revokedAt: null, expiresAt: null }),
        update: vi.fn().mockResolvedValue({}),
      },
    } as any;

    const ctx = await resolveRequestContext(prisma, { headers: { authorization: 'Bearer tok', 'x-workspace-id': 'team-b' } } as any);

    expect(ctx.workspaceId).toBe('team-a');
  });

  it('keeps viewer sessions read-only while operators can mutate normal resources', () => {
    expect(canUseMethod('viewer', 'GET')).toBe(true);
    expect(canUseMethod('viewer', 'POST')).toBe(false);
    expect(canUseMethod('operator', 'POST')).toBe(true);
    expect(canUseMethod('admin', 'DELETE')).toBe(true);
    expect(canUseMethod('viewer', 'GET', '/auth/tokens')).toBe(false);
    expect(canUseMethod('admin', 'GET', '/auth/tokens')).toBe(true);
  });

  it('requires csrf for browser cookie mutations', () => {
    expect(verifyCsrfForCookieAuth({
      method: 'POST',
      headers: { cookie: 'workbench_token=t; workbench_csrf=abc', 'x-csrf-token': 'abc' },
    } as any)).toBe(true);
    expect(verifyCsrfForCookieAuth({
      method: 'POST',
      headers: { cookie: 'workbench_token=t; workbench_csrf=abc' },
    } as any)).toBe(false);
    expect(verifyCsrfForCookieAuth({
      method: 'GET',
      headers: { cookie: 'workbench_token=t; workbench_csrf=abc' },
    } as any)).toBe(true);
  });
});
