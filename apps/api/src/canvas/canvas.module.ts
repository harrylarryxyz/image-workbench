import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CanvasProjectsController } from './canvas-projects.controller';

@Module({ controllers: [CanvasProjectsController], providers: [PrismaService] })
export class CanvasModule {}
