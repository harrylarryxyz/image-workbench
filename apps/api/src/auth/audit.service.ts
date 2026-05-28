import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, targetType?: string, targetId?: string, metadata?: Record<string, unknown>) {
    try {
      await this.prisma.auditLog.create({
        data: { action, targetType, targetId, metadataJson: metadata as any },
      });
    } catch {
      // Audit logging must never break the user action.
    }
  }
}
