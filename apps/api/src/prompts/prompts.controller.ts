import { randomUUID } from 'node:crypto';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { getRequestContext } from '../auth/request-context';

function renderTemplate(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\[([a-zA-Z0-9_-]+)\]/g, (_, key) => String(variables[key] ?? `[${key}]`));
}

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

function serialize(row: any) {
  return { id: row.id, title: row.title, content: row.content, tags: row.tags, source: row.source, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt, updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt };
}

@Controller('prompts')
export class PromptsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('tag') tag: string | undefined, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.promptPreset.findMany({ orderBy: { updatedAt: 'desc' }, take: 200, where: { workspaceId: ctx.workspaceId, ...(tag ? { tags: { has: tag } } : {}) } });
    return rows.map(serialize);
  }

  @Post()
  async create(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '').trim();
    if (!title) throw new BadRequestException('title is required');
    if (!content) throw new BadRequestException('content is required');
    const row = await this.prisma.promptPreset.create({ data: { title, content, tags: parseTags(body?.tags), source: body?.source ? String(body.source) : 'manual', workspaceId: ctx.workspaceId } });
    return serialize(row);
  }

  @Get('history')
  async history(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.generationTask.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 80, select: { id: true, prompt: true, model: true, status: true, createdAt: true } });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const current = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!current) throw new BadRequestException('prompt not found');
    const nextVersion = (current.versions[0]?.version ?? 0) + 1;
    await this.prisma.promptVersion.create({ data: { promptId: id, version: nextVersion, title: current.title, content: current.content, tags: current.tags } });
    const row = await this.prisma.promptPreset.update({ where: { id }, data: { title: body?.title !== undefined ? String(body.title).trim() : current.title, content: body?.content !== undefined ? String(body.content).trim() : current.content, tags: body?.tags !== undefined ? parseTags(body.tags) : current.tags } });
    return { ...serialize(row), version: nextVersion + 1 };
  }

  @Get(':id/versions')
  async versions(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const prompt = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId }, select: { id: true } });
    if (!prompt) throw new BadRequestException('prompt not found');
    const rows = await this.prisma.promptVersion.findMany({ where: { promptId: id }, orderBy: { version: 'desc' }, take: 50 });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  @Post(':id/render')
  async render(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.promptPreset.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!row) throw new BadRequestException('prompt not found');
    return { prompt: renderTemplate(row.content, body?.variables ?? {}), source: 'template-render', id };
  }

  @Post('from-task/:taskId')
  async fromTask(@Param('taskId') taskId: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const task = await this.prisma.generationTask.findFirst({ where: { id: taskId, workspaceId: ctx.workspaceId } });
    if (!task) throw new BadRequestException('task not found');
    const row = await this.prisma.promptPreset.create({ data: { title: `Task ${task.id.slice(0, 8)}`, content: task.prompt, tags: ['task-history', task.model], source: `task:${task.id}`, workspaceId: ctx.workspaceId } });
    return serialize(row);
  }

  @Post('enhance')
  enhance(@Body() body: any) {
    const subject = String(body?.subject ?? body?.prompt ?? '').trim();
    const style = String(body?.style ?? '').trim();
    if (!subject) throw new BadRequestException('subject or prompt is required');
    const styleLine = style ? `${style}, ` : '';
    return { prompt: `${styleLine}${subject}, clear subject, coherent composition, refined lighting, high detail, professional image generation prompt, no extra text`, source: 'local-enhancer' };
  }

  @Post('seed')
  async seed(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const templates = [
      { title: 'Studio Ghibli-inspired warm illustration', content: 'A warm hand-painted illustration of [subject], soft natural light, cozy atmosphere, lush environment, gentle color palette, whimsical but grounded, no text', tags: ['style', 'illustration', 'warm'], source: 'seed' },
      { title: 'Icon / App 图标', content: 'A clean minimal app icon of [subject], centered, simple geometric shapes, soft gradient background, high contrast, no text, polished vector style', tags: ['icon', 'app', 'minimal'], source: 'seed' },
      { title: 'Cyberpunk 场景', content: 'A cinematic cyberpunk scene of [subject], rainy night, neon reflections, volumetric fog, detailed background, dramatic rim lighting, high detail, no extra text', tags: ['cyberpunk', 'scene', 'cinematic'], source: 'seed' },
      { title: '产品海报', content: 'A premium product poster for [product], studio lighting, elegant composition, clean background, realistic materials, subtle shadows, advertising photography style, no extra text', tags: ['poster', 'product', 'ad'], source: 'seed' },
      { title: '角色设定', content: 'A full-body character concept art of [character], distinctive silhouette, expressive pose, detailed outfit, coherent color palette, clean background, professional game concept art', tags: ['character', 'concept'], source: 'seed' },
    ];
    const created = [];
    for (const item of templates) {
      const existing = await this.prisma.promptPreset.findFirst({ where: { title: item.title, source: 'seed', workspaceId: ctx.workspaceId } });
      if (existing) continue;
      created.push(await this.prisma.promptPreset.create({ data: { ...item, workspaceId: ctx.workspaceId, id: randomUUID() } }));
    }
    return { created: created.length };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const result = await this.prisma.promptPreset.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
    return { ok: result.count === 1 };
  }
}
