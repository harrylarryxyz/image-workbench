import type { ApiMode, GenerateImageRequest, ModelCapability, RouteMetadata } from '@image-workbench/shared';

const DEFAULT_SIZES = ['1024x1024', '1536x1024', '1024x1536', 'auto'];
const DEFAULT_QUALITIES = ['low', 'medium', 'high', 'auto'];
const DEFAULT_FORMATS = ['png', 'jpeg', 'webp'];

export const BUILTIN_MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  'gpt-image-2': {
    model: 'gpt-image-2',
    supportsGenerate: true,
    supportsEdit: true,
    supportsMask: true,
    supportsTransparent: false,
    supportsMultipleRefs: true,
    maxRefs: 4,
    maxOutputCount: 4,
    maxGenerateOutputCount: 4,
    maxEditOutputCount: 4,
    maxProviderEditOutputCount: 1,
    recommendedTimeoutSec: 600,
    sizes: DEFAULT_SIZES,
    qualities: DEFAULT_QUALITIES,
    formats: DEFAULT_FORMATS,
    apiModes: ['auto', 'images', 'responses'],
  },
  'gpt-image-1.5': {
    model: 'gpt-image-1.5',
    supportsGenerate: true,
    supportsEdit: true,
    supportsMask: true,
    supportsTransparent: true,
    supportsMultipleRefs: true,
    maxRefs: 4,
    maxOutputCount: 4,
    maxGenerateOutputCount: 4,
    maxEditOutputCount: 4,
    maxProviderEditOutputCount: 4,
    recommendedTimeoutSec: 300,
    sizes: DEFAULT_SIZES,
    qualities: DEFAULT_QUALITIES,
    formats: DEFAULT_FORMATS,
    apiModes: ['auto', 'images'],
  },
};

export function canonicalModel(model: string): string {
  return model.trim().toLowerCase().split('/').at(-1) ?? model.trim().toLowerCase();
}

export function getModelCapability(model: string): ModelCapability | undefined {
  return BUILTIN_MODEL_CAPABILITIES[canonicalModel(model)];
}

export function listModelCapabilities(): ModelCapability[] {
  return Object.values(BUILTIN_MODEL_CAPABILITIES);
}

export function assertModelRequestSupported(request: GenerateImageRequest, model: string, taskType: string = 'image.generate'): void {
  const capability = getModelCapability(model);
  if (!capability) return;
  const isEdit = taskType === 'image.edit';
  if (isEdit && !capability.supportsEdit) throw new Error(`${capability.model} does not support image edit tasks.`);
  if (!isEdit && !capability.supportsGenerate) throw new Error(`${capability.model} does not support image generation tasks.`);
  if (request.background === 'transparent' && !capability.supportsTransparent) {
    throw new Error(`${capability.model} does not support transparent background; use gpt-image-1.5 or remove transparent background.`);
  }
  const maxOutputCount = isEdit
    ? (capability.maxEditOutputCount ?? capability.maxOutputCount)
    : (capability.maxGenerateOutputCount ?? capability.maxOutputCount);
  if (maxOutputCount && request.count > maxOutputCount) {
    throw new Error(`${capability.model} supports at most ${maxOutputCount} output image(s) per ${isEdit ? 'edit' : 'generation'} task.`);
  }
  if (capability.sizes && !capability.sizes.includes(request.size)) {
    throw new Error(`${capability.model} does not support size ${request.size}.`);
  }
  if (capability.qualities && !capability.qualities.includes(request.quality)) {
    throw new Error(`${capability.model} does not support quality ${request.quality}.`);
  }
  if (capability.formats && !capability.formats.includes(request.format)) {
    throw new Error(`${capability.model} does not support format ${request.format}.`);
  }
  if (request.apiMode !== 'auto' && capability.apiModes && !capability.apiModes.includes(request.apiMode)) {
    throw new Error(`${capability.model} does not support apiMode ${request.apiMode}.`);
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
