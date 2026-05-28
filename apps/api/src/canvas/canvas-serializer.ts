import type { FlowEdge, FlowNode } from './canvas-types';

export function serializeProject(project: any) {
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

export function serializeRun(run: any) {
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

export function flowNodesFromProject(project: any): FlowNode[] { return serializeProject(project).nodes; }
export function flowEdgesFromProject(project: any): FlowEdge[] { return serializeProject(project).edges; }
