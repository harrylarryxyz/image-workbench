import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import archiver from 'archiver';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import { getRequestContext } from '../auth/request-context';
import { LocalStorageService } from '../storage/local-storage.service';

function serializeImage(image: any) {
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
    revisedPrompt: image.revisedPrompt,
    sourceAssetId: image.sourceAssetId,
    taskId: image.taskId,
    taskType: image.task?.type,
    taskStatus: image.task?.status,
    model: image.task?.model,
    params: image.task?.paramsJson,
    favorite: image.favorite,
    rating: image.rating,
    tags: image.tags ?? [],
    collections: image.collectionItems?.map((item: any) => ({ id: item.collection.id, name: item.collection.name })) ?? [],
    derivatives: image.derivatives?.map((child: any) => ({ id: child.id, storageKey: child.storageKey, thumbnailUrl: child.thumbnailKey ? `/assets/file?key=${encodeURIComponent(child.thumbnailKey)}` : `/assets/file?key=${encodeURIComponent(child.storageKey)}` })) ?? [],
    createdAt: image.createdAt.toISOString(),
  };
}

@Controller('gallery')
export class GalleryController {
  constructor(private readonly prisma: PrismaService, private readonly audit?: AuditService, private readonly storage?: LocalStorageService) {}

  private where(query: any, workspaceId: string) {
    const taskWhere: Record<string, string> = {};
    if (query.type) taskWhere.type = String(query.type);
    if (query.status) taskWhere.status = String(query.status);
    if (query.model) taskWhere.model = String(query.model);
    const where: any = { workspaceId };
    if (Object.keys(taskWhere).length) where.task = taskWhere;
    if (query.q) where.OR = [{ prompt: { contains: String(query.q), mode: 'insensitive' } }, { storageKey: { contains: String(query.q), mode: 'insensitive' } }, { task: { prompt: { contains: String(query.q), mode: 'insensitive' } } }];
    if (query.tag) where.tags = { has: String(query.tag) };
    if (query.favorite === '1' || query.favorite === 'true') where.favorite = true;
    if (query.collectionId) where.collectionItems = { some: { collectionId: String(query.collectionId) } };
    return where;
  }

  @Get()
  async list(@Query() query: any = {}, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const take = Math.min(Math.max(Number(query.take ?? 100), 1), 300);
    const images = await this.prisma.imageAsset.findMany({ orderBy: { createdAt: 'desc' }, take, where: this.where(query, ctx.workspaceId), include: { task: true, collectionItems: { include: { collection: true } } } });
    return images.map(serializeImage);
  }

  @Get('collections')
  async collections(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await (this.prisma as any).imageCollection.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, include: { items: { take: 6, include: { image: true } }, _count: { select: { items: true } } } });
    return rows.map((row: any) => ({ id: row.id, name: row.name, description: row.description, count: row._count.items, preview: row.items.map((item: any) => serializeImage({ ...item.image, collectionItems: [], derivatives: [] })), updatedAt: row.updatedAt.toISOString() }));
  }

  @Post('collections')
  async createCollection(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await (this.prisma as any).imageCollection.create({ data: { workspaceId: ctx.workspaceId, name: String(body?.name ?? 'Untitled collection'), description: body?.description ? String(body.description) : null } });
    await this.audit?.log('gallery.collection_create', 'collection', row.id, { name: row.name }, ctx);
    return row;
  }

  @Post('collections/:id/items')
  async addCollectionItems(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const collection = await (this.prisma as any).imageCollection.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!collection) throw new NotFoundException('collection not found');
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 200) : [];
    const images = await this.prisma.imageAsset.findMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId }, select: { id: true } });
    for (const image of images) await (this.prisma as any).imageCollectionItem.upsert({ where: { collectionId_imageId: { collectionId: id, imageId: image.id } }, update: {}, create: { collectionId: id, imageId: image.id } });
    await this.audit?.log('gallery.collection_add_items', 'collection', id, { ids: images.map((x) => x.id) }, ctx);
    return { ok: true, collectionId: id, added: images.length };
  }

  @Delete('collections/:id/items/:imageId')
  async removeCollectionItem(@Param('id') id: string, @Param('imageId') imageId: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const collection = await (this.prisma as any).imageCollection.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!collection) throw new NotFoundException('collection not found');
    await (this.prisma as any).imageCollectionItem.deleteMany({ where: { collectionId: id, imageId } });
    await this.audit?.log('gallery.collection_remove_item', 'collection', id, { imageId }, ctx);
    return { ok: true, collectionId: id, imageId };
  }

  @Get('batch/manifest')
  async manifest(@Query('ids') idsCsv: string, @Req() req: Request = {} as any, @Res() res: Response) {
    const ctx = getRequestContext(req);
    const ids = String(idsCsv ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 200);
    const rows = await this.prisma.imageAsset.findMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId }, include: { task: true } });
    res.setHeader('content-type', 'application/json');
    res.setHeader('content-disposition', 'attachment; filename=gallery-manifest.json');
    res.send(JSON.stringify(rows.map((image) => ({ id: image.id, storageKey: image.storageKey, prompt: image.prompt, taskId: image.taskId, model: image.task?.model })), null, 2));
  }

  @Get('batch/download.zip')
  async batchZip(@Query('ids') idsCsv: string, @Req() req: Request = {} as any, @Res() res: Response) {
    if (!this.storage) throw new Error('storage service unavailable');
    const ctx = getRequestContext(req);
    const ids = String(idsCsv ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 100);
    const rows = await this.prisma.imageAsset.findMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId }, include: { task: true } });
    res.setHeader('content-type', 'application/zip');
    res.setHeader('content-disposition', 'attachment; filename=image-workbench-assets.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (error) => { throw error; });
    archive.pipe(res);
    archive.append(JSON.stringify(rows.map((image) => ({ id: image.id, storageKey: image.storageKey, prompt: image.prompt, taskId: image.taskId, model: image.task?.model })), null, 2), { name: 'manifest.json' });
    for (const image of rows) {
      const bytes = await this.storage.readImage(image.storageKey);
      archive.append(Buffer.from(bytes), { name: `${image.id}.${image.format || 'png'}` });
    }
    await archive.finalize();
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const image = await this.prisma.imageAsset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: { task: true, collectionItems: { include: { collection: true } }, sourceAsset: true, derivatives: { where: { workspaceId: ctx.workspaceId }, take: 12 } } });
    if (!image) throw new NotFoundException('image not found');
    const sourceAsset = image.sourceAsset?.workspaceId === ctx.workspaceId ? image.sourceAsset : null;
    return { ...serializeImage(image), sourceAsset: sourceAsset ? serializeImage({ ...sourceAsset, collectionItems: [], derivatives: [] }) : null };
  }

  @Patch(':id')
  async updateMeta(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    let sourceAssetId: string | null | undefined = undefined;
    if (body?.sourceAssetId !== undefined) {
      sourceAssetId = body.sourceAssetId ? String(body.sourceAssetId) : null;
      if (sourceAssetId) {
        const source = await this.prisma.imageAsset.findFirst({ where: { id: sourceAssetId, workspaceId: ctx.workspaceId }, select: { id: true } });
        if (!source) throw new NotFoundException('source asset not found');
      }
    }
    const result = await this.prisma.imageAsset.updateMany({ where: { id, workspaceId: ctx.workspaceId }, data: {
      favorite: body?.favorite === undefined ? undefined : Boolean(body.favorite),
      rating: body?.rating === undefined ? undefined : Number(body.rating),
      tags: Array.isArray(body?.tags) ? body.tags.map(String).filter(Boolean) : undefined,
      sourceAssetId,
    } });
    await this.audit?.log('gallery.update_meta', 'image', id, { updated: result.count }, ctx);
    return this.prisma.imageAsset.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  }

  @Post('batch/delete')
  async batchDelete(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 200) : [];
    if (!ids.length) return { deleted: 0, ids: [] };
    const result = await this.prisma.imageAsset.deleteMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId } });
    await this.audit?.log('gallery.batch_delete', 'image', undefined, { ids, deleted: result.count }, ctx);
    return { deleted: result.count, ids };
  }
}
