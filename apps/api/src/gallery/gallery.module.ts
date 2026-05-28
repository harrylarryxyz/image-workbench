import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryAssetsService } from './gallery-assets.service';
import { GalleryBatchService } from './gallery-batch.service';
import { GalleryCollectionsService } from './gallery-collections.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [StorageModule], controllers: [GalleryController], providers: [GalleryAssetsService, GalleryBatchService, GalleryCollectionsService, PrismaService, AuditService] })
export class GalleryModule {}
