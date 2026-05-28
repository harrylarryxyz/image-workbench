import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { GenerateImageRequestSchema } from '../lib/shared';
import { ImageReferenceService } from './image-reference.service';
import { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/request-context';
import { TaskQueueService } from './task-queue.service';

@Injectable()
export class TaskCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    private readonly queue: TaskQueueService,
    private readonly refs: ImageReferenceService,
    private readonly audit?: AuditService,
  ) {}

  async createGenerateTask(input: unknown, ctx?: RequestContext) {
    const request = GenerateImageRequestSchema.parse(input);
    const provider = await this.providers.getDefault(ctx);
    const model = request.model || provider.defaultModel;
    const task = await this.prisma.generationTask.create({
      data: {
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: request,
        status: 'QUEUED',
        workspaceId: ctx?.workspaceId,
      },
    });
    await this.queue.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model }, ctx);
    return { id: task.id, status: task.status };
  }

  async createEditTask(input: any, ctx?: RequestContext) {
    const request = GenerateImageRequestSchema.parse(input);
    const refKeys = await this.refs.assertExistingStorageKeys(Array.isArray(input?.refKeys) ? input.refKeys.map(String) : [], ctx);
    const maskKey = typeof input?.maskKey === 'string' && input.maskKey.trim() ? (await this.refs.assertExistingStorageKeys([input.maskKey], ctx))[0] : undefined;
    const provider = await this.providers.getDefault(ctx);
    const model = request.model || provider.defaultModel;
    const maskMode = input?.maskMode === 'provider-transparent-edit' ? 'provider-transparent-edit' : input?.maskMode === 'painted-area' ? 'painted-area' : undefined;
    const params = { ...request, refKeys, maskKey, maskMode, editMode: 'reference' };
    const task = await this.prisma.generationTask.create({
      data: {
        type: 'image.edit',
        providerId: provider.id,
        model,
        prompt: request.prompt,
        paramsJson: params,
        status: 'QUEUED',
        workspaceId: ctx?.workspaceId,
      },
    });
    await this.queue.enqueueTask(task.id);
    await this.audit?.log('task.create', 'task', task.id, { type: task.type, model, refCount: refKeys.length }, ctx);
    return { id: task.id, status: task.status, type: task.type };
  }
}
