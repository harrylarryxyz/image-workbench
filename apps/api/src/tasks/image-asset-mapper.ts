export function toImageAssetCreate(saved: any, prompt: string, workspaceId?: string | null, sourceAssetId?: string | null) {
  const metadataJson = {
    backend: saved.backend,
    assetUrl: saved.assetUrl,
    thumbnailUrl: saved.thumbnailUrl,
    thumbnailFormat: saved.thumbnailFormat,
    thumbnailSizeBytes: saved.thumbnailSizeBytes,
  };
  return {
    storageKey: saved.storageKey,
    thumbnailKey: saved.thumbnailKey,
    format: saved.format,
    sizeBytes: saved.sizeBytes,
    sha256: saved.sha256,
    prompt,
    workspaceId: workspaceId ?? undefined,
    sourceAssetId: sourceAssetId ?? undefined,
    metadataJson,
  };
}
