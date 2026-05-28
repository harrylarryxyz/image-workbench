import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TasksService } from '../tasks/tasks.service';

type FlowNode = { id: string; type?: string; position?: { x?: number; y?: number }; data?: unknown };
type FlowEdge = { id: string; source: string; target: string; type?: string; data?: unknown; label?: unknown };

type CanvasBody = { name?: string; description?: string | null; nodes?: FlowNode[]; edges?: FlowEdge[] };

function toNodeCreate(node: FlowNode) {
  return {
    id: String(node.id),
    type: String(node.type ?? 'default'),
    positionX: Number(node.position?.x ?? 0),
    positionY: Number(node.position?.y ?? 0),
    dataJson: (node.data ?? {}) as any,
  };
}

function toEdgeCreate(edge: FlowEdge) {
  const data = edge.data ?? (edge.label !== undefined ? { label: edge.label } : null);
  return {
    id: String(edge.id),
    sourceNodeId: String(edge.source),
    targetNodeId: String(edge.target),
    type: String(edge.type ?? 'default'),
    dataJson: data as any,
  };
}

function serializeProject(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    nodes: (row.nodes ?? []).map((node: any) => ({
      id: node.id,
      type: node.type,
      position: { x: node.positionX, y: node.positionY },
      data: node.dataJson,
    })),
    edges: (row.edges ?? []).map((edge: any) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.type,
      data: edge.dataJson ?? undefined,
      ...(edge.dataJson?.label ? { label: edge.dataJson.label } : {}),
    })),
  };
}

const includeGraph = { nodes: { orderBy: { createdAt: 'asc' as const } }, edges: { orderBy: { id: 'asc' as const } } };

@Controller('canvas-projects')
export class CanvasProjectsController {
  constructor(private readonly prisma: PrismaService, private readonly tasks?: TasksService) {}

  @Get()
  async list() {
    const rows = await this.prisma.canvasProject.findMany({ orderBy: { updatedAt: 'desc' }, include: includeGraph });
    return rows.map(serializeProject);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const row = await this.prisma.canvasProject.findUnique({ where: { id }, include: includeGraph });
    if (!row) throw new NotFoundException('canvas project not found');
    return serializeProject(row);
  }

  @Post()
  async create(@Body() body: CanvasBody) {
    const row = await this.prisma.canvasProject.create({
      data: {
        name: String(body.name ?? 'Untitled canvas').trim() || 'Untitled canvas',
        description: body.description ?? null,
        nodes: { create: (body.nodes ?? []).map(toNodeCreate) },
        edges: { create: (body.edges ?? []).map(toEdgeCreate) },
      },
      include: includeGraph,
    });
    return serializeProject(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CanvasBody) {
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim() || 'Untitled canvas';
    if (body.description !== undefined) data.description = body.description;
    if (body.nodes !== undefined) data.nodes = { deleteMany: {}, create: body.nodes.map(toNodeCreate) };
    if (body.edges !== undefined) data.edges = { deleteMany: {}, create: body.edges.map(toEdgeCreate) };
    const row = await this.prisma.canvasProject.update({ where: { id }, data, include: includeGraph });
    return serializeProject(row);
  }


  @Post(':id/run')
  async run(@Param('id') id: string) {
    const row = await this.prisma.canvasProject.findUnique({ where: { id }, include: includeGraph });
    if (!row) throw new NotFoundException('canvas project not found');
    if (!this.tasks) throw new Error('tasks service unavailable');
    const serialized = serializeProject(row);
    const nodes = serialized.nodes as Array<{ id: string; data?: any }>;
    const edges = serialized.edges as Array<{ source: string; target: string }>;
    const taskNodes = nodes.filter((node) => node.id.startsWith('task') || String(node.data?.label ?? '').toLowerCase().startsWith('task'));
    const created: Array<{ nodeId: string; taskId: string; status: string }> = [];
    for (const taskNode of taskNodes.length ? taskNodes : nodes.filter((node) => node.id.startsWith('prompt')).slice(0, 1)) {
      const upstream = edges.filter((edge) => edge.target === taskNode.id).map((edge) => nodes.find((node) => node.id === edge.source)).filter(Boolean) as any[];
      const promptNode = upstream.find((node) => String(node.id).startsWith('prompt')) ?? nodes.find((node) => String(node.id).startsWith('prompt')) ?? taskNode;
      const imageRefs = upstream.filter((node) => String(node.id).startsWith('image')).map((node) => String(node.data?.storageKey ?? String(node.data?.label ?? '').split('\n').at(-1) ?? '').trim()).filter((x) => x.startsWith('local://'));
      const label = String(promptNode.data?.prompt ?? promptNode.data?.label ?? '');
      const prompt = label.split('\n').slice(1).join('\n').trim() || label || 'Canvas generated image';
      const createdTask = imageRefs.length
        ? await this.tasks.createEditTask({ prompt, refKeys: imageRefs, model: taskNode.data?.model ?? 'gpt-image-2', size: taskNode.data?.size ?? '1024x1024', quality: taskNode.data?.quality ?? 'low', format: taskNode.data?.format ?? 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 })
        : await this.tasks.createGenerateTask({ prompt, model: taskNode.data?.model ?? 'gpt-image-2', size: taskNode.data?.size ?? '1024x1024', quality: taskNode.data?.quality ?? 'low', format: taskNode.data?.format ?? 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 });
      created.push({ nodeId: taskNode.id, taskId: createdTask.id, status: createdTask.status });
    }
    const nextNodes = serialized.nodes.map((node: any) => {
      const match = created.find((item) => item.nodeId === node.id);
      return match ? { ...node, data: { ...(node.data ?? {}), taskId: match.taskId, status: match.status } } : node;
    });
    await this.update(id, { nodes: nextNodes, edges: serialized.edges });
    return { projectId: id, created };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.canvasProject.delete({ where: { id } });
    return { ok: true };
  }
}
