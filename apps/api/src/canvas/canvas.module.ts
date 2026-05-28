import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CanvasProjectsController } from './canvas-projects.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({ imports: [TasksModule], controllers: [CanvasProjectsController], providers: [PrismaService] })
export class CanvasModule {}
