import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestContext } from '../auth/request-context';
import { GalleryAssetsService } from './gallery-assets.service';
import { GalleryBatchService } from './gallery-batch.service';
import { GalleryCollectionsService } from './gallery-collections.service';

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly assets: GalleryAssetsService,
    private readonly collectionsService: GalleryCollectionsService,
    private readonly batch: GalleryBatchService,
  ) {}

  @Get()
  async list(@Query() query: any = {}, @Req() req: Request = {} as any) {
    return this.assets.list(query, getRequestContext(req));
  }

  @Get('collections')
  async collections(@Req() req: Request = {} as any) {
    return this.collectionsService.list(getRequestContext(req));
  }

  @Post('collections')
  async createCollection(@Body() body: any, @Req() req: Request = {} as any) {
    return this.collectionsService.create(body, getRequestContext(req));
  }

  @Post('collections/:id/items')
  async addCollectionItems(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    return this.collectionsService.addItems(id, body, getRequestContext(req));
  }

  @Delete('collections/:id/items/:imageId')
  async removeCollectionItem(@Param('id') id: string, @Param('imageId') imageId: string, @Req() req: Request = {} as any) {
    return this.collectionsService.removeItem(id, imageId, getRequestContext(req));
  }

  @Get('batch/manifest')
  async manifest(@Query('ids') idsCsv: string, @Req() req: Request = {} as any, @Res() res: Response) {
    return this.batch.manifest(idsCsv, getRequestContext(req), res);
  }

  @Get('batch/download.zip')
  async batchZip(@Query('ids') idsCsv: string, @Req() req: Request = {} as any, @Res() res: Response) {
    return this.batch.zip(idsCsv, getRequestContext(req), res);
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.assets.detail(id, getRequestContext(req));
  }

  @Patch(':id')
  async updateMeta(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    return this.assets.updateMeta(id, body, getRequestContext(req));
  }

  @Post('batch/delete')
  async batchDelete(@Body() body: any, @Req() req: Request = {} as any) {
    return this.assets.batchDelete(body, getRequestContext(req));
  }
}
