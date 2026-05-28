import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly prisma: PrismaService, private readonly audit?: AuditService) {}

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
        favorite: image.favorite,
        rating: image.rating,
        tags: image.tags,
        createdAt: image.createdAt.toISOString(),
      };
    });
  }

  @Get('batch/manifest')
  async manifest(@Query('ids') idsCsv: string, @Res() res: Response) {
    const ids = String(idsCsv ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 200);
    const rows = await this.prisma.imageAsset.findMany({ where: { id: { in: ids } }, include: { task: true } });
    res.setHeader('content-type', 'application/json');
    res.setHeader('content-disposition', 'attachment; filename=gallery-manifest.json');
    res.send(JSON.stringify(rows.map((image) => ({ id: image.id, storageKey: image.storageKey, prompt: image.prompt, taskId: image.taskId, model: image.task?.model })), null, 2));
  }

  @Patch(':id')
  async updateMeta(@Param('id') id: string, @Body() body: any) {
    const row = await this.prisma.imageAsset.update({ where: { id }, data: {
      favorite: body?.favorite === undefined ? undefined : Boolean(body.favorite),
      rating: body?.rating === undefined ? undefined : Number(body.rating),
      tags: Array.isArray(body?.tags) ? body.tags.map(String).filter(Boolean) : undefined,
    } });
    await this.audit?.log('gallery.update_meta', 'image', id);
    return row;
  }

  @Post('batch/delete')
  async batchDelete(@Body() body: any) {
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 200) : [];
    if (!ids.length) return { deleted: 0, ids: [] };
    const result = await this.prisma.imageAsset.deleteMany({ where: { id: { in: ids } } });
    await this.audit?.log('gallery.batch_delete', 'image', undefined, { ids, deleted: result.count });
    return { deleted: result.count, ids };
  }
}
