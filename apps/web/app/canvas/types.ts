import type { Edge, Node } from '@xyflow/react';

export type CanvasExport = { nodes: Node[]; edges: Edge[] };
export type CanvasProject = CanvasExport & { id: string; name: string; description?: string | null; updatedAt?: string; isTemplate?: boolean };
export type CanvasRunNode = { id: string; nodeId: string; status: string; taskId?: string; images?: Array<{ assetUrl?: string; thumbnailUrl?: string; storageKey?: string }> };
export type CanvasRun = { id: string; status: string; label?: string | null; createdAt?: string; nodes?: CanvasRunNode[]; created?: Array<{ nodeId: string; taskId: string; status: string; type?: string }> };
export type CanvasRunResult = CanvasRun & { projectId?: string; [key: string]: unknown };
