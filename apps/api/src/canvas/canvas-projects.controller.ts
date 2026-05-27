import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.canvasProject.delete({ where: { id } });
    return { ok: true };
  }
}
