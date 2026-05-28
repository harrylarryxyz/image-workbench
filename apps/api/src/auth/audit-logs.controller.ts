import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma.service';
import { getRequestContext, roleAtLeast } from './request-context';

function csvEscape(value: unknown) {
  const text = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  private where(query: any, req: Request) {
    const ctx = getRequestContext(req);
    const where: any = roleAtLeast(ctx.role, 'owner') ? {} : { workspaceId: ctx.workspaceId };
    if (query?.action) where.action = { contains: String(query.action), mode: 'insensitive' };
    if (query?.targetType) where.targetType = String(query.targetType);
    if (query?.actorRole) where.actorRole = String(query.actorRole);
    if (query?.from || query?.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(String(query.from));
      if (query.to) where.createdAt.lte = new Date(String(query.to));
    }
    if (roleAtLeast(ctx.role, 'owner') && query?.workspaceId) where.workspaceId = String(query.workspaceId);
    return where;
  }

  @Get()
  async list(@Query() query: any = {}, @Req() req: Request = {} as any) {
    const take = Math.min(Math.max(Number(query.take ?? 80), 1), 500);
    const rows = await this.prisma.auditLog.findMany({ where: this.where(query, req), orderBy: { createdAt: 'desc' }, take });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  @Get('export.csv')
  async exportCsv(@Query() query: any = {}, @Req() req: Request = {} as any, @Res() res: Response) {
    const rows = await this.prisma.auditLog.findMany({ where: this.where(query, req), orderBy: { createdAt: 'desc' }, take: 2000 });
    const header = ['createdAt', 'workspaceId', 'actorLabel', 'actorRole', 'action', 'targetType', 'targetId', 'metadataJson'];
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => csvEscape((row as any)[key])).join(','))].join('\n');
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  }
}
