import { Controller, Get, NotFoundException, Post, Query, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { LocalStorageService } from './local-storage.service';

@Controller('assets')
export class StorageController {
  constructor(private readonly storage: LocalStorageService) {}

  @Get('file')
  async getAsset(@Query('key') key: string) {
    const file = await this.storage.resolveExistingPath(key);
    if (!file) throw new NotFoundException('asset not found');
    const ext = extname(file).toLowerCase();
    const type = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    return new StreamableFile(createReadStream(file), { type });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: any) {
    if (!file?.buffer) throw new Error('file is required');
    const saved = await this.storage.putImage(file.buffer);
    return { ...saved, assetUrl: `/assets/file?key=${encodeURIComponent(saved.storageKey)}`, originalName: file.originalname, mimeType: file.mimetype };
  }
}
