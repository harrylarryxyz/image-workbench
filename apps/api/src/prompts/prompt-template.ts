export function renderTemplate(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\[([a-zA-Z0-9_-]+)\]/g, (_, key) => String(variables[key] ?? `[${key}]`));
}

export function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

export function enhancePrompt(body: any) {
  const subject = String(body?.subject ?? body?.prompt ?? '').trim();
  const style = String(body?.style ?? '').trim();
  if (!subject) return null;
  const styleLine = style ? `${style}, ` : '';
  return `${styleLine}${subject}, clear subject, coherent composition, refined lighting, high detail, professional image generation prompt, no extra text`;
}
