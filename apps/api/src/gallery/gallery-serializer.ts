export function serializeImage(image: any) {
  const assetUrl = `/assets/file?key=${encodeURIComponent(image.storageKey)}`;
  return {
    id: image.id,
    storageKey: image.storageKey,
    assetUrl,
    thumbnailUrl: image.thumbnailKey ? `/assets/file?key=${encodeURIComponent(image.thumbnailKey)}` : assetUrl,
    format: image.format,
    sizeBytes: image.sizeBytes,
    width: image.width,
    height: image.height,
    prompt: image.prompt,
    revisedPrompt: image.revisedPrompt,
    sourceAssetId: image.sourceAssetId,
    taskId: image.taskId,
    taskType: image.task?.type,
    taskStatus: image.task?.status,
    model: image.task?.model,
    params: image.task?.paramsJson,
    favorite: image.favorite,
    rating: image.rating,
    tags: image.tags ?? [],
    collections: image.collectionItems?.map((item: any) => ({ id: item.collection.id, name: item.collection.name })) ?? [],
    derivatives: image.derivatives?.map((child: any) => ({ id: child.id, storageKey: child.storageKey, thumbnailUrl: child.thumbnailKey ? `/assets/file?key=${encodeURIComponent(child.thumbnailKey)}` : `/assets/file?key=${encodeURIComponent(child.storageKey)}` })) ?? [],
    createdAt: image.createdAt.toISOString(),
  };
}
