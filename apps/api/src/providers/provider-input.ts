export function toApiMode(value: unknown): 'AUTO' | 'IMAGES' | 'RESPONSES' {
  const mode = String(value ?? 'auto').toUpperCase();
  if (mode === 'IMAGES' || mode === 'RESPONSES') return mode;
  return 'AUTO';
}

export function toType(value: unknown): 'OPENAI_COMPATIBLE' | 'FAL' | 'CUSTOM_HTTP' {
  const type = String(value ?? 'openai-compatible').toUpperCase().replaceAll('-', '_');
  if (type === 'FAL' || type === 'CUSTOM_HTTP') return type;
  return 'OPENAI_COMPATIBLE';
}
