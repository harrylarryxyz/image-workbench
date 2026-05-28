import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ProviderProfile } from '../lib/shared';
import { getModelCapability, listModelCapabilities, normalizeBaseUrl } from '../lib/provider-sdk';
import { decryptSecret, encryptSecret, maskSecret } from './secret-box';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';

function maskKey(value: string): string {
  if (!value) return '';
  if (value.length <= 10) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function toApiMode(value: unknown): 'AUTO' | 'IMAGES' | 'RESPONSES' {
  const mode = String(value ?? 'auto').toUpperCase();
  if (mode === 'IMAGES' || mode === 'RESPONSES') return mode;
  return 'AUTO';
}

function toType(value: unknown): 'OPENAI_COMPATIBLE' | 'FAL' | 'CUSTOM_HTTP' {
  const type = String(value ?? 'openai-compatible').toUpperCase().replaceAll('-', '_');
  if (type === 'FAL' || type === 'CUSTOM_HTTP') return type;
  return 'OPENAI_COMPATIBLE';
}

const TINY_PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'));

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService, private readonly audit?: AuditService) {}

  async list(ctx?: RequestContext) {
    const rows = await this.prisma.providerProfile.findMany({ where: ctx ? { workspaceId: ctx.workspaceId } : undefined, orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }] });
    return Promise.all(rows.map((row) => this.serialize(row, true)));
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
    return this.serialize(row);
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
    return this.serialize(row);
  }

  async remove(id: string, ctx?: RequestContext) {
    const existing = await this.prisma.providerProfile.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!existing) throw new BadRequestException('provider not found');
    await this.prisma.providerProfile.delete({ where: { id: existing.id } });
    await this.audit?.log('provider.delete', 'provider', id, undefined, ctx);
    return { ok: true };
  }

  async test(id: string, ctx?: RequestContext) {
    const row = await this.prisma.providerProfile.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!row) return { ok: false, error: 'provider not found' };
    const started = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${row.baseUrl.replace(/\/+$/, '')}/models`, {
        headers: { authorization: `Bearer ${decryptSecret(row.apiKeyEncrypted)}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const contentType = res.headers.get('content-type') ?? '';
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = null; }
      return {
        ok: res.ok,
        status: res.status,
        contentType,
        elapsedMs: Date.now() - started,
        modelCount: Array.isArray(parsed?.data) ? parsed.data.length : undefined,
        preview: res.ok ? undefined : text.slice(0, 240),
      };
    } catch (error) {
      return { ok: false, elapsedMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
    }
  }


  async testEdit(id: string, ctx?: RequestContext) {
    const row = await this.prisma.providerProfile.findFirst({ where: { id, ...(ctx ? { workspaceId: ctx.workspaceId } : {}) } });
    if (!row) return { ok: false, supported: false, error: 'provider not found' };
    const started = Date.now();
    const { baseUrl } = normalizeBaseUrl(row.baseUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const form = new FormData();
      form.set('model', row.defaultModel);
      form.set('prompt', 'Capability probe: return the same tiny reference image.');
      form.set('size', '1024x1024');
      form.set('quality', 'low');
      form.set('response_format', 'b64_json');
      form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'capability-probe.png');
      const res = await fetch(`${baseUrl}/images/edits`, {
        method: 'POST',
        headers: { authorization: `Bearer ${decryptSecret(row.apiKeyEncrypted)}` },
        body: form,
        signal: controller.signal,
      });
      const contentType = res.headers.get('content-type') ?? '';
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = null; }
      const hasImage = Array.isArray(parsed?.data) && parsed.data.some((item: any) => item?.b64_json || item?.url);
      return {
        ok: res.ok && hasImage,
        supported: res.ok && hasImage,
        status: res.status,
        contentType,
        elapsedMs: Date.now() - started,
        endpoint: '/images/edits',
        model: row.defaultModel,
        preview: res.ok && hasImage ? undefined : text.slice(0, 360),
      };
    } catch (error) {
      return { ok: false, supported: false, elapsedMs: Date.now() - started, endpoint: '/images/edits', model: row.defaultModel, error: error instanceof Error ? error.message : String(error) };
    } finally {
      clearTimeout(timer);
    }
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
    return this.serialize(row);
  }

  private async serialize(row: any, includeHealth = false) {
    const capability = getModelCapability(row.defaultModel);
    const lastEditTask = includeHealth ? await this.prisma.generationTask.findFirst({
      where: { providerId: row.id, type: 'image.edit', ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}) },
      orderBy: { updatedAt: 'desc' },
      select: { status: true, errorCode: true, errorMessage: true, updatedAt: true },
    }) : null;
    const editHealth = lastEditTask ? {
      status: lastEditTask.status === 'SUCCEEDED' ? 'healthy' : lastEditTask.status === 'FAILED' ? 'failing' : 'unknown',
      lastTaskStatus: lastEditTask.status,
      errorCode: lastEditTask.errorCode,
      errorMessage: lastEditTask.errorMessage,
      checkedAt: lastEditTask.updatedAt.toISOString(),
    } : { status: 'untested', lastTaskStatus: null, errorCode: null, errorMessage: null, checkedAt: null };
    return {
      id: row.id,
      name: row.name,
      type: row.type.toLowerCase().replace('_', '-') as ProviderProfile['type'],
      baseUrl: row.baseUrl,
      defaultModel: row.defaultModel,
      apiMode: row.apiMode.toLowerCase(),
      enabled: row.enabled,
      apiKeyMasked: maskSecret(row.apiKeyEncrypted),
      capabilities: {
        model: row.defaultModel,
        generate: capability?.supportsGenerate ?? null,
        edit: capability?.supportsEdit ?? null,
        mask: capability?.supportsMask ?? null,
        transparent: capability?.supportsTransparent ?? null,
        multipleRefs: capability?.supportsMultipleRefs ?? null,
        maxRefs: capability?.maxRefs ?? null,
        recommendedTimeoutSec: capability?.recommendedTimeoutSec ?? null,
        maxOutputCount: capability?.maxOutputCount ?? null,
        sizes: capability?.sizes ?? null,
        qualities: capability?.qualities ?? null,
        formats: capability?.formats ?? null,
        apiModes: capability?.apiModes ?? null,
        source: capability ? 'builtin-model-profile' : 'unknown-model',
      },
      editHealth,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
