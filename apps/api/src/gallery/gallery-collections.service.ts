import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';
import { serializeImage } from './gallery-serializer';
import { bodyIds } from './gallery-query';

@Injectable()
export class GalleryCollectionsService {
  constructor(private readonly prisma: PrismaService, private readonly audit?: AuditService) {}

  async list(ctx: RequestContext) {
    const rows = await (this.prisma as any).imageCollection.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, include: { items: { take: 6, include: { image: true } }, _count: { select: { items: true } } } });
    return rows.map((row: any) => ({ id: row.id, name: row.name, description: row.description, count: row._count.items, preview: row.items.map((item: any) => serializeImage({ ...item.image, collectionItems: [], derivatives: [] })), updatedAt: row.updatedAt.toISOString() }));
  }

  async create(body: any, ctx: RequestContext) {
    const row = await (this.prisma as any).imageCollection.create({ data: { workspaceId: ctx.workspaceId, name: String(body?.name ?? 'Untitled collection'), description: body?.description ? String(body.description) : null } });
    await this.audit?.log('gallery.collection_create', 'collection', row.id, { name: row.name }, ctx);
    return row;
  }

  async addItems(id: string, body: any, ctx: RequestContext) {
    const collection = await (this.prisma as any).imageCollection.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!collection) throw new NotFoundException('collection not found');
    const ids = bodyIds(body, 200);
    const images = await this.prisma.imageAsset.findMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId }, select: { id: true } });
    for (const image of images) await (this.prisma as any).imageCollectionItem.upsert({ where: { collectionId_imageId: { collectionId: id, imageId: image.id } }, update: {}, create: { collectionId: id, imageId: image.id } });
    await this.audit?.log('gallery.collection_add_items', 'collection', id, { ids: images.map((x) => x.id) }, ctx);
    return { ok: true, collectionId: id, added: images.length };
  }

  async removeItem(id: string, imageId: string, ctx: RequestContext) {
    const collection = await (this.prisma as any).imageCollection.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!collection) throw new NotFoundException('collection not found');
    await (this.prisma as any).imageCollectionItem.deleteMany({ where: { collectionId: id, imageId } });
    await this.audit?.log('gallery.collection_remove_item', 'collection', id, { imageId }, ctx);
    return { ok: true, collectionId: id, imageId };
  }
}
