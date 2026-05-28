import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { assertModelRequestSupported, buildRouteMetadata, normalizeBaseUrl, resolveApiMode } from '../lib/provider-sdk';
import { GenerateImageRequestSchema, type ApiMode } from '../lib/shared';
import { decryptSecret } from '../providers/secret-box';
import { toImageAssetCreate } from './image-asset-mapper';
import { callImagesEdit } from './image-edit-request.builder';
import { callImageGenerationProvider, extractImage } from './provider-image-client';

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
        b64 = await callImagesEdit(this.storage, baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, task.paramsJson as any);
      } else {
        let json = await callImageGenerationProvider(baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, apiMode);
        b64 = extractImage(json);
        if (!b64 && request.apiMode === 'auto' && apiMode === 'images') {
          apiMode = 'responses'; endpoint = '/responses'; fallbackReason = 'images_empty_image_payload'; json = await callImageGenerationProvider(baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, apiMode); b64 = extractImage(json);
        }
      }

      if (!b64) throw new Error('response did not contain image data');
      const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
      const saved = await this.storage.putImage(bytes);
      const route = buildRouteMetadata({ requestedModel: model, resolvedModel: model, apiMode, endpoint, fallbackReason });
      const refKeys = Array.isArray((task.paramsJson as any)?.refKeys) ? (task.paramsJson as any).refKeys.map(String) : [];
      const sourceAsset = refKeys.length ? await this.prisma.imageAsset.findFirst({ where: { storageKey: { in: refKeys }, ...(task.workspaceId ? { workspaceId: task.workspaceId } : {}) }, select: { id: true } }) : null;
      const imageCreate = toImageAssetCreate(saved, request.prompt, task.workspaceId, sourceAsset?.id);
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
}
