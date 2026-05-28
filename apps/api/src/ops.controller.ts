import { Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TasksService } from './tasks/tasks.service';
import { PrismaService } from './prisma.service';
import { getRequestContext } from './auth/request-context';
import { LocalStorageService } from './storage/local-storage.service';

@Controller('ops')
export class OpsController {
  constructor(private readonly tasks: TasksService, private readonly prisma: PrismaService, private readonly storage: LocalStorageService) {}

  @Get('alerts')
  async alerts(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const status = await this.tasks.queueStatus(ctx);
    const metrics = await this.tasks.metrics(ctx);
    const providerCount = await this.prisma.providerProfile.count({ where: { workspaceId: ctx.workspaceId, enabled: true } });
    const alerts: Array<{ level: string; code: string; message: string; action?: string }> = [];
    if ((status.queue.waiting ?? 0) + (status.queue.delayed ?? 0) > 10) alerts.push({ level: 'warning', code: 'queue_backlog', message: 'Queue backlog exceeds 10 jobs.', action: 'Open Tasks and retry/cancel stuck work.' });
    if ((metrics as any).quality?.failureRate > 0.3) alerts.push({ level: 'warning', code: 'high_failure_rate', message: 'Task failure rate is above 30%.', action: 'Review provider health and recent failed diagnostics.' });
    if ((metrics as any).images?.sizeBytes > 5 * 1024 * 1024 * 1024) alerts.push({ level: 'warning', code: 'storage_pressure', message: 'Image storage exceeds 5GB.', action: 'Archive or migrate old collections to object storage.' });
    if (!providerCount) alerts.push({ level: 'critical', code: 'no_provider', message: 'No enabled provider is configured.', action: 'Add a provider before running Studio/Canvas tasks.' });
    if (!process.env.WORKBENCH_ADMIN_TOKEN) alerts.push({ level: 'warning', code: 'anonymous_dev_auth', message: 'WORKBENCH_ADMIN_TOKEN is not configured; API is in anonymous-dev mode.', action: 'Set a stable admin token in production.' });
    if (!process.env.PROVIDER_SECRET_KEY) alerts.push({ level: 'warning', code: 'provider_secret_key_missing', message: 'PROVIDER_SECRET_KEY is not configured; legacy plaintext provider keys remain readable.', action: 'Set the key and run provider-secrets:migrate.' });
    return { alerts, checkedAt: new Date().toISOString(), status, metrics, storage: await this.storageStatusForWorkspace(ctx.workspaceId) };
  }

  @Get('storage')
  async storageStatus(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    return this.storageStatusForWorkspace(ctx.workspaceId);
  }

  private async storageStatusForWorkspace(workspaceId: string) {
    const where = workspaceId ? { workspaceId } : undefined;
    const images = await this.prisma.imageAsset.aggregate({ where, _count: { id: true }, _sum: { sizeBytes: true } });
    const orphanTasks = await this.prisma.generationTask.count({ where: { ...(where ?? {}), status: 'SUCCEEDED', images: { none: {} } } });
    const remote = this.storage.backend !== 'local';
    return {
      backend: this.storage.backend,
      root: this.storage.backend === 'local' ? this.storage.root : undefined,
      bucket: remote ? this.storage.bucket : undefined,
      publicBaseUrl: this.storage.publicBaseUrl ?? null,
      configured: this.storage.backend === 'local' || Boolean((this.storage as any).s3 || this.storage.publicBaseUrl),
      migration: { recommended: !remote && (images._sum.sizeBytes ?? 0) > 1024 * 1024 * 1024, status: remote ? 'remote-enabled' : 'local-compatible' },
      images: { count: images._count.id, sizeBytes: images._sum.sizeBytes ?? 0 },
      orphans: { succeededTasksWithoutImages: orphanTasks },
    };
  }

  @Get('providers/health')
  async providerHealth(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.providerProfile.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, take: 50 });
    const recent = await this.prisma.generationTask.groupBy({ by: ['providerId', 'status'], where: { workspaceId: ctx.workspaceId }, _count: { status: true } });
    return rows.map((provider) => {
      const counts = Object.fromEntries(recent.filter((row) => row.providerId === provider.id).map((row) => [row.status, row._count.status]));
      const failures = Number(counts.FAILED ?? 0);
      const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
      return { id: provider.id, name: provider.name, enabled: provider.enabled, defaultModel: provider.defaultModel, updatedAt: provider.updatedAt.toISOString(), usage: counts, failureRate: total ? failures / total : 0, quota: { configured: false, note: 'Provider quota API is not standardized; configure external provider dashboards for hard quotas.' } };
    });
  }

  @Get('backup/status')
  backupStatus() {
    return {
      configured: Boolean(process.env.BACKUP_DIR || process.env.BACKUP_MANIFEST_PATH),
      backupDir: process.env.BACKUP_DIR ?? '/opt/image-workbench/backups',
      manifestPath: process.env.BACKUP_MANIFEST_PATH ?? '/opt/image-workbench/backups/latest-manifest.json',
      restoreDrill: 'Run scripts/restore-rabisu-backup.sh against a disposable database/storage target before major releases.',
    };
  }

  @Post('danger/confirm')
  confirmDangerousAction() {
    return { ok: true, requiredPhrase: 'I understand this changes production data', note: 'Clients must show this before destructive batch actions.' };
  }
}
