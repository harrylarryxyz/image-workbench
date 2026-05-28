import { Body, Controller, Get, Param, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { Public } from './public.decorator';
import { getRequestContext, normalizeRole, tokenHash, type WorkbenchRole } from './request-context';

function newToken() { return `iwb_${randomBytes(24).toString('base64url')}`; }
function maskedHash(hash: string) { return `${hash.slice(0, 10)}…${hash.slice(-6)}`; }
function cookieOptions(httpOnly = true) { return { httpOnly, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' }; }
function setSessionCookies(res: Response, token: string) {
  res.cookie('workbench_token', token, cookieOptions(true));
  res.cookie('workbench_csrf', randomBytes(16).toString('base64url'), cookieOptions(false));
}

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('login')
  async login(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = String(body?.token ?? '').trim();
    if (!token) throw new UnauthorizedException('token is required');
    const adminToken = process.env.WORKBENCH_ADMIN_TOKEN;

    if (adminToken && token === adminToken) {
      const workspaceId = String(body?.workspaceId ?? req.headers['x-workspace-id'] ?? 'default');
      await this.prisma.workspace.upsert({ where: { id: workspaceId }, update: {}, create: { id: workspaceId, slug: workspaceId, name: workspaceId === 'default' ? 'Default Workspace' : workspaceId } });
      const hash = tokenHash(token);
      await this.prisma.userSession.upsert({
        where: { tokenHash: hash },
        update: { workspaceId, role: 'owner', label: 'bootstrap-admin-token', lastSeenAt: new Date(), revokedAt: null },
        create: { workspaceId, tokenHash: hash, role: 'owner', label: 'bootstrap-admin-token', lastSeenAt: new Date() },
      });
      setSessionCookies(res, token);
      return { ok: true, workspaceId, role: 'owner', label: 'bootstrap-admin-token' };
    }

    const session = await this.prisma.userSession.findUnique({ where: { tokenHash: tokenHash(token) } });
    if (!session || session.revokedAt || (session.expiresAt && session.expiresAt < new Date())) throw new UnauthorizedException('invalid session token');
    setSessionCookies(res, token);
    return { ok: true, workspaceId: session.workspaceId, role: session.role, label: session.label };
  }

  @Get('me')
  async me(@Req() req: Request) { return getRequestContext(req); }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('workbench_token', cookieOptions(true));
    res.clearCookie('workbench_csrf', cookieOptions(false));
    return { ok: true };
  }

  @Get('tokens')
  async tokens(@Req() req: Request) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.userSession.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map((row) => ({ id: row.id, label: row.label, role: row.role, tokenHashMasked: maskedHash(row.tokenHash), createdAt: row.createdAt.toISOString(), lastSeenAt: row.lastSeenAt?.toISOString?.() ?? null, expiresAt: row.expiresAt?.toISOString?.() ?? null, revokedAt: row.revokedAt?.toISOString?.() ?? null }));
  }

  @Post('tokens')
  async createToken(@Body() body: any, @Req() req: Request) {
    const ctx = getRequestContext(req);
    const role = normalizeRole(body?.role ?? 'operator') as WorkbenchRole;
    if (role === 'owner' && ctx.role !== 'owner') throw new UnauthorizedException('only owners can create owner tokens');
    const token = newToken();
    const workspaceId = ctx.role === 'owner' && body?.workspaceId ? String(body.workspaceId) : ctx.workspaceId;
    const label = body?.label ? String(body.label) : `${role} invite`;
    await this.prisma.workspace.upsert({ where: { id: workspaceId }, update: {}, create: { id: workspaceId, slug: workspaceId, name: workspaceId === 'default' ? 'Default Workspace' : workspaceId } });
    const row = await this.prisma.userSession.create({ data: { workspaceId, tokenHash: tokenHash(token), label, role, expiresAt: body?.expiresAt ? new Date(String(body.expiresAt)) : null } });
    const inviteUrl = `/settings?token=${encodeURIComponent(token)}&workspace=${encodeURIComponent(workspaceId)}`;
    return { id: row.id, token, label: row.label, role: row.role, workspaceId: row.workspaceId, inviteUrl };
  }

  @Post('tokens/:id/revoke')
  async revokeToken(@Param('id') id: string, @Req() req: Request) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.userSession.findFirst({ where: { id, ...(ctx.role === 'owner' ? {} : { workspaceId: ctx.workspaceId }) } });
    if (!row) throw new UnauthorizedException('cross-workspace revoke denied');
    await this.prisma.userSession.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return { ok: true, id };
  }
}
