import { Controller, Get, NotFoundException, Post, Query, Req, Res, StreamableFile, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { PrismaService } from '../prisma.service';
import { getRequestContext } from '../auth/request-context';
import { LocalStorageService } from './local-storage.service';

function workspaceObjectPath(storageKey: string, defaultBucket?: string) {
  const value = String(storageKey ?? '');
  const match = value.match(/^(local|s3|r2|minio):\/\/(.*)$/);
  if (!match) return value;
  if (match[1] === 'local') return match[2];
  const [bucket, ...parts] = match[2].split('/');
  if (defaultBucket && bucket && bucket !== defaultBucket) return match[2];
  return parts.join('/');
}

@Controller('assets')
export class StorageController {
  constructor(private readonly storage: LocalStorageService, private readonly prisma: PrismaService) {}

  @Get('file')
  async getAsset(@Query('key') key: string, @Req() req: Request = {} as any, @Res({ passthrough: true }) res?: Response) {
    const ctx = getRequestContext(req);
    const linkedAsset = await this.prisma.imageAsset.findFirst({ where: { workspaceId: ctx.workspaceId, OR: [{ storageKey: key }, { thumbnailKey: key }] }, select: { id: true } });
    const parsedKey = workspaceObjectPath(key, this.storage.bucket);
    const workspaceUpload = parsedKey.startsWith(`uploads/${ctx.workspaceId}/`) || parsedKey.startsWith(`thumbs/uploads/${ctx.workspaceId}/`);
    if (!linkedAsset && !workspaceUpload) throw new NotFoundException('asset not found');
    if (!String(key ?? '').startsWith('local://') && this.storage.backend !== 'local') {
      const url = await this.storage.signedUrl(key, 300);
      if (/^https?:\/\//.test(url)) {
        res?.redirect(302, url);
        return;
      }
    }
    const file = await this.storage.resolveExistingPath(key);
    if (!file) throw new NotFoundException('asset not found');
    const ext = extname(file).toLowerCase();
    const type = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    return new StreamableFile(createReadStream(file), { type });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    if (!file?.buffer) throw new Error('file is required');
    const saved = await this.storage.putImage(file.buffer, `uploads/${ctx.workspaceId}`);
    return { ...saved, assetUrl: this.storage.publicUrl(saved.storageKey), originalName: file.originalname, mimeType: file.mimetype };
  }

  @Post('upload/batch')
  @UseInterceptors(FilesInterceptor('files', 20, { limits: { fileSize: 20 * 1024 * 1024, files: 20 } }))
  async uploadBatch(@UploadedFiles() files: any[] = [], @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = [];
    for (const file of files) {
      if (!file?.buffer) continue;
      const saved = await this.storage.putImage(file.buffer, `uploads/${ctx.workspaceId}`);
      rows.push({ ...saved, assetUrl: this.storage.publicUrl(saved.storageKey), originalName: file.originalname, mimeType: file.mimetype });
    }
    return { count: rows.length, assets: rows };
  }

  @Get('status')
  async status(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const aggregate = await this.prisma.imageAsset.aggregate({ where: { workspaceId: ctx.workspaceId }, _count: { id: true }, _sum: { sizeBytes: true } });
    const localCount = await this.prisma.imageAsset.count({ where: { workspaceId: ctx.workspaceId, storageKey: { startsWith: 'local://' } } });
    return {
      backend: this.storage.backend,
      remoteConfigured: this.storage.backend !== 'local' ? Boolean((this.storage as any).s3 || this.storage.publicBaseUrl) : false,
      images: aggregate._count.id,
      localImages: localCount,
      sizeBytes: aggregate._sum.sizeBytes ?? 0,
    };
  }

  @Post('migration/local-to-remote')
  async migration(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const localImages = await this.prisma.imageAsset.count({ where: { workspaceId: ctx.workspaceId, storageKey: { startsWith: 'local://' } } });
    return {
      ok: true,
      dryRun: true,
      backend: this.storage.backend,
      migratable: this.storage.backend === 'local' ? 0 : localImages,
      message: this.storage.backend === 'local' ? 'remote backend is not selected' : 'run pnpm assets:migrate-remote from a maintenance shell to copy bytes and update keys',
    };
  }
}
