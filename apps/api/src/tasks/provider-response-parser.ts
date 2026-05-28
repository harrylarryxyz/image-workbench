export function parseProviderBody(text: string): any {
  try { return JSON.parse(text); } catch {}
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = 0; i < trimmed.length; i += 1) {
      const char = trimmed[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          try { return JSON.parse(trimmed.slice(0, i + 1)); } catch {}
          break;
        }
      }
    }
  }
  const eventIndex = text.indexOf('event:');
  const dataIndex = text.indexOf('data:');
  const cut = [eventIndex, dataIndex].filter((x) => x > 0).sort((a, b) => a - b)[0];
  if (cut) {
    const first = text.slice(0, cut).trim();
    try { return JSON.parse(first); } catch {}
  }
  throw new Error(`Provider returned non-JSON response: ${text.slice(0, 240)}`);
}

export function extractImage(json: any): string | null {
  for (const item of json?.data || []) if (item?.b64_json) return item.b64_json;
  for (const item of json?.output || []) if (item?.type === 'image_generation_call' && (item.result || item.b64_json)) return item.result || item.b64_json;
  return null;
}
