import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { GenerateImageRequestSchema, type GenerateImageRequest } from '../lib/shared';

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
    return { id: task.id, status: task.status.toLowerCase() };
  }

  async listRecent() {
    const rows = await this.prisma.generationTask.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { images: true } });
    return rows.map((task) => ({
      id: task.id,
      status: task.status.toLowerCase(),
      prompt: task.prompt,
      model: task.model,
      route: task.routeJson,
      error: task.errorMessage,
      images: task.images.map((image) => ({ id: image.id, storageKey: image.storageKey, format: image.format, sizeBytes: image.sizeBytes })),
      createdAt: task.createdAt.toISOString(),
    }));
  }

  async getTask(id: string) {
    return this.prisma.generationTask.findUnique({ where: { id }, include: { images: true, provider: true } });
  }
}
