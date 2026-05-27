import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: any = {}) {
    const taskWhere: Record<string, string> = {};
    if (query.type) taskWhere.type = String(query.type);
    if (query.status) taskWhere.status = String(query.status);
    if (query.model) taskWhere.model = String(query.model);
    const where = Object.keys(taskWhere).length ? { task: taskWhere } : undefined;
    const images = await this.prisma.imageAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 100, where, include: { task: true } });
    return images.map((image) => {
      const assetUrl = `/assets/file?key=${encodeURIComponent(image.storageKey)}`;
      return {
        id: image.id,
        storageKey: image.storageKey,
        assetUrl,
        thumbnailUrl: image.thumbnailKey ? `/assets/file?key=${encodeURIComponent(image.thumbnailKey)}` : assetUrl,
        format: image.format,
        sizeBytes: image.sizeBytes,
        width: image.width,
        height: image.height,
        prompt: image.prompt,
        taskId: image.taskId,
        taskType: image.task?.type,
        taskStatus: image.task?.status,
        model: image.task?.model,
        params: image.task?.paramsJson,
        createdAt: image.createdAt.toISOString(),
      };
    });
  }
}
