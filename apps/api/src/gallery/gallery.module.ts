import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { PrismaService } from '../prisma.service';

@Module({ controllers: [GalleryController], providers: [PrismaService] })
export class GalleryModule {}
