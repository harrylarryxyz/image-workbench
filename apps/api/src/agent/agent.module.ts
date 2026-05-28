import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { PrismaService } from '../prisma.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({ imports: [TasksModule], controllers: [AgentController], providers: [PrismaService] })
export class AgentModule {}
