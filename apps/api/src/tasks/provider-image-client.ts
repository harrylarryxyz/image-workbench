import type { ApiMode } from '../lib/shared';
import { extractImage } from './provider-response-parser';

export async function callImageGenerationProvider(baseUrl: string, apiKey: string, model: string, request: any, apiMode: ApiMode) {
  const ep = apiMode === 'responses' ? '/responses' : '/images/generations';
  const payload = apiMode === 'responses'
    ? { model, input: request.prompt, tools: [{ type: 'image_generation', size: request.size, quality: request.quality, output_format: request.format, moderation: 'low' }] }
    : { model, prompt: request.prompt, n: request.count, size: request.size, quality: request.quality, format: request.format, response_format: 'b64_json', moderation: 'low' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutSec * 1000);
  try {
    const res = await fetch(`${baseUrl}${ep}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && !res.ok) throw new Error(`server returned HTML instead of JSON | HTTP ${res.status} | Content-Type: ${contentType}`);
    const json = await res.json() as any;
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${json?.error?.message || JSON.stringify(json).slice(0, 200)}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export { extractImage };
