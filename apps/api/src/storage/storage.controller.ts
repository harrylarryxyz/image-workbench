import { Controller, Get, NotFoundException, Query, StreamableFile } from '@nestjs/common';
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
}
