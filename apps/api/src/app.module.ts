import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ProvidersModule } from './providers/providers.module';
import { TasksModule } from './tasks/tasks.module';
import { GalleryModule } from './gallery/gallery.module';
import { StorageModule } from './storage/storage.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { PromptsModule } from './prompts/prompts.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ connection: { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379) } }),
    ProvidersModule,
    TasksModule,
    GalleryModule,
    StorageModule,
    DiagnosticsModule,
    PromptsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
