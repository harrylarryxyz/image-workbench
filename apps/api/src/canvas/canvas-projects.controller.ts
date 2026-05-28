import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getRequestContext } from '../auth/request-context';

type FlowNode = { id: string; type?: string; position?: { x?: number; y?: number }; data?: Record<string, any> };
type FlowEdge = { id: string; source: string; target: string; type?: string; data?: Record<string, any> | null; label?: string };

function serializeProject(project: any) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    isTemplate: Boolean(project.isTemplate),
    createdAt: project.createdAt?.toISOString?.() ?? project.createdAt,
    updatedAt: project.updatedAt?.toISOString?.() ?? project.updatedAt,
    nodes: (project.nodes ?? []).map((node: any) => ({ id: node.id, type: node.type, position: { x: node.positionX, y: node.positionY }, data: node.dataJson ?? {} })),
    edges: (project.edges ?? []).map((edge: any) => ({ id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId, type: edge.type, data: edge.dataJson ?? undefined, label: edge.dataJson?.label })),
  };
}

function flowNodesFromProject(project: any): FlowNode[] { return serializeProject(project).nodes; }
function flowEdgesFromProject(project: any): FlowEdge[] { return serializeProject(project).edges; }
function nodePrompt(node?: FlowNode) { return String(node?.data?.prompt ?? node?.data?.label ?? '').split('\n').filter(Boolean).slice(-1)[0] ?? ''; }
function nodeKind(node: FlowNode) {
  const explicit = String(node.data?.kind ?? node.type ?? '').toLowerCase();
  if (explicit.includes('image') || node.id.startsWith('image')) return 'image';
  if (explicit.includes('prompt') || explicit.includes('text') || node.id.startsWith('prompt')) return 'prompt';
  if (explicit.includes('task') || explicit.includes('generation') || node.id.startsWith('task')) return 'task';
  return 'node';
}

@Controller('canvas-projects')
export class CanvasProjectsController {
  constructor(private readonly prisma: PrismaService, private readonly tasks?: TasksService) {}

  private include = { nodes: true, edges: true };

  @Get('templates')
  async templates(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.canvasProject.findMany({ where: { workspaceId: ctx.workspaceId, isTemplate: true }, orderBy: { updatedAt: 'desc' }, take: 50, include: this.include });
    return rows.map(serializeProject);
  }

  @Post('templates/:id/use')
  async useTemplate(@Param('id') id: string, @Body() body: any = {}, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const template = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId, isTemplate: true }, include: this.include });
    if (!template) throw new NotFoundException('template not found');
    const suffix = Date.now();
    const remap = (value: string) => `${value}-${suffix}`;
    const created = await this.prisma.canvasProject.create({ data: {
      name: body?.name ? String(body.name) : `${template.name} copy`,
      description: template.description,
      workspaceId: ctx.workspaceId,
      isTemplate: false,
      nodes: { create: flowNodesFromProject(template).map((node) => ({ id: remap(node.id), type: node.type ?? 'default', positionX: Number(node.position?.x ?? 0), positionY: Number(node.position?.y ?? 0), dataJson: node.data ?? {} })) },
      edges: { create: flowEdgesFromProject(template).map((edge) => ({ id: remap(edge.id), sourceNodeId: remap(edge.source), targetNodeId: remap(edge.target), type: edge.type ?? 'default', dataJson: edge.data ?? {} })) },
    }, include: this.include });
    return serializeProject(created);
  }

  @Get()
  async list(@Query('templates') templates: string | undefined, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.canvasProject.findMany({ where: { workspaceId: ctx.workspaceId, ...(templates === '1' ? { isTemplate: true } : {}) }, orderBy: { updatedAt: 'desc' }, take: 100, include: this.include });
    return rows.map(serializeProject);
  }

  @Post()
  async create(@Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const nodes: FlowNode[] = Array.isArray(body?.nodes) ? body.nodes : [];
    const edges: FlowEdge[] = Array.isArray(body?.edges) ? body.edges : [];
    const created = await this.prisma.canvasProject.create({ data: {
      name: body?.name ? String(body.name) : 'Untitled canvas',
      description: body?.description ? String(body.description) : null,
      workspaceId: ctx.workspaceId,
      isTemplate: Boolean(body?.isTemplate),
      nodes: { create: nodes.map((node) => ({ id: node.id, type: node.type ?? 'default', positionX: Number(node.position?.x ?? 0), positionY: Number(node.position?.y ?? 0), dataJson: node.data ?? {} })) },
      edges: { create: edges.map((edge) => ({ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type ?? 'default', dataJson: edge.data ?? (edge.label ? { label: edge.label } : undefined) })) },
    }, include: this.include });
    return serializeProject(created);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: this.include });
    if (!row) throw new NotFoundException('canvas project not found');
    return serializeProject(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const existing = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, select: { id: true } });
    if (!existing) throw new NotFoundException('canvas project not found');
    const data: any = {
      name: body?.name ? String(body.name) : undefined,
      description: body?.description === undefined ? undefined : String(body.description || ''),
      isTemplate: body?.isTemplate === undefined ? undefined : Boolean(body.isTemplate),
    };
    if (Array.isArray(body?.nodes)) {
      const nodes: FlowNode[] = body.nodes;
      data.nodes = { deleteMany: {}, create: nodes.map((node) => ({ id: node.id, type: node.type ?? 'default', positionX: Number(node.position?.x ?? 0), positionY: Number(node.position?.y ?? 0), dataJson: node.data ?? {} })) };
    }
    if (Array.isArray(body?.edges)) {
      const edges: FlowEdge[] = body.edges;
      data.edges = { deleteMany: {}, create: edges.map((edge) => ({ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type ?? 'default', dataJson: edge.data ?? (edge.label ? { label: edge.label } : undefined) })) };
    }
    const row = await this.prisma.canvasProject.update({ where: { id }, data, include: this.include });
    return serializeProject(row);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const result = await this.prisma.canvasProject.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
    return { ok: result.count > 0, id };
  }

  @Get(':id/runs')
  async runs(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await (this.prisma as any).canvasRun.findMany({ where: { projectId: id, workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 30, include: { nodes: { include: { task: { include: { images: true } } } } } });
    const reconciled = await Promise.all(rows.map((run: any) => this.reconcileRun(run)));
    return reconciled.map((run: any) => this.serializeRun(run));
  }

  @Post(':id/run')
  async run(@Param('id') id: string, @Body() body: any = {}, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const project = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: this.include });
    if (!project) throw new NotFoundException('canvas project not found');
    return this.executeRun(project, ctx, { label: body?.label ? String(body.label) : undefined, targetNodeIds: Array.isArray(body?.nodeIds) ? body.nodeIds.map(String) : undefined });
  }

  @Post(':id/run/:nodeId')
  async rerunNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const project = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: this.include });
    if (!project) throw new NotFoundException('canvas project not found');
    return this.executeRun(project, ctx, { label: `rerun ${nodeId}`, targetNodeIds: [nodeId] });
  }

  @Post(':id/runs/:runId/replay')
  async replay(@Param('id') id: string, @Param('runId') runId: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const run = await (this.prisma as any).canvasRun.findFirst({ where: { id: runId, projectId: id, workspaceId: ctx.workspaceId } });
    if (!run) throw new NotFoundException('canvas run not found');
    const pseudoProject = { id, nodes: (run.nodesJson as any[]).map((node) => ({ id: node.id, type: node.type, positionX: node.position?.x ?? 0, positionY: node.position?.y ?? 0, dataJson: node.data ?? {} })), edges: (run.edgesJson as any[]).map((edge) => ({ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type, dataJson: edge.data ?? {} })) };
    return this.executeRun(pseudoProject, ctx, { label: `replay ${runId}` });
  }

  private async executeRun(project: any, ctx: any, options: { label?: string; targetNodeIds?: string[] } = {}) {
    if (!this.tasks) throw new Error('TasksService is not available');
    const nodes = flowNodesFromProject(project);
    const edges = flowEdgesFromProject(project);
    const run = await (this.prisma as any).canvasRun.create({ data: { projectId: project.id, workspaceId: ctx.workspaceId, status: 'RUNNING', label: options.label ?? null, nodesJson: nodes as any, edgesJson: edges as any } });
    const targets = nodes.filter((node) => nodeKind(node) === 'task' && (!options.targetNodeIds?.length || options.targetNodeIds.includes(node.id)));
    const created: any[] = [];
    for (const target of targets) {
      const incoming = edges.filter((edge) => edge.target === target.id).map((edge) => nodes.find((node) => node.id === edge.source)).filter(Boolean) as FlowNode[];
      const promptNode = incoming.find((node) => nodeKind(node) === 'prompt') ?? nodes.find((node) => nodeKind(node) === 'prompt');
      const imageNodes = incoming.filter((node) => nodeKind(node) === 'image');
      const refKeys = imageNodes.map((node) => String(node.data?.storageKey ?? '')).filter(Boolean);
      const prompt = String(target.data?.prompt ?? nodePrompt(promptNode) ?? 'Create a refined image variation.');
      const payload = { prompt, model: target.data?.model ?? 'gpt-image-2', size: target.data?.size ?? '1024x1024', quality: target.data?.quality ?? 'low', format: target.data?.format ?? 'png', apiMode: target.data?.apiMode ?? 'auto', count: 1, timeoutSec: Number(target.data?.timeoutSec ?? 600), ...(refKeys.length ? { refKeys, maskKey: target.data?.maskKey } : {}) };
      const runNode = await (this.prisma as any).canvasRunNode.create({ data: { runId: run.id, nodeId: target.id, status: 'QUEUED', inputJson: payload as any } });
      try {
        const task = refKeys.length ? await this.tasks.createEditTask(payload, ctx) : await this.tasks.createGenerateTask(payload, ctx);
        await (this.prisma as any).canvasRunNode.update({ where: { id: runNode.id }, data: { taskId: task.id, status: task.status ?? 'QUEUED', outputJson: task as any } });
        created.push({ nodeId: target.id, runNodeId: runNode.id, taskId: task.id, status: task.status, type: refKeys.length ? 'image.edit' : 'image.generate' });
      } catch (error) {
        await (this.prisma as any).canvasRunNode.update({ where: { id: runNode.id }, data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : String(error) } });
        created.push({ nodeId: target.id, runNodeId: runNode.id, status: 'FAILED', error: error instanceof Error ? error.message : String(error) });
      }
    }
    const status = created.some((item) => item.status === 'FAILED') ? 'FAILED' : created.length ? 'RUNNING' : 'SUCCEEDED';
    const updated = await (this.prisma as any).canvasRun.update({ where: { id: run.id }, data: { status, completedAt: status === 'SUCCEEDED' || status === 'FAILED' ? new Date() : null }, include: { nodes: { include: { task: { include: { images: true } } } } } });
    await this.prisma.canvasProject.update({ where: { id: project.id }, data: { updatedAt: new Date() } }).catch(() => undefined);
    return { ...this.serializeRun(updated), projectId: project.id, created };
  }


  private taskStatusForRun(status?: string) {
    if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED') return status;
    if (status === 'QUEUED' || status === 'RUNNING') return status;
    return 'RUNNING';
  }

  private async reconcileRun(run: any) {
    const nodes = run.nodes ?? [];
    const reconciledNodes = [];
    for (const node of nodes) {
      const taskStatus = this.taskStatusForRun(node.task?.status ?? node.status);
      const images = node.task?.images ?? [];
      const outputJson = node.task ? { ...(node.outputJson ?? {}), taskId: node.task.id, status: node.task.status, images: images.map((image: any) => ({ id: image.id, storageKey: image.storageKey, thumbnailKey: image.thumbnailKey })) } : node.outputJson;
      let current = { ...node, status: taskStatus, outputJson };
      if (taskStatus !== node.status || (node.task && JSON.stringify(outputJson) !== JSON.stringify(node.outputJson ?? {}))) {
        current = await (this.prisma as any).canvasRunNode.update({ where: { id: node.id }, data: { status: taskStatus, outputJson: outputJson as any }, include: { task: { include: { images: true } } } }).catch(() => current);
      }
      reconciledNodes.push(current);
    }
    const statuses = reconciledNodes.map((node: any) => node.status);
    const finalStatus = !statuses.length ? 'SUCCEEDED'
      : statuses.some((status: string) => status === 'QUEUED' || status === 'RUNNING') ? 'RUNNING'
        : statuses.some((status: string) => status === 'FAILED') ? 'FAILED'
          : statuses.some((status: string) => status === 'CANCELLED') ? 'CANCELLED'
            : 'SUCCEEDED';
    let nextRun = { ...run, nodes: reconciledNodes, status: finalStatus };
    const terminal = finalStatus === 'SUCCEEDED' || finalStatus === 'FAILED' || finalStatus === 'CANCELLED';
    if (run.status !== finalStatus || (terminal && !run.completedAt)) {
      nextRun = await (this.prisma as any).canvasRun.update({ where: { id: run.id }, data: { status: finalStatus, completedAt: terminal ? (run.completedAt ?? new Date()) : null }, include: { nodes: { include: { task: { include: { images: true } } } } } }).catch(() => nextRun);
    }
    return nextRun;
  }

  private serializeRun(run: any) {
    return {
      id: run.id,
      projectId: run.projectId,
      label: run.label,
      status: run.status,
      createdAt: run.createdAt?.toISOString?.() ?? run.createdAt,
      updatedAt: run.updatedAt?.toISOString?.() ?? run.updatedAt,
      completedAt: run.completedAt?.toISOString?.() ?? run.completedAt,
      nodes: (run.nodes ?? []).map((node: any) => ({ id: node.id, nodeId: node.nodeId, status: node.status, taskId: node.taskId, input: node.inputJson, output: node.outputJson, errorMessage: node.errorMessage, images: (node.task?.images ?? []).map((image: any) => ({ id: image.id, storageKey: image.storageKey, thumbnailUrl: image.thumbnailKey ? `/assets/file?key=${encodeURIComponent(image.thumbnailKey)}` : undefined, assetUrl: `/assets/file?key=${encodeURIComponent(image.storageKey)}` })) })),
    };
  }
}
