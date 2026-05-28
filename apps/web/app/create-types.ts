export type Uploaded = { storageKey: string; assetUrl: string; originalName?: string; format: string; sizeBytes: number };
export type TaskImage = { id?: string; storageKey: string; assetUrl?: string; thumbnailUrl?: string; format: string; sizeBytes: number; width?: number | null; height?: number | null; sourceAssetId?: string | null };
export type TaskResult = {
  id?: string;
  status?: string;
  type?: string;
  error?: string | null;
  errorMessage?: string | null;
  model?: string;
  prompt?: string;
  elapsedMs?: number | null;
  routeJson?: unknown;
  images?: TaskImage[];
  [key: string]: unknown;
};
export type Variant = { id?: string; title?: string; content: string; payloadJson?: { prompt?: string } };
