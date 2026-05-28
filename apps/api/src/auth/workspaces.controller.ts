import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { getRequestContext, roleAtLeast, tokenHash } from './request-context';

function sessionPreview(row: any) {
  return { id: row.id, workspaceId: row.workspaceId, label: row.label, role: row.role, tokenHashMasked: `${row.tokenHash.slice(0, 10)}…${row.tokenHash.slice(-6)}`, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt, lastSeenAt: row.lastSeenAt?.toISOString?.() ?? null, revokedAt: row.revokedAt?.toISOString?.() ?? null, expiresAt: row.expiresAt?.toISOString?.() ?? null };
}

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const where = roleAtLeast(ctx.role, 'owner') ? undefined : { id: ctx.workspaceId };
    return this.prisma.workspace.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 100 });
  }

  @Get('me')
  async me(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const workspace = await this.prisma.workspace.upsert({ where: { id: ctx.workspaceId }, update: {}, create: { id: ctx.workspaceId, slug: ctx.workspaceId, name: ctx.workspaceId === 'default' ? 'Default Workspace' : ctx.workspaceId } });
    return { workspace, role: ctx.role, label: ctx.label, tokenHash: ctx.tokenHash ? `${ctx.tokenHash.slice(0, 10)}…${ctx.tokenHash.slice(-6)}` : null };
  }

  @Post()
  async create(@Body() body: any) {
    const slug = String(body?.slug ?? body?.name ?? 'workspace').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
    return this.prisma.workspace.upsert({ where: { slug }, update: { name: String(body?.name ?? slug) }, create: { slug, name: String(body?.name ?? slug) } });
  }

  @Get('sessions')
  async sessions(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.userSession.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map(sessionPreview);
  }

  @Post('sessions')
  async createSession(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const workspaceId = String(body?.workspaceId ?? ctx.workspaceId);
    await this.prisma.workspace.upsert({ where: { id: workspaceId }, update: {}, create: { id: workspaceId, slug: workspaceId, name: workspaceId } });
    const rawToken = String(body?.token ?? `iwb_${randomUUID().replaceAll('-', '')}`);
    const row = await this.prisma.userSession.create({ data: { workspaceId, tokenHash: tokenHash(rawToken), label: body?.label ? String(body.label) : 'manual session', role: String(body?.role ?? 'operator').toLowerCase(), expiresAt: body?.expiresAt ? new Date(String(body.expiresAt)) : null } });
    return { ...sessionPreview(row), token: rawToken };
  }

  @Post('sessions/:id/revoke')
  async revokeSession(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const result = await this.prisma.userSession.updateMany({ where: { id, workspaceId: ctx.workspaceId }, data: { revokedAt: new Date() } });
    return { ok: result.count === 1, id };
  }
}
