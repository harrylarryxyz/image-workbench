import type { PrismaService } from '../prisma.service';
import type { ProviderProfile } from '../lib/shared';
import { getModelCapability } from '../lib/provider-sdk';
import { maskSecret } from './secret-box';

export async function serializeProvider(prisma: PrismaService, row: any, includeHealth = false) {
  const capability = getModelCapability(row.defaultModel);
  const lastEditTask = includeHealth ? await prisma.generationTask.findFirst({
    where: { providerId: row.id, type: 'image.edit', ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}) },
    orderBy: { updatedAt: 'desc' },
    select: { status: true, errorCode: true, errorMessage: true, updatedAt: true },
  }) : null;
  const editHealth = lastEditTask ? {
    status: lastEditTask.status === 'SUCCEEDED' ? 'healthy' : lastEditTask.status === 'FAILED' ? 'failing' : 'unknown',
    lastTaskStatus: lastEditTask.status,
    errorCode: lastEditTask.errorCode,
    errorMessage: lastEditTask.errorMessage,
    checkedAt: lastEditTask.updatedAt.toISOString(),
  } : { status: 'untested', lastTaskStatus: null, errorCode: null, errorMessage: null, checkedAt: null };
  return {
    id: row.id,
    name: row.name,
    type: row.type.toLowerCase().replace('_', '-') as ProviderProfile['type'],
    baseUrl: row.baseUrl,
    defaultModel: row.defaultModel,
    apiMode: row.apiMode.toLowerCase(),
    enabled: row.enabled,
    apiKeyMasked: maskSecret(row.apiKeyEncrypted),
    capabilities: {
      model: row.defaultModel,
      generate: capability?.supportsGenerate ?? null,
      edit: capability?.supportsEdit ?? null,
      mask: capability?.supportsMask ?? null,
      transparent: capability?.supportsTransparent ?? null,
      multipleRefs: capability?.supportsMultipleRefs ?? null,
      maxRefs: capability?.maxRefs ?? null,
      recommendedTimeoutSec: capability?.recommendedTimeoutSec ?? null,
      maxOutputCount: capability?.maxOutputCount ?? null,
      sizes: capability?.sizes ?? null,
      qualities: capability?.qualities ?? null,
      formats: capability?.formats ?? null,
      apiModes: capability?.apiModes ?? null,
      source: capability ? 'builtin-model-profile' : 'unknown-model',
    },
    editHealth,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
