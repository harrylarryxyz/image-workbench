import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CanvasProjectsController } from './canvas-projects.controller';
import { CanvasProjectsService } from './canvas-projects.service';
import { CanvasRunsService } from './canvas-runs.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({ imports: [TasksModule], controllers: [CanvasProjectsController], providers: [CanvasProjectsService, CanvasRunsService, PrismaService] })
export class CanvasModule {}
