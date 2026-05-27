import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PrismaService } from '../prisma.service';

@Module({ controllers: [PromptsController], providers: [PrismaService] })
export class PromptsModule {}
