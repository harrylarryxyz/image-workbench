import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [StorageModule], controllers: [GalleryController], providers: [PrismaService, AuditService] })
export class GalleryModule {}
