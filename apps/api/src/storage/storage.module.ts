import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';

@Module({ controllers: [StorageController], providers: [LocalStorageService, PrismaService], exports: [LocalStorageService] })
export class StorageModule {}
