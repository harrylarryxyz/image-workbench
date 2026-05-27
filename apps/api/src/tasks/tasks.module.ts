import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ImageGenerationProcessor } from './image-generation.processor';
import { TaskEventsService } from './task-events.service';
import { PrismaService } from '../prisma.service';
import { ProvidersModule } from '../providers/providers.module';
import { StorageModule } from '../storage/storage.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'image-generation' }), ProvidersModule, StorageModule, DiagnosticsModule],
  controllers: [TasksController],
  providers: [TasksService, TaskEventsService, ImageGenerationProcessor, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
