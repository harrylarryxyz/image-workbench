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
import { callImageGenerationProvider, extractImages } from './provider-image-client';
import type { ProviderImagePayload } from './provider-response-parser';
import { TaskEventsService } from './task-events.service';

async function providerImageBytes(image: ProviderImagePayload): Promise<Uint8Array> {
  if (image.b64Json) return Uint8Array.from(Buffer.from(image.b64Json, 'base64'));
  if (image.url) {
    const res = await fetch(image.url);
    if (!res.ok) throw new Error(`provider image URL fetch failed: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  throw new Error('provider image payload did not contain b64_json or url');
}

@Processor('image-generation')
export class ImageGenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly diagnostics: DiagnosticsService,
    private readonly events?: TaskEventsService,
  ) { super(); }

  async process(job: Job<{ taskId: string }>) {
    const task = await this.prisma.generationTask.findUnique({ where: { id: job.data.taskId }, include: { provider: true } });
    if (!task || !task.provider) return;
    const started = Date.now();
    await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'RUNNING' } });
    this.events?.notify(task.id);
    const request = GenerateImageRequestSchema.parse(task.paramsJson);
    const model = task.model;
    try {
      assertModelRequestSupported(request, model, task.type);
      const provider = task.provider;
      const { baseUrl, pointsToResponses } = normalizeBaseUrl(provider.baseUrl);
      let apiMode = resolveApiMode(request.apiMode as ApiMode, pointsToResponses);
      let endpoint = apiMode === 'responses' ? '/responses' : '/images/generations';
      let fallbackReason: string | null = null;
      let providerImages: ProviderImagePayload[];

      if (task.type === 'image.edit') {
        apiMode = 'images';
        endpoint = '/images/edits';
        providerImages = await callImagesEdit(this.storage, baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, task.paramsJson as any);
      } else {
        let json = await callImageGenerationProvider(baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, apiMode);
        providerImages = extractImages(json);
        if (!providerImages.length && request.apiMode === 'auto' && apiMode === 'images') {
          apiMode = 'responses';
          endpoint = '/responses';
          fallbackReason = 'images_empty_image_payload';
          json = await callImageGenerationProvider(baseUrl, decryptSecret(provider.apiKeyEncrypted), model, request, apiMode);
          providerImages = extractImages(json);
        }
      }

      if (!providerImages.length) throw new Error('response did not contain image data');
      const route = buildRouteMetadata({ requestedModel: model, resolvedModel: model, apiMode, endpoint, fallbackReason });
      const refKeys = Array.isArray((task.paramsJson as any)?.refKeys) ? (task.paramsJson as any).refKeys.map(String) : [];
      const sourceAsset = refKeys.length ? await this.prisma.imageAsset.findFirst({ where: { storageKey: { in: refKeys }, ...(task.workspaceId ? { workspaceId: task.workspaceId } : {}) }, select: { id: true } }) : null;
      const imageCreates = [];
      for (const image of providerImages) {
        const bytes = await providerImageBytes(image);
        const saved = await this.storage.putImage(bytes);
        imageCreates.push(toImageAssetCreate(saved, request.prompt, task.workspaceId, sourceAsset?.id, image.revisedPrompt));
      }
      await this.prisma.generationTask.update({
        where: { id: task.id },
        data: { status: 'SUCCEEDED', routeJson: route as any, elapsedMs: Date.now() - started, images: { create: imageCreates } },
      });
      this.events?.notify(task.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const diagnostic = this.diagnostics.classify(message);
      await this.prisma.generationTask.update({ where: { id: task.id }, data: { status: 'FAILED', errorCode: diagnostic?.code, errorMessage: message, diagnosticsJson: diagnostic as any, elapsedMs: Date.now() - started } });
      this.events?.notify(task.id);
      throw error;
    }
  }
}
