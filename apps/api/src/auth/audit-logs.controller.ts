import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { getRequestContext, roleAtLeast } from './request-context';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('take') take: string | undefined, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.auditLog.findMany({ where: roleAtLeast(ctx.role, 'owner') ? undefined : { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(Number(take ?? 80), 1), 200) });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }
}
