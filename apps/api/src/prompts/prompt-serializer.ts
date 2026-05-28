export function serializePrompt(row: any) {
  return { id: row.id, title: row.title, content: row.content, tags: row.tags, source: row.source, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt, updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt };
}
