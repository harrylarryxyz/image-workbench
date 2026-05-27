import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { GenerateImageRequestSchema } from '../lib/shared';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    @InjectQueue('image-generation') private readonly queue: Queue,
  ) {}

  async createGenerateTask(input: unknown) {
    const request = GenerateImageRequestSchema.parse(input);
    const provider = await this.providers.getDefault();
    const model = request.model || provider.defaultModel;
    const task = await this.prisma.generationTask.create({
      data: {
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: request,
        status: 'QUEUED',
      },
    });
    await this.queue.add('generate', { taskId: task.id }, { attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
    return { id: task.id, status: task.status };
  }

  async listRecent() {
    const rows = await this.prisma.generationTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { images: true, provider: true },
    });
    return rows.map((task) => this.serializeTask(task));
  }

  async getTask(id: string) {
    const task = await this.prisma.generationTask.findUnique({ where: { id }, include: { images: true, provider: true } });
    return task ? this.serializeTask(task, true) : null;
  }

  private serializeTask(task: any, includeDetails = false) {
    return {
      id: task.id,
      type: task.type,
      status: task.status,
      provider: task.provider ? {
        id: task.provider.id,
        name: task.provider.name,
        type: task.provider.type.toLowerCase().replace('_', '-'),
        baseUrl: task.provider.baseUrl,
        defaultModel: task.provider.defaultModel,
        apiMode: task.provider.apiMode.toLowerCase(),
      } : null,
      model: task.model,
      prompt: task.prompt,
      params: task.paramsJson,
      route: task.routeJson,
      diagnostics: task.diagnosticsJson,
      errorCode: task.errorCode,
      errorMessage: task.errorMessage,
      elapsedMs: task.elapsedMs,
      images: task.images.map((image: any) => ({
        id: image.id,
        storageKey: image.storageKey,
        assetUrl: `/assets/file?key=${encodeURIComponent(image.storageKey)}`,
        format: image.format,
        sizeBytes: image.sizeBytes,
        width: image.width,
        height: image.height,
        prompt: image.prompt,
        revisedPrompt: image.revisedPrompt,
        createdAt: image.createdAt.toISOString(),
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      ...(includeDetails ? { raw: { paramsJson: task.paramsJson, routeJson: task.routeJson, diagnosticsJson: task.diagnosticsJson } } : {}),
    };
  }
}
