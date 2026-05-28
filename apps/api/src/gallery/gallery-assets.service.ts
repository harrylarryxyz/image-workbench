import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';
import { imageWhere } from './gallery-query';
import { serializeImage } from './gallery-serializer';

@Injectable()
export class GalleryAssetsService {
  constructor(private readonly prisma: PrismaService, private readonly audit?: AuditService) {}

  async list(query: any, ctx: RequestContext) {
    const take = Math.min(Math.max(Number(query.take ?? 100), 1), 300);
    const images = await this.prisma.imageAsset.findMany({ orderBy: { createdAt: 'desc' }, take, where: imageWhere(query, ctx.workspaceId), include: { task: true, collectionItems: { include: { collection: true } } } });
    return images.map(serializeImage);
  }

  async detail(id: string, ctx: RequestContext) {
    const image: any = await this.prisma.imageAsset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: { task: true, collectionItems: { include: { collection: true } }, sourceAsset: true, derivatives: { where: { workspaceId: ctx.workspaceId }, take: 12 } } });
    if (!image) throw new NotFoundException('image not found');
    const sourceAsset = (image.sourceAsset as any)?.workspaceId === ctx.workspaceId ? image.sourceAsset : null;
    return { ...serializeImage(image), sourceAsset: sourceAsset ? serializeImage({ ...(sourceAsset as any), collectionItems: [], derivatives: [] }) : null };
  }

  async updateMeta(id: string, body: any, ctx: RequestContext) {
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

  async batchDelete(body: any, ctx: RequestContext) {
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 200) : [];
    if (!ids.length) return { deleted: 0, ids: [] };
    const result = await this.prisma.imageAsset.deleteMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId } });
    await this.audit?.log('gallery.batch_delete', 'image', undefined, { ids, deleted: result.count }, ctx);
    return { deleted: result.count, ids };
  }
}
