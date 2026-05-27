import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { assertModelRequestSupported, buildRouteMetadata, normalizeBaseUrl, resolveApiMode } from '@image-workbench/provider-sdk';
import { GenerateImageRequestSchema, type ApiMode } from '@image-workbench/shared';

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
            headers: { authorization: `Bearer ${provider.apiKeyEncrypted}`, 'content-type': 'application/json' },
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
      let b64 = this.extractImage(json);
      if (!b64 && request.apiMode === 'auto' && apiMode === 'images') {
        apiMode = 'responses'; endpoint = '/responses'; fallbackReason = 'images_empty_image_payload'; json = await callProvider(apiMode); b64 = this.extractImage(json);
      }
      if (!b64) throw new Error('response did not contain image data');
      const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
      const saved = await this.storage.putImage(bytes);
      const route = buildRouteMetadata({ requestedModel: model, resolvedModel: model, apiMode, endpoint, fallbackReason });
      await this.prisma.generationTask.update({
        where: { id: task.id },
        data: { status: 'SUCCEEDED', routeJson: route as any, elapsedMs: Date.now() - started, images: { create: { ...saved, prompt: request.prompt } } },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const diagnostic = this.diagnostics.classify(message);
      await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'FAILED', errorCode: diagnostic?.code, errorMessage: message, diagnosticsJson: diagnostic as any, elapsedMs: Date.now() - started } });
      throw error;
    }
  }

  private extractImage(json: any): string | null {
    for (const item of json?.data || []) if (item?.b64_json) return item.b64_json;
    for (const item of json?.output || []) if (item?.type === 'image_generation_call' && (item.result || item.b64_json)) return item.result || item.b64_json;
    return null;
  }
}
