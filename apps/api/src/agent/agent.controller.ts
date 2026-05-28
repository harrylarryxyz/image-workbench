import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getRequestContext } from '../auth/request-context';

function variants(prompt: string) {
  const base = prompt.trim() || 'A refined product image concept';
  return [
    { title: 'Cinematic polish', content: `${base}, cinematic lighting, strong silhouette, premium art direction, detailed background, coherent composition` },
    { title: 'Editorial clean', content: `${base}, editorial design, clean negative space, refined color palette, crisp details, commercial photography style` },
    { title: 'Exploratory surreal', content: `${base}, imaginative surreal twist, layered depth, unexpected material contrast, gallery-quality finish` },
  ];
}

async function providerVariants(prompt: string): Promise<Array<{ title: string; content: string }> | null> {
  const baseUrl = process.env.AGENT_LLM_BASE_URL;
  const apiKey = process.env.AGENT_LLM_API_KEY;
  if (!baseUrl || !apiKey) return null;
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AGENT_LLM_MODEL ?? 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'Return only compact JSON: {"variants":[{"title":"...","content":"..."}]}. Create three high-quality image-generation prompt variants.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const text = String(json?.choices?.[0]?.message?.content ?? '').trim();
    const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
    return Array.isArray(parsed?.variants) ? parsed.variants.slice(0, 3).filter((x: any) => x?.content).map((x: any, index: number) => ({ title: String(x.title ?? `Provider variant ${index + 1}`), content: String(x.content) })) : null;
  } catch {
    return null;
  }
}

@Controller('agent')
export class AgentController {
  constructor(private readonly prisma: PrismaService, private readonly tasks?: TasksService) {}

  @Get('suggestions')
  async list(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await (this.prisma as any).agentSuggestion.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 80 });
    return rows.map((row: any) => ({ ...row, createdAt: row.createdAt.toISOString(), appliedAt: row.appliedAt?.toISOString?.() ?? null }));
  }

  @Post('prompt-variants')
  async promptVariants(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = [];
    const source = await providerVariants(String(body?.prompt ?? ''));
    for (const item of source ?? variants(String(body?.prompt ?? ''))) {
      rows.push(await (this.prisma as any).agentSuggestion.create({ data: { workspaceId: ctx.workspaceId, sourceType: 'prompt', sourceId: body?.sourceId ? String(body.sourceId) : null, kind: 'prompt.variant', title: item.title, content: item.content, payloadJson: { prompt: item.content, model: body?.model ?? 'gpt-image-2', size: body?.size ?? '1024x1024', quality: body?.quality ?? 'low' } } }));
    }
    return { provider: source ? 'llm' : 'local', suggestions: rows.map((row: any) => ({ ...row, createdAt: row.createdAt.toISOString() })) };
  }

  @Post('suggest')
  async suggest(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const prompt = String(body?.prompt ?? '');
    const sourceType = body?.imageId ? 'image' : body?.canvasId ? 'canvas' : 'studio';
    const sourceId = body?.imageId ? String(body.imageId) : body?.canvasId ? String(body.canvasId) : null;
    const items = [
      { kind: 'image.next-step', title: 'Strengthen subject clarity', content: 'Increase subject/background separation, keep the current composition, and refine the main focal shape.', payloadJson: { prompt: `${prompt} -- refine subject clarity and focal contrast`.trim() } },
      { kind: 'image.next-step', title: 'Create a high-end variation', content: 'Generate a premium variation with richer lighting and more intentional material detail.', payloadJson: { prompt: `${prompt}, premium material detail, rich lighting, high-end finish`.trim() } },
      { kind: 'canvas.next-node', title: 'Add comparison branch', content: 'Add a parallel generation node with a different style direction before choosing the final edit branch.', payloadJson: { node: { kind: 'task', model: body?.model ?? 'gpt-image-2', quality: 'medium' } } },
    ];
    const rows = [];
    for (const item of items) rows.push(await (this.prisma as any).agentSuggestion.create({ data: { workspaceId: ctx.workspaceId, sourceType, sourceId, kind: item.kind, title: item.title, content: item.content, payloadJson: item.payloadJson as any } }));
    return { suggestions: rows.map((row: any) => ({ ...row, createdAt: row.createdAt.toISOString() })) };
  }

  @Post('canvas-next')
  async canvasNext(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const nodes = Array.isArray(body?.nodes) ? body.nodes : [];
    const hasImage = nodes.some((node: any) => String(node.id ?? '').startsWith('image'));
    const suggestion = await (this.prisma as any).agentSuggestion.create({ data: { workspaceId: ctx.workspaceId, sourceType: 'canvas', sourceId: body?.canvasId ? String(body.canvasId) : null, kind: 'canvas.next-node', title: hasImage ? 'Add edit refinement node' : 'Add reference image node', content: hasImage ? 'Connect the strongest image node into a new edit task with a narrower prompt.' : 'Add an Image node from Asset Library before the next generation node to improve consistency.', payloadJson: { node: hasImage ? { kind: 'task', type: 'image.edit' } : { kind: 'image' } } } });
    return { suggestion: { ...suggestion, createdAt: suggestion.createdAt.toISOString() } };
  }

  @Post('suggestions/:id/apply')
  async apply(@Param('id') id: string, @Body() body: any = {}, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const suggestion = await (this.prisma as any).agentSuggestion.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
    if (!suggestion) return { ok: false, error: 'suggestion not found' };
    let task: any = null;
    if (body?.action === 'create-task' && this.tasks) {
      const payload = { prompt: suggestion.payloadJson?.prompt ?? suggestion.content, model: body?.model ?? suggestion.payloadJson?.model ?? 'gpt-image-2', size: body?.size ?? suggestion.payloadJson?.size ?? '1024x1024', quality: body?.quality ?? suggestion.payloadJson?.quality ?? 'low', format: body?.format ?? 'png', apiMode: 'auto', count: 1, timeoutSec: 600 };
      task = await this.tasks.createGenerateTask(payload, ctx);
    }
    await (this.prisma as any).agentSuggestion.update({ where: { id }, data: { status: body?.action ? `applied:${body.action}` : 'applied', appliedAt: new Date() } });
    return { ok: true, id, task, payload: suggestion.payloadJson };
  }
}
