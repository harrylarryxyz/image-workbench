import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../auth/audit.service';

@Module({ controllers: [ProvidersController], providers: [ProvidersService, PrismaService, AuditService], exports: [ProvidersService] })
export class ProvidersModule {}
