import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { RequestContext } from '../auth/request-context';
import { PROMPT_SEEDS } from './prompt-seeds';
import { serializePrompt } from './prompt-serializer';
import { enhancePrompt, parseTags, renderTemplate } from './prompt-template';

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tag: string | undefined, ctx: RequestContext) {
    const rows = await this.prisma.promptPreset.findMany({ orderBy: { updatedAt: 'desc' }, take: 200, where: { workspaceId: ctx.workspaceId, ...(tag ? { tags: { has: tag } } : {}) } });
    return rows.map(serializePrompt);
  }

  async create(body: any, ctx: RequestContext) {
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '').trim();
    if (!title) throw new BadRequestException('title is required');
    if (!content) throw new BadRequestException('content is required');
    const row = await this.prisma.promptPreset.create({ data: { title, content, tags: parseTags(body?.tags), source: body?.source ? String(body.source) : 'manual', workspaceId: ctx.workspaceId } });
    return serializePrompt(row);
  }

  async history(ctx: RequestContext) {
    const rows = await this.prisma.generationTask.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 80, select: { id: true, prompt: true, model: true, status: true, createdAt: true } });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  async update(id: string, body: any, ctx: RequestContext) {
    const current = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!current) throw new BadRequestException('prompt not found');
    const nextVersion = (current.versions[0]?.version ?? 0) + 1;
    await this.prisma.promptVersion.create({ data: { promptId: id, version: nextVersion, title: current.title, content: current.content, tags: current.tags } });
    const row = await this.prisma.promptPreset.update({ where: { id }, data: { title: body?.title !== undefined ? String(body.title).trim() : current.title, content: body?.content !== undefined ? String(body.content).trim() : current.content, tags: body?.tags !== undefined ? parseTags(body.tags) : current.tags } });
    return { ...serializePrompt(row), version: nextVersion + 1 };
  }

  async versions(id: string, ctx: RequestContext) {
    const prompt = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, select: { id: true } });
    if (!prompt) throw new BadRequestException('prompt not found');
    const rows = await this.prisma.promptVersion.findMany({ where: { promptId: id }, orderBy: { version: 'desc' }, take: 50 });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  async render(id: string, body: any, ctx: RequestContext) {
    const row = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!row) throw new BadRequestException('prompt not found');
    return { prompt: renderTemplate(row.content, body?.variables ?? {}), source: 'template-render', id };
  }

  async fromTask(taskId: string, ctx: RequestContext) {
    const task = await this.prisma.generationTask.findFirst({ where: { id: taskId, workspaceId: ctx.workspaceId } });
    if (!task) throw new BadRequestException('task not found');
    const row = await this.prisma.promptPreset.create({ data: { title: `Task ${task.id.slice(0, 8)}`, content: task.prompt, tags: ['task-history', task.model], source: `task:${task.id}`, workspaceId: ctx.workspaceId } });
    return serializePrompt(row);
  }

  enhance(body: any) {
    const prompt = enhancePrompt(body);
    if (!prompt) throw new BadRequestException('subject or prompt is required');
    return { prompt, source: 'local-enhancer' };
  }

  async seed(ctx: RequestContext) {
    const created = [];
    for (const item of PROMPT_SEEDS) {
      const existing = await this.prisma.promptPreset.findFirst({ where: { title: item.title, source: 'seed', workspaceId: ctx.workspaceId } });
      if (existing) continue;
      created.push(await this.prisma.promptPreset.create({ data: { ...item, workspaceId: ctx.workspaceId, id: randomUUID() } }));
    }
    return { created: created.length };
  }

  async remove(id: string, ctx: RequestContext) {
    const result = await this.prisma.promptPreset.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
    return { ok: result.count === 1 };
  }
}
