import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { listModelCapabilities } from '../lib/provider-sdk';
import { encryptSecret } from './secret-box';
import { toApiMode, toType } from './provider-input';
import { serializeProvider } from './provider-serializer';
import { ProviderHealthService } from './provider-health.service';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService, private readonly health: ProviderHealthService, private readonly audit?: AuditService) {}

  async list(ctx?: RequestContext) {
    const rows = await this.prisma.providerProfile.findMany({ where: ctx ? { workspaceId: ctx.workspaceId } : undefined, orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }] });
    return Promise.all(rows.map((row) => serializeProvider(this.prisma, row, true)));
  }

  async create(body: any, ctx?: RequestContext) {
    const name = String(body?.name ?? '').trim();
    const baseUrl = String(body?.baseUrl ?? '').trim().replace(/\/+$/, '');
    const apiKey = String(body?.apiKey ?? '').trim();
    const defaultModel = String(body?.defaultModel ?? 'gpt-image-2').trim();
    if (!name) throw new BadRequestException('name is required');
    if (!baseUrl) throw new BadRequestException('baseUrl is required');
    if (!apiKey) throw new BadRequestException('apiKey is required');
    const row = await this.prisma.providerProfile.create({
      data: {
        name,
        type: toType(body?.type),
        baseUrl,
        apiKeyEncrypted: encryptSecret(apiKey),
        defaultModel,
        apiMode: toApiMode(body?.apiMode),
        enabled: body?.enabled !== false,
        workspaceId: ctx?.workspaceId,
      },
    });
    await this.audit?.log('provider.create', 'provider', row.id, { name, type: row.type, baseUrl }, ctx);
    return serializeProvider(this.prisma, row);
  }

  capabilities() { return listModelCapabilities(); }

  async update(id: string, body: any, ctx?: RequestContext) {
    const data: any = {};
    if (body?.name !== undefined) data.name = String(body.name).trim();
    if (body?.type !== undefined) data.type = toType(body.type);
    if (body?.baseUrl !== undefined) data.baseUrl = String(body.baseUrl).trim().replace(/\/+$/, '');
    if (body?.defaultModel !== undefined) data.defaultModel = String(body.defaultModel).trim();
    if (body?.apiMode !== undefined) data.apiMode = toApiMode(body.apiMode);
    if (body?.enabled !== undefined) data.enabled = Boolean(body.enabled);
    if (body?.apiKey !== undefined && String(body.apiKey).trim()) data.apiKeyEncrypted = encryptSecret(String(body.apiKey).trim());
    const existing = await this.prisma.providerProfile.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!existing) throw new BadRequestException('provider not found');
    const row = await this.prisma.providerProfile.update({ where: { id: existing.id }, data });
    await this.audit?.log('provider.update', 'provider', id, { fields: Object.keys(data) }, ctx);
    return serializeProvider(this.prisma, row);
  }

  async remove(id: string, ctx?: RequestContext) {
    const existing = await this.prisma.providerProfile.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!existing) throw new BadRequestException('provider not found');
    await this.prisma.providerProfile.delete({ where: { id: existing.id } });
    await this.audit?.log('provider.delete', 'provider', id, undefined, ctx);
    return { ok: true };
  }

  async test(id: string, ctx?: RequestContext) {
    return this.health.test(id, ctx);
  }

  async testEdit(id: string, ctx?: RequestContext) {
    return this.health.testEdit(id, ctx);
  }

  async getDefault(ctx?: RequestContext) {
    const configured = await this.prisma.providerProfile.findFirst({ where: { enabled: true, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) }, orderBy: { updatedAt: 'desc' } });
    if (configured) return configured;
    const baseUrl = process.env.IMAGE_API_BASE;
    const apiKey = process.env.IMAGE_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('No enabled provider profile and IMAGE_API_BASE/IMAGE_API_KEY are not configured');
    return this.prisma.providerProfile.create({
      data: {
        name: 'Environment provider',
        baseUrl,
        apiKeyEncrypted: encryptSecret(apiKey),
        defaultModel: process.env.IMAGE_MODEL ?? 'gpt-image-2',
        apiMode: 'AUTO',
        workspaceId: ctx?.workspaceId,
      },
    });
  }

  async seedEnvironmentProvider(name = 'Environment provider', ctx?: RequestContext) {
    const baseUrl = process.env.IMAGE_API_BASE;
    const apiKey = process.env.IMAGE_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('IMAGE_API_BASE and IMAGE_API_KEY are required');
    const existing = await this.prisma.providerProfile.findFirst({ where: { name, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    const data = {
      name,
      baseUrl,
      apiKeyEncrypted: encryptSecret(apiKey),
      defaultModel: process.env.IMAGE_MODEL ?? 'gpt-image-2',
      apiMode: 'AUTO' as const,
      enabled: true,
      workspaceId: ctx?.workspaceId,
    };
    const row = existing
      ? await this.prisma.providerProfile.update({ where: { id: existing.id }, data })
      : await this.prisma.providerProfile.create({ data });
    return serializeProvider(this.prisma, row);
  }
}
