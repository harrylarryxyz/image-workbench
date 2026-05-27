import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';

@Module({ controllers: [StorageController], providers: [LocalStorageService], exports: [LocalStorageService] })
export class StorageModule {}
