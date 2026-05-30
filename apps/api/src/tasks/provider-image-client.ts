import type { ApiMode } from '../lib/shared';
import { extractImage, extractImages } from './provider-response-parser';

function buildGenerationPayload(model: string, request: any, apiMode: ApiMode) {
  if (apiMode === 'responses') {
    return {
      model,
      input: request.prompt,
      tools: [{
        type: 'image_generation',
        size: request.size,
        quality: request.quality,
        output_format: request.format,
        background: request.background,
        moderation: 'low',
      }],
    };
  }
  return {
    model,
    prompt: request.prompt,
    n: request.count,
    size: request.size,
    quality: request.quality,
    format: request.format,
    background: request.background,
    response_format: 'b64_json',
    moderation: 'low',
  };
}

async function postGeneration(baseUrl: string, apiKey: string, model: string, request: any, apiMode: ApiMode) {
  const ep = apiMode === 'responses' ? '/responses' : '/images/generations';
  const payload = buildGenerationPayload(model, request, apiMode);
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

export async function callImageGenerationProvider(baseUrl: string, apiKey: string, model: string, request: any, apiMode: ApiMode) {
  if (apiMode !== 'responses' || Number(request.count ?? 1) <= 1) {
    return postGeneration(baseUrl, apiKey, model, request, apiMode);
  }

  const outputs: any[] = [];
  for (let index = 0; index < Number(request.count); index += 1) {
    const json = await postGeneration(baseUrl, apiKey, model, { ...request, count: 1 }, apiMode);
    outputs.push(...(Array.isArray(json?.data) ? json.data : []));
    outputs.push(...(Array.isArray(json?.output) ? json.output : []));
  }
  return { output: outputs };
}

export { extractImage, extractImages };
