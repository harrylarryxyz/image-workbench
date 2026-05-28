import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

function mockResponse() {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as any;
}

describe('AuthController login hardening', () => {
  it('does not create arbitrary workspaces for invalid login tokens', async () => {
    const prisma = {
      workspace: { upsert: vi.fn() },
      userSession: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    const controller = new AuthController(prisma);

    await expect(controller.login({ token: 'bad-token', workspaceId: 'spam' }, { headers: {} } as any, mockResponse())).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.workspace.upsert).not.toHaveBeenCalled();
  });

  it('sets both session and csrf cookies for bootstrap login', async () => {
    const previous = process.env.WORKBENCH_ADMIN_TOKEN;
    process.env.WORKBENCH_ADMIN_TOKEN = 'bootstrap';
    const prisma = {
      workspace: { upsert: vi.fn().mockResolvedValue({}) },
      userSession: { upsert: vi.fn().mockResolvedValue({}) },
    } as any;
    const res = mockResponse();
    const controller = new AuthController(prisma);

    try {
      await controller.login({ token: 'bootstrap', workspaceId: 'team-a' }, { headers: {} } as any, res);
    } finally {
      if (previous === undefined) delete process.env.WORKBENCH_ADMIN_TOKEN;
      else process.env.WORKBENCH_ADMIN_TOKEN = previous;
    }

    expect(res.cookie).toHaveBeenCalledWith('workbench_token', 'bootstrap', expect.objectContaining({ httpOnly: true }));
    expect(res.cookie).toHaveBeenCalledWith('workbench_csrf', expect.any(String), expect.objectContaining({ httpOnly: false }));
  });
});
