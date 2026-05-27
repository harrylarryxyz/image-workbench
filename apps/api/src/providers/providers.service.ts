import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ProviderProfile } from '@image-workbench/shared';

function maskKey(value: string): string {
  if (!value) return '';
  if (value.length <= 10) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.providerProfile.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type.toLowerCase().replace('_', '-') as ProviderProfile['type'],
      baseUrl: row.baseUrl,
      defaultModel: row.defaultModel,
      apiMode: row.apiMode.toLowerCase(),
      enabled: row.enabled,
      apiKeyMasked: maskKey(row.apiKeyEncrypted),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getDefault() {
    const configured = await this.prisma.providerProfile.findFirst({ where: { enabled: true }, orderBy: { createdAt: 'desc' } });
    if (configured) return configured;
    const baseUrl = process.env.IMAGE_API_BASE;
    const apiKey = process.env.IMAGE_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('No enabled provider profile and IMAGE_API_BASE/IMAGE_API_KEY are not configured');
    return this.prisma.providerProfile.create({
      data: {
        name: 'Environment provider',
        baseUrl,
        apiKeyEncrypted: apiKey,
        defaultModel: process.env.IMAGE_MODEL ?? 'gpt-image-2',
        apiMode: 'AUTO',
      },
    });
  }

  async seedEnvironmentProvider(name = 'Environment provider') {
    const baseUrl = process.env.IMAGE_API_BASE;
    const apiKey = process.env.IMAGE_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('IMAGE_API_BASE and IMAGE_API_KEY are required');
    const existing = await this.prisma.providerProfile.findFirst({ where: { name } });
    const data = {
      name,
      baseUrl,
      apiKeyEncrypted: apiKey,
      defaultModel: process.env.IMAGE_MODEL ?? 'gpt-image-2',
      apiMode: 'AUTO' as const,
      enabled: true,
    };
    const row = existing
      ? await this.prisma.providerProfile.update({ where: { id: existing.id }, data })
      : await this.prisma.providerProfile.create({ data });
    return { id: row.id, name: row.name, baseUrl: row.baseUrl, defaultModel: row.defaultModel, apiMode: row.apiMode.toLowerCase(), apiKeyMasked: maskKey(row.apiKeyEncrypted) };
  }
}
