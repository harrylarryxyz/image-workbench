import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('take') take?: string) {
    const rows = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(Number(take ?? 80), 1), 200) });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }
}
