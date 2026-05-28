import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { getRequestContext, tokenHash } from './request-context';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() { return this.prisma.workspace.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }); }

  @Get('me')
  async me(@Req() req: Request) {
    const ctx = getRequestContext(req);
    const workspace = await this.prisma.workspace.upsert({ where: { id: ctx.workspaceId }, update: {}, create: { id: ctx.workspaceId, slug: ctx.workspaceId, name: ctx.workspaceId === 'default' ? 'Default Workspace' : ctx.workspaceId } });
    if (ctx.tokenHash) await this.prisma.userSession.upsert({ where: { tokenHash: ctx.tokenHash }, update: { lastSeenAt: new Date(), workspaceId: workspace.id }, create: { tokenHash: ctx.tokenHash, workspaceId: workspace.id, label: 'API token session', lastSeenAt: new Date() } });
    return { workspace, tokenHash: ctx.tokenHash ? `${ctx.tokenHash.slice(0, 10)}…` : null };
  }

  @Post()
  async create(@Body() body: any) {
    const slug = String(body?.slug ?? body?.name ?? 'workspace').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
    return this.prisma.workspace.upsert({ where: { slug }, update: { name: String(body?.name ?? slug) }, create: { slug, name: String(body?.name ?? slug) } });
  }

  @Post('sessions')
  async createSession(@Body() body: any) {
    const workspaceId = String(body?.workspaceId ?? 'default');
    await this.prisma.workspace.upsert({ where: { id: workspaceId }, update: {}, create: { id: workspaceId, slug: workspaceId, name: workspaceId } });
    return this.prisma.userSession.create({ data: { workspaceId, tokenHash: tokenHash(String(body?.token ?? crypto.randomUUID())), label: body?.label ? String(body.label) : 'manual session' } });
  }
}
