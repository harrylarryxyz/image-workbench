import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PrismaService } from '../prisma.service';

@Module({ controllers: [PromptsController], providers: [PromptsService, PrismaService] })
export class PromptsModule {}
