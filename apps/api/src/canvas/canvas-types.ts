export type FlowNode = { id: string; type?: string; position?: { x?: number; y?: number }; data?: Record<string, any> };
export type FlowEdge = { id: string; source: string; target: string; type?: string; data?: Record<string, any> | null; label?: string };
