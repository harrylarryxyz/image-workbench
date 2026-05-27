import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LocalStorageService } from './local-storage.service';

@Controller('assets')
export class StorageController {
  constructor(private readonly storage: LocalStorageService) {}

  @Get('*key')
  async getAsset(@Param('key') key: string[] | string, @Res() res: Response) {
    const joined = Array.isArray(key) ? key.join('/') : key;
    const file = await this.storage.resolveExistingPath(joined);
    if (!file) throw new NotFoundException('asset not found');
    return res.sendFile(file);
  }
}
