export function imageWhere(query: any, workspaceId: string) {
  const taskWhere: Record<string, string> = {};
  if (query.type) taskWhere.type = String(query.type);
  if (query.status) taskWhere.status = String(query.status);
  if (query.model) taskWhere.model = String(query.model);
  const where: any = { workspaceId };
  if (Object.keys(taskWhere).length) where.task = taskWhere;
  if (query.q) where.OR = [{ prompt: { contains: String(query.q), mode: 'insensitive' } }, { storageKey: { contains: String(query.q), mode: 'insensitive' } }, { task: { prompt: { contains: String(query.q), mode: 'insensitive' } } }];
  if (query.tag) where.tags = { has: String(query.tag) };
  if (query.favorite === '1' || query.favorite === 'true') where.favorite = true;
  if (query.collectionId) where.collectionItems = { some: { collectionId: String(query.collectionId) } };
  return where;
}

export function parseIds(value: unknown, limit: number) {
  return String(value ?? '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, limit);
}

export function bodyIds(body: any, limit: number) {
  return Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, limit) : [];
}
