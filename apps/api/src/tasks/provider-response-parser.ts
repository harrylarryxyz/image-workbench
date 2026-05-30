export type ProviderImagePayload = { b64Json?: string | null; url?: string | null; revisedPrompt?: string | null };

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

function payloadFromDataItem(item: any): ProviderImagePayload | null {
  if (!item) return null;
  const revisedPrompt = item.revised_prompt ?? null;
  if (item.b64_json) return { b64Json: item.b64_json, revisedPrompt };
  if (item.url) return { url: item.url, revisedPrompt };
  return null;
}

export function extractImages(json: any): ProviderImagePayload[] {
  const images: ProviderImagePayload[] = [];
  for (const item of json?.data || []) {
    const image = payloadFromDataItem(item);
    if (image) images.push(image);
  }
  for (const item of json?.output || []) {
    if (item?.type === 'image_generation_call') {
      if (item.result || item.b64_json) {
        images.push({ b64Json: item.result || item.b64_json, revisedPrompt: item.revised_prompt ?? null });
      } else if (item.url || item.image_url) {
        images.push({ url: item.url || item.image_url, revisedPrompt: item.revised_prompt ?? null });
      }
    }
  }
  return images;
}

export function extractImage(json: any): string | null {
  return extractImages(json)[0]?.b64Json ?? null;
}
