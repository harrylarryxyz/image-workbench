import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { RequestContext } from './request-context';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, targetType?: string, targetId?: string, metadata?: Record<string, unknown>, ctx?: Partial<RequestContext>) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          targetType,
          targetId,
          metadataJson: metadata as any,
          workspaceId: ctx?.workspaceId,
          tokenHash: ctx?.tokenHash,
          actorLabel: ctx?.label ?? undefined,
          actorRole: ctx?.role,
          ip: ctx?.ip,
          userAgent: ctx?.userAgent,
        },
      });
    } catch {
      // Audit logging must never break the user action.
    }
  }
}
