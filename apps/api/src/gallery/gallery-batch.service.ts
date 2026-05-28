import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import archiver from 'archiver';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import type { RequestContext } from '../auth/request-context';
import { parseIds } from './gallery-query';

@Injectable()
export class GalleryBatchService {
  constructor(private readonly prisma: PrismaService, private readonly storage?: LocalStorageService) {}

  async manifest(idsCsv: string, ctx: RequestContext, res: Response) {
    const ids = parseIds(idsCsv, 200);
    const rows = await this.prisma.imageAsset.findMany({ where: { id: { in: ids }, workspaceId: ctx.workspaceId }, include: { task: true } });
    res.setHeader('content-type', 'application/json');
    res.setHeader('content-disposition', 'attachment; filename=gallery-manifest.json');
    res.send(JSON.stringify(rows.map((image) => ({ id: image.id, storageKey: image.storageKey, prompt: image.prompt, taskId: image.taskId, model: image.task?.model })), null, 2));
  }

  async zip(idsCsv: string, ctx: RequestContext, res: Response) {
    if (!this.storage) throw new Error('storage service unavailable');
    const ids = parseIds(idsCsv, 100);
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
}
