import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { assertModelRequestSupported, buildRouteMetadata, normalizeBaseUrl, resolveApiMode } from '../lib/provider-sdk';
import { GenerateImageRequestSchema, type ApiMode } from '../lib/shared';
import { decryptSecret } from '../providers/secret-box';

@Processor('image-generation')
export class ImageGenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly diagnostics: DiagnosticsService,
  ) { super(); }

  async process(job: Job<{ taskId: string }>) {
    const task = await this.prisma.generationTask.findUnique({ where: { id: job.data.taskId }, include: { provider: true } });
    if (!task || !task.provider) return;
    const started = Date.now();
    await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'RUNNING' } });
    const request = GenerateImageRequestSchema.parse(task.paramsJson);
    const model = task.model;
    try {
      assertModelRequestSupported(request, model);
      const provider = task.provider;
      const { baseUrl, pointsToResponses } = normalizeBaseUrl(provider.baseUrl);
      let apiMode = resolveApiMode(request.apiMode as ApiMode, pointsToResponses);
      let endpoint = apiMode === 'responses' ? '/responses' : '/images/generations';
      let fallbackReason: string | null = null;
      let b64: string | null;

      if (task.type === 'image.edit') {
        apiMode = 'images';
        endpoint = '/images/edits';
        b64 = await this.callImagesEdit(baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, task.paramsJson as any);
      } else {
        const callProvider = async (mode: ApiMode) => {
          const ep = mode === 'responses' ? '/responses' : '/images/generations';
          const payload = mode === 'responses'
            ? { model, input: request.prompt, tools: [{ type: 'image_generation', size: request.size, quality: request.quality, output_format: request.format, moderation: 'low' }] }
            : { model, prompt: request.prompt, n: request.count, size: request.size, quality: request.quality, format: request.format, response_format: 'b64_json', moderation: 'low' };
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), request.timeoutSec * 1000);
          try {
            const res = await fetch(`${baseUrl}${ep}`, {
              method: 'POST',
              headers: { authorization: `Bearer ${decryptSecret(provider.apiKeyEncrypted)}`, 'content-type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/html') && !res.ok) throw new Error(`server returned HTML instead of JSON | HTTP ${res.status} | Content-Type: ${contentType}`);
            const json = await res.json() as any;
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${json?.error?.message || JSON.stringify(json).slice(0, 200)}`);
            return json;
          } finally {
            clearTimeout(timer);
          }
        };
        let json = await callProvider(apiMode);
        b64 = this.extractImage(json);
        if (!b64 && request.apiMode === 'auto' && apiMode === 'images') {
          apiMode = 'responses'; endpoint = '/responses'; fallbackReason = 'images_empty_image_payload'; json = await callProvider(apiMode); b64 = this.extractImage(json);
        }
      }

      if (!b64) throw new Error('response did not contain image data');
      const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
      const saved = await this.storage.putImage(bytes);
      const route = buildRouteMetadata({ requestedModel: model, resolvedModel: model, apiMode, endpoint, fallbackReason });
      const imageCreate = this.toImageAssetCreate(saved, request.prompt);
      await this.prisma.generationTask.update({
        where: { id: task.id },
        data: { status: 'SUCCEEDED', routeJson: route as any, elapsedMs: Date.now() - started, images: { create: imageCreate } },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const diagnostic = this.diagnostics.classify(message);
      await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'FAILED', errorCode: diagnostic?.code, errorMessage: message, diagnosticsJson: diagnostic as any, elapsedMs: Date.now() - started } });
      throw error;
    }
  }

  private async callImagesEdit(baseUrl: string, apiKey: string, model: string, request: any, params: any): Promise<string | null> {
    const refKeys = Array.isArray(params?.refKeys) ? params.refKeys.slice(0, 4) : [];
    const maskKey = typeof params?.maskKey === 'string' && params.maskKey ? params.maskKey : null;
    if (!refKeys.length) throw new Error('at least one reference image is required');
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', request.prompt);
    form.set('size', request.size ?? '1024x1024');
    form.set('quality', request.quality ?? 'low');
    form.set('response_format', 'b64_json');
    for (const key of refKeys) {
      const bytes = await this.storage.readImage(key);
      const ext = key.split('.').pop()?.toLowerCase() || 'png';
      const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      form.append('image', new Blob([Buffer.from(bytes)], { type }), key.split('/').pop() || `reference.${ext}`);
    }
    if (maskKey) {
      const maskBytes = await this.storage.readImage(maskKey);
      form.set('mask', new Blob([Buffer.from(maskBytes)], { type: 'image/png' }), maskKey.split('/').pop() || 'mask.png');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(request.timeoutSec ?? 300) * 1000);
    try {
      const res = await fetch(`${baseUrl}/images/edits`, { method: 'POST', headers: { authorization: `Bearer ${apiKey}` }, body: form, signal: controller.signal });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') && !res.ok) throw new Error(`server returned HTML instead of JSON | HTTP ${res.status} | Content-Type: ${contentType}`);
      const text = await res.text();
      const json = this.parseProviderBody(text);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${json?.error?.message || text.slice(0, 240)}`);
      return this.extractImage(json);
    } finally {
      clearTimeout(timer);
    }
  }


  private parseProviderBody(text: string): any {
    try { return JSON.parse(text); } catch {}
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = 0; i < trimmed.length; i += 1) {
        const char = trimmed[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === '"') inString = false;
          continue;
        }
        if (char === '"') inString = true;
        else if (char === '{') depth += 1;
        else if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            try { return JSON.parse(trimmed.slice(0, i + 1)); } catch {}
            break;
          }
        }
      }
    }
    const eventIndex = text.indexOf('event:');
    const dataIndex = text.indexOf('data:');
    const cut = [eventIndex, dataIndex].filter((x) => x > 0).sort((a, b) => a - b)[0];
    if (cut) {
      const first = text.slice(0, cut).trim();
      try { return JSON.parse(first); } catch {}
    }
    throw new Error(`Provider returned non-JSON response: ${text.slice(0, 240)}`);
  }

  private extractImage(json: any): string | null {
    for (const item of json?.data || []) if (item?.b64_json) return item.b64_json;
    for (const item of json?.output || []) if (item?.type === 'image_generation_call' && (item.result || item.b64_json)) return item.result || item.b64_json;
    return null;
  }

  private toImageAssetCreate(saved: any, prompt: string) {
    const metadataJson = {
      backend: saved.backend,
      assetUrl: saved.assetUrl,
      thumbnailUrl: saved.thumbnailUrl,
      thumbnailFormat: saved.thumbnailFormat,
      thumbnailSizeBytes: saved.thumbnailSizeBytes,
    };
    return {
      storageKey: saved.storageKey,
      thumbnailKey: saved.thumbnailKey,
      format: saved.format,
      sizeBytes: saved.sizeBytes,
      sha256: saved.sha256,
      prompt,
      metadataJson,
    };
  }
}
