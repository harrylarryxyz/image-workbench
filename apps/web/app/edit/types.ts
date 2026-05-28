export type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
export type TaskImage = { id: string; assetUrl: string; storageKey?: string; format: string; sizeBytes: number; width?: number | null; height?: number | null; createdAt?: string };
export type EditTask = { id: string; type?: string; status: string; model?: string; prompt?: string; errorCode?: string | null; errorMessage?: string | null; elapsedMs?: number | null; images?: TaskImage[]; createdAt?: string; updatedAt?: string };
export type ProviderSummary = { name: string; enabled: boolean; capabilities?: { edit: boolean | null; maxRefs: number | null; source: string }; editHealth?: { status: string; errorCode: string | null; errorMessage: string | null } };
