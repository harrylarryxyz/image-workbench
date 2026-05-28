import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { normalizeBaseUrl } from '../lib/provider-sdk';
import { decryptSecret } from './secret-box';
import type { RequestContext } from '../auth/request-context';

const TINY_PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'));

@Injectable()
export class ProviderHealthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
