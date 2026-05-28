import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getRequestContext, type RequestContext } from '../auth/request-context';

type FlowNode = { id: string; type?: string; position?: { x?: number; y?: number }; data?: unknown };
type FlowEdge = { id: string; source: string; target: string; type?: string; data?: unknown; label?: unknown };
type CanvasBody = { name?: string; description?: string | null; nodes?: FlowNode[]; edges?: FlowEdge[]; isTemplate?: boolean };

function toNodeCreate(node: FlowNode) {
  return { id: String(node.id), type: String(node.type ?? 'default'), positionX: Number(node.position?.x ?? 0), positionY: Number(node.position?.y ?? 0), dataJson: (node.data ?? {}) as any };
}

function toEdgeCreate(edge: FlowEdge) {
  const data = edge.data ?? (edge.label !== undefined ? { label: edge.label } : null);
  return { id: String(edge.id), sourceNodeId: String(edge.source), targetNodeId: String(edge.target), type: String(edge.type ?? 'default'), dataJson: data as any };
}

function serializeProject(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isTemplate: row.isTemplate,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    nodes: (row.nodes ?? []).map((node: any) => ({ id: node.id, type: node.type, position: { x: node.positionX, y: node.positionY }, data: node.dataJson })),
    edges: (row.edges ?? []).map((edge: any) => ({ id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId, type: edge.type, data: edge.dataJson ?? undefined, ...(edge.dataJson?.label ? { label: edge.dataJson.label } : {}) })),
  };
}

const includeGraph = { nodes: { orderBy: { createdAt: 'asc' as const } }, edges: { orderBy: { id: 'asc' as const } } };


function normalizeStorageRef(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^(?:local|s3|r2|minio):\/\//.test(text)) return text;
  const keyMatch = text.match(/[?&]key=([^&\s]+)/);
  if (keyMatch) return decodeURIComponent(keyMatch[1]);
  return text.includes('://') ? text : '';
}

function topoTaskNodes(nodes: Array<{ id: string; data?: any }>, edges: Array<{ source: string; target: string }>) {
  const taskIds = new Set(nodes.filter((node) => node.id.startsWith('task') || String(node.data?.label ?? '').toLowerCase().startsWith('task')).map((node) => node.id));
  if (!taskIds.size) for (const node of nodes.filter((node) => node.id.startsWith('prompt')).slice(0, 1)) taskIds.add(node.id);
  const indegree = new Map<string, number>();
  for (const id of taskIds) indegree.set(id, 0);
  for (const edge of edges) if (taskIds.has(edge.target) && taskIds.has(edge.source)) indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
  const ordered: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const edge of edges.filter((item) => item.source === id && taskIds.has(item.target))) {
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) - 1);
      if (indegree.get(edge.target) === 0) queue.push(edge.target);
    }
  }
  return ordered.length ? ordered.map((id) => nodes.find((node) => node.id === id)!).filter(Boolean) : nodes.filter((node) => taskIds.has(node.id));
}

@Controller('canvas-projects')
export class CanvasProjectsController {
  constructor(private readonly prisma: PrismaService, private readonly tasks?: TasksService) {}

  @Get('templates')
  async templates(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.canvasProject.findMany({ where: { isTemplate: true, workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, include: includeGraph });
    return rows.map(serializeProject);
  }

  @Get()
  async list(@Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const rows = await this.prisma.canvasProject.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, include: includeGraph });
    return rows.map(serializeProject);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: includeGraph });
    if (!row) throw new NotFoundException('canvas project not found');
    return serializeProject(row);
  }

  @Post()
  async create(@Body() body: CanvasBody, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.canvasProject.create({ data: { name: String(body.name ?? 'Untitled canvas').trim() || 'Untitled canvas', description: body.description ?? null, isTemplate: Boolean(body.isTemplate), workspaceId: ctx.workspaceId, nodes: { create: (body.nodes ?? []).map(toNodeCreate) }, edges: { create: (body.edges ?? []).map(toEdgeCreate) } }, include: includeGraph });
    return serializeProject(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CanvasBody, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    return this.updateScoped(id, body, ctx);
  }

  private async updateScoped(id: string, body: CanvasBody, ctx: RequestContext) {
    const existing = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, select: { id: true } });
    if (!existing) throw new NotFoundException('canvas project not found');
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim() || 'Untitled canvas';
    if (body.description !== undefined) data.description = body.description;
    if (body.isTemplate !== undefined) data.isTemplate = Boolean(body.isTemplate);
    if (body.nodes !== undefined) data.nodes = { deleteMany: {}, create: body.nodes.map(toNodeCreate) };
    if (body.edges !== undefined) data.edges = { deleteMany: {}, create: body.edges.map(toEdgeCreate) };
    const row = await this.prisma.canvasProject.update({ where: { id }, data, include: includeGraph });
    return serializeProject(row);
  }

  @Post(':id/snapshots')
  async snapshot(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: includeGraph });
    if (!row) throw new NotFoundException('canvas project not found');
    const serialized = serializeProject(row);
    return this.prisma.canvasSnapshot.create({ data: { projectId: id, label: body?.label ? String(body.label) : null, nodesJson: serialized.nodes as any, edgesJson: serialized.edges as any } });
  }

  @Get(':id/snapshots')
  async snapshots(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const project = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, select: { id: true } });
    if (!project) throw new NotFoundException('canvas project not found');
    return this.prisma.canvasSnapshot.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  @Post(':id/run')
  async run(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const row = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: includeGraph });
    if (!row) throw new NotFoundException('canvas project not found');
    if (!this.tasks) throw new Error('tasks service unavailable');
    const serialized = serializeProject(row);
    const nodes = serialized.nodes as Array<{ id: string; data?: any }>;
    const edges = serialized.edges as Array<{ source: string; target: string }>;
    const taskNodes = topoTaskNodes(nodes, edges);
    const created: Array<{ nodeId: string; taskId: string; status: string }> = [];
    const nodeOutputRefs = new Map<string, string>();
    for (const taskNode of taskNodes) {
      const upstream = edges.filter((edge) => edge.target === taskNode.id).map((edge) => nodes.find((node) => node.id === edge.source)).filter(Boolean) as any[];
      const promptNode = upstream.find((node) => String(node.id).startsWith('prompt')) ?? nodes.find((node) => String(node.id).startsWith('prompt')) ?? taskNode;
      const explicitRefs = upstream.filter((node) => String(node.id).startsWith('image')).map((node) => normalizeStorageRef(node.data?.storageKey ?? String(node.data?.label ?? '').split('\n').at(-1))).filter(Boolean);
      const generatedRefs = upstream.map((node) => nodeOutputRefs.get(node.id)).filter(Boolean) as string[];
      const imageRefs = [...explicitRefs, ...generatedRefs];
      const label = String(promptNode.data?.prompt ?? promptNode.data?.label ?? '');
      const prompt = label.split('\n').slice(1).join('\n').trim() || label || 'Canvas generated image';
      const createdTask = imageRefs.length
        ? await this.tasks.createEditTask({ prompt, refKeys: imageRefs, model: taskNode.data?.model ?? 'gpt-image-2', size: taskNode.data?.size ?? '1024x1024', quality: taskNode.data?.quality ?? 'low', format: taskNode.data?.format ?? 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 }, ctx)
        : await this.tasks.createGenerateTask({ prompt, model: taskNode.data?.model ?? 'gpt-image-2', size: taskNode.data?.size ?? '1024x1024', quality: taskNode.data?.quality ?? 'low', format: taskNode.data?.format ?? 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 }, ctx);
      created.push({ nodeId: taskNode.id, taskId: createdTask.id, status: createdTask.status });
      nodeOutputRefs.set(taskNode.id, `task://${createdTask.id}`);
    }
    const nextNodes = serialized.nodes.map((node: any) => {
      const match = created.find((item) => item.nodeId === node.id);
      return match ? { ...node, data: { ...(node.data ?? {}), taskId: match.taskId, status: match.status } } : node;
    });
    await this.updateScoped(id, { nodes: nextNodes, edges: serialized.edges }, ctx);
    return { projectId: id, created };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request = {} as any) {
    const ctx = getRequestContext(req);
    const result = await this.prisma.canvasProject.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
    return { ok: result.count === 1 };
  }
}
