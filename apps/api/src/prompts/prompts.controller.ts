import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';


function renderTemplate(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\[([a-zA-Z0-9_-]+)\]/g, (_, key) => String(variables[key] ?? `[${key}]`));
}

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

@Controller('prompts')
export class PromptsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('tag') tag?: string) {
    const rows = await this.prisma.promptPreset.findMany({ orderBy: { updatedAt: 'desc' }, take: 200, where: tag ? { tags: { has: tag } } : undefined });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  @Post()
  async create(@Body() body: any) {
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '').trim();
    if (!title) throw new BadRequestException('title is required');
    if (!content) throw new BadRequestException('content is required');
    const row = await this.prisma.promptPreset.create({
      data: {
        title,
        content,
        tags: parseTags(body?.tags),
        source: body?.source ? String(body.source) : 'manual',
      },
    });
    return { id: row.id, title: row.title, content: row.content, tags: row.tags, source: row.source, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  }

  @Get('history')
  async history() {
    const rows = await this.prisma.generationTask.findMany({ orderBy: { createdAt: 'desc' }, take: 80, select: { id: true, prompt: true, model: true, status: true, createdAt: true } });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const current = await this.prisma.promptPreset.findUnique({ where: { id }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!current) throw new BadRequestException('prompt not found');
    const nextVersion = (current.versions[0]?.version ?? 0) + 1;
    await this.prisma.promptVersion.create({ data: { promptId: id, version: nextVersion, title: current.title, content: current.content, tags: current.tags } });
    const row = await this.prisma.promptPreset.update({ where: { id }, data: {
      title: body?.title !== undefined ? String(body.title).trim() : current.title,
      content: body?.content !== undefined ? String(body.content).trim() : current.content,
      tags: body?.tags !== undefined ? parseTags(body.tags) : current.tags,
    } });
    return { id: row.id, title: row.title, content: row.content, tags: row.tags, source: row.source, version: nextVersion + 1, updatedAt: row.updatedAt.toISOString() };
  }

  @Get(':id/versions')
  async versions(@Param('id') id: string) {
    const rows = await this.prisma.promptVersion.findMany({ where: { promptId: id }, orderBy: { version: 'desc' }, take: 50 });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  @Post(':id/render')
  async render(@Param('id') id: string, @Body() body: any) {
    const row = await this.prisma.promptPreset.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('prompt not found');
    return { prompt: renderTemplate(row.content, body?.variables ?? {}), source: 'template-render', id };
  }

  @Post('enhance')
  enhance(@Body() body: any) {
    const subject = String(body?.subject ?? body?.prompt ?? '').trim();
    const style = String(body?.style ?? '').trim();
    if (!subject) throw new BadRequestException('subject or prompt is required');
    const styleLine = style ? `${style}, ` : '';
    return {
      prompt: `${styleLine}${subject}, clear subject, coherent composition, refined lighting, high detail, professional image generation prompt, no extra text`,
      source: 'local-enhancer',
    };
  }

  @Post('seed')
  async seed() {
    const templates = [
      {
        title: 'Studio Ghibli-inspired warm illustration',
        content: 'A warm hand-painted illustration of [subject], soft natural light, cozy atmosphere, lush environment, gentle color palette, whimsical but grounded, no text',
        tags: ['style', 'illustration', 'warm'],
        source: 'seed',
      },
      {
        title: 'Icon / App 图标',
        content: 'A clean minimal app icon of [subject], centered, simple geometric shapes, soft gradient background, high contrast, no text, polished vector style',
        tags: ['icon', 'app', 'minimal'],
        source: 'seed',
      },
      {
        title: 'Cyberpunk 场景',
        content: 'A cinematic cyberpunk scene of [subject], rainy night, neon reflections, volumetric fog, detailed background, dramatic rim lighting, high detail, no extra text',
        tags: ['cyberpunk', 'scene', 'cinematic'],
        source: 'seed',
      },
      {
        title: '产品海报',
        content: 'A premium product poster for [product], studio lighting, elegant composition, clean background, realistic materials, subtle shadows, advertising photography style, no extra text',
        tags: ['poster', 'product', 'ad'],
        source: 'seed',
      },
      {
        title: '角色设定',
        content: 'A full-body character concept art of [character], distinctive silhouette, expressive pose, detailed outfit, coherent color palette, clean background, professional game concept art',
        tags: ['character', 'concept'],
        source: 'seed',
      },
    ];
    const created = [];
    for (const item of templates) {
      const existing = await this.prisma.promptPreset.findFirst({ where: { title: item.title, source: 'seed' } });
      if (existing) continue;
      created.push(await this.prisma.promptPreset.create({ data: item }));
    }
    return { created: created.length };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.promptPreset.delete({ where: { id } });
    return { ok: true };
  }
}
