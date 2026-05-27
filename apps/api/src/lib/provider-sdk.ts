import type { ApiMode, GenerateImageRequest } from './shared';

export type RouteMetadata = {
  requestedModel: string;
  resolvedModel: string;
  apiMode: ApiMode;
  endpoint: string;
  fallbackAttempted: boolean;
  fallbackReason: string | null;
};

const BUILTIN_MODEL_CAPABILITIES: Record<string, { model: string; supportsTransparent: boolean }> = {
  'gpt-image-2': { model: 'gpt-image-2', supportsTransparent: false },
  'gpt-image-1.5': { model: 'gpt-image-1.5', supportsTransparent: true },
};

export function canonicalModel(model: string): string {
  return model.trim().toLowerCase().split('/').at(-1) ?? model.trim().toLowerCase();
}

export function assertModelRequestSupported(request: GenerateImageRequest, model: string): void {
  const capability = BUILTIN_MODEL_CAPABILITIES[canonicalModel(model)];
  if (!capability) return;
  if (request.background === 'transparent' && !capability.supportsTransparent) {
    throw new Error(`${capability.model} does not support transparent background; use gpt-image-1.5 or remove transparent background.`);
  }
}

export function normalizeBaseUrl(baseUrl: string): { baseUrl: string; pointsToResponses: boolean } {
  const cleaned = baseUrl.replace(/\/+$/, '');
  if (cleaned.endsWith('/responses')) return { baseUrl: cleaned.slice(0, -'/responses'.length), pointsToResponses: true };
  return { baseUrl: cleaned, pointsToResponses: false };
}

export function resolveApiMode(requested: ApiMode, basePointsToResponses: boolean): ApiMode {
  if (requested === 'auto') return basePointsToResponses ? 'responses' : 'images';
  if (requested === 'images' && basePointsToResponses) throw new Error('base URL points to /responses but apiMode=images');
  return requested;
}

export function buildRouteMetadata(input: {
  requestedModel: string;
  resolvedModel: string;
  apiMode: ApiMode;
  endpoint: string;
  fallbackReason?: string | null;
}): RouteMetadata {
  return {
    requestedModel: input.requestedModel,
    resolvedModel: input.resolvedModel,
    apiMode: input.apiMode,
    endpoint: input.endpoint,
    fallbackAttempted: Boolean(input.fallbackReason),
    fallbackReason: input.fallbackReason ?? null,
  };
}
