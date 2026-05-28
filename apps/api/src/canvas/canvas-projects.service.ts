import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { FlowEdge, FlowNode } from './canvas-types';
import { flowEdgesFromProject, flowNodesFromProject, serializeProject } from './canvas-serializer';

@Injectable()
export class CanvasProjectsService {
  private include = { nodes: true, edges: true };

  constructor(private readonly prisma: PrismaService) {}

  async templates(ctx: any) {
    const rows = await this.prisma.canvasProject.findMany({ where: { workspaceId: ctx.workspaceId, isTemplate: true }, orderBy: { updatedAt: 'desc' }, take: 50, include: this.include });
    return rows.map(serializeProject);
  }

  async useTemplate(id: string, body: any = {}, ctx: any) {
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

  async list(templates: string | undefined, ctx: any) {
    const rows = await this.prisma.canvasProject.findMany({ where: { workspaceId: ctx.workspaceId, ...(templates === '1' ? { isTemplate: true } : {}) }, orderBy: { updatedAt: 'desc' }, take: 100, include: this.include });
    return rows.map(serializeProject);
  }

  async create(body: any, ctx: any) {
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

  async get(id: string, ctx: any) {
    const row = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: this.include });
    if (!row) throw new NotFoundException('canvas project not found');
    return serializeProject(row);
  }

  async getRawProject(id: string, ctx: any) {
    const project = await this.prisma.canvasProject.findFirst({ where: { id, workspaceId: ctx.workspaceId }, include: this.include });
    if (!project) throw new NotFoundException('canvas project not found');
    return project;
  }

  async update(id: string, body: any, ctx: any) {
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

  async delete(id: string, ctx: any) {
    const result = await this.prisma.canvasProject.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
    return { ok: result.count > 0, id };
  }
}
