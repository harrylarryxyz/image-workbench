import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CanvasProjectsService } from './canvas-projects.service';
import { flowEdgesFromProject, flowNodesFromProject, serializeRun } from './canvas-serializer';
import { nodeKind, nodePrompt } from './canvas-flow-utils';

@Injectable()
export class CanvasRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: CanvasProjectsService,
    private readonly tasks?: TasksService,
  ) {}

  async runs(id: string, ctx: any) {
    const rows = await (this.prisma as any).canvasRun.findMany({ where: { projectId: id, workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: 30, include: { nodes: { include: { task: { include: { images: true } } } } } });
    const reconciled = await Promise.all(rows.map((run: any) => this.reconcileRun(run)));
    return reconciled.map((run: any) => serializeRun(run));
  }

  async run(id: string, body: any = {}, ctx: any) {
    const project = await this.projects.getRawProject(id, ctx);
    return this.executeRun(project, ctx, { label: body?.label ? String(body.label) : undefined, targetNodeIds: Array.isArray(body?.nodeIds) ? body.nodeIds.map(String) : undefined });
  }

  async rerunNode(id: string, nodeId: string, ctx: any) {
    const project = await this.projects.getRawProject(id, ctx);
    return this.executeRun(project, ctx, { label: `rerun ${nodeId}`, targetNodeIds: [nodeId] });
  }

  async replay(id: string, runId: string, ctx: any) {
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
      const incoming = edges.filter((edge) => edge.target === target.id).map((edge) => nodes.find((node) => node.id === edge.source)).filter(Boolean) as any[];
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
    return { ...serializeRun(updated), projectId: project.id, created };
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
}
