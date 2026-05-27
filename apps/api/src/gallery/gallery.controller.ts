import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const images = await this.prisma.imageAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { task: true } });
    return images.map((image) => ({
      id: image.id,
      storageKey: image.storageKey,
      assetUrl: `/assets/file?key=${encodeURIComponent(image.storageKey)}`,
      format: image.format,
      sizeBytes: image.sizeBytes,
      prompt: image.prompt,
      taskId: image.taskId,
      createdAt: image.createdAt.toISOString(),
    }));
  }
}
