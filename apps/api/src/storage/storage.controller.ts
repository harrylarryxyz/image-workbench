import { Controller, Get, NotFoundException, Post, Query, Req, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { PrismaService } from '../prisma.service';
import { getRequestContext } from '../auth/request-context';
import { LocalStorageService } from './local-storage.service';

@Controller('assets')
export class StorageController {
  constructor(private readonly storage: LocalStorageService, private readonly prisma: PrismaService) {}

  @Get('file')
  async getAsset(@Query('key') key: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const linkedAsset = await this.prisma.imageAsset.findFirst({ where: { workspaceId: ctx.workspaceId, OR: [{ storageKey: key }, { thumbnailKey: key }] }, select: { id: true } });
    const parsedKey = String(key ?? '').replace(/^local:\/\//, '');
    const workspaceUpload = parsedKey.startsWith(`uploads/${ctx.workspaceId}/`) || parsedKey.startsWith(`thumbs/uploads/${ctx.workspaceId}/`);
    if (!linkedAsset && !workspaceUpload) throw new NotFoundException('asset not found');
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
}
