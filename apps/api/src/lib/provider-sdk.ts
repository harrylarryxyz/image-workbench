import type { ApiMode, GenerateImageRequest } from './shared';

export type RouteMetadata = {
  requestedModel: string;
  resolvedModel: string;
  apiMode: ApiMode;
  endpoint: string;
  fallbackAttempted: boolean;
  fallbackReason: string | null;
};

const BUILTIN_MODEL_CAPABILITIES: Record<string, { model: string; supportsGenerate: boolean; supportsEdit: boolean; supportsMask: boolean; supportsTransparent: boolean; supportsMultipleRefs: boolean; maxRefs?: number; recommendedTimeoutSec?: number }> = {
  'gpt-image-2': { model: 'gpt-image-2', supportsGenerate: true, supportsEdit: true, supportsMask: true, supportsTransparent: false, supportsMultipleRefs: true, maxRefs: 4, recommendedTimeoutSec: 600 },
  'gpt-image-1.5': { model: 'gpt-image-1.5', supportsGenerate: true, supportsEdit: true, supportsMask: true, supportsTransparent: true, supportsMultipleRefs: true, maxRefs: 4, recommendedTimeoutSec: 300 },
};

export function canonicalModel(model: string): string {
  return model.trim().toLowerCase().split('/').at(-1) ?? model.trim().toLowerCase();
}

export function getModelCapability(model: string) {
  return BUILTIN_MODEL_CAPABILITIES[canonicalModel(model)];
}

export function assertModelRequestSupported(request: GenerateImageRequest, model: string): void {
  const capability = getModelCapability(model);
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
