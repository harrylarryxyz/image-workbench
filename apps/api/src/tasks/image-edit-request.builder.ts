import type { LocalStorageService } from '../storage/local-storage.service';
import { normalizeMaskForReference } from './mask-normalizer';
import { extractImage, parseProviderBody } from './provider-response-parser';

export async function callImagesEdit(storage: LocalStorageService, baseUrl: string, apiKey: string, model: string, request: any, params: any): Promise<string | null> {
  const refKeys = Array.isArray(params?.refKeys) ? params.refKeys.slice(0, 4) : [];
  const maskKey = typeof params?.maskKey === 'string' && params.maskKey ? params.maskKey : null;
  const maskMode = params?.maskMode === 'provider-transparent-edit' ? 'provider-transparent-edit' : 'painted-area';
  if (!refKeys.length) throw new Error('at least one reference image is required');
  const form = new FormData();
  form.set('model', model);
  form.set('prompt', request.prompt);
  form.set('size', request.size ?? '1024x1024');
  form.set('quality', request.quality ?? 'low');
  form.set('response_format', 'b64_json');
  let firstReferenceBytes: Uint8Array | null = null;
  for (const key of refKeys) {
    const bytes = await storage.readImage(key);
    firstReferenceBytes ??= bytes;
    const ext = key.split('.').pop()?.toLowerCase() || 'png';
    const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
    form.append('image', new Blob([Buffer.from(bytes)], { type }), key.split('/').pop() || `reference.${ext}`);
  }
  if (maskKey) {
    const maskBytes = await storage.readImage(maskKey);
    const normalizedMask = firstReferenceBytes ? await normalizeMaskForReference(maskBytes, firstReferenceBytes, maskMode) : Buffer.from(maskBytes);
    const maskPart = new Uint8Array(normalizedMask.byteLength);
    maskPart.set(normalizedMask);
    form.set('mask', new Blob([maskPart], { type: 'image/png' }), maskKey.split('/').pop() || 'mask.png');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(request.timeoutSec ?? 300) * 1000);
  try {
    const res = await fetch(`${baseUrl}/images/edits`, { method: 'POST', headers: { authorization: `Bearer ${apiKey}` }, body: form, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && !res.ok) throw new Error(`server returned HTML instead of JSON | HTTP ${res.status} | Content-Type: ${contentType}`);
    const text = await res.text();
    const json = parseProviderBody(text);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${json?.error?.message || text.slice(0, 240)}`);
    return extractImage(json);
  } finally {
    clearTimeout(timer);
  }
}
