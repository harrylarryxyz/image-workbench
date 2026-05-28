import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ProvidersModule } from './providers/providers.module';
import { TasksModule } from './tasks/tasks.module';
import { GalleryModule } from './gallery/gallery.module';
import { StorageModule } from './storage/storage.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { PromptsModule } from './prompts/prompts.module';
import { CanvasModule } from './canvas/canvas.module';
import { PrismaService } from './prisma.service';
import { AdminTokenGuard } from './auth/admin-token.guard';
import { AuditService } from './auth/audit.service';
import { AuditLogsController } from './auth/audit-logs.controller';
import { WorkspacesController } from './auth/workspaces.controller';
import { AuthController } from './auth/auth.controller';
import { OpsController } from './ops.controller';
import { HealthController } from './health.controller';
import { LocalStorageService } from './storage/local-storage.service';
import { AgentModule } from './agent/agent.module';

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
    CanvasModule,
    AgentModule,
  ],
  controllers: [AuditLogsController, WorkspacesController, AuthController, OpsController, HealthController],
  providers: [PrismaService, AuditService, LocalStorageService, { provide: APP_GUARD, useClass: AdminTokenGuard }],
})
export class AppModule {}
