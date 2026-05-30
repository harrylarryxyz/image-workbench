import type { LocalStorageService } from '../storage/local-storage.service';
import { getModelCapability } from '../lib/provider-sdk';
import { normalizeMaskForReference } from './mask-normalizer';
import { extractImages, parseProviderBody, type ProviderImagePayload } from './provider-response-parser';

function imageMimeFromKey(key: string) {
  const ext = key.split('.').pop()?.toLowerCase() || 'png';
  return ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
}

function imageFilenameFromKey(key: string, index: number) {
  const ext = key.split('.').pop()?.toLowerCase() || 'png';
  return key.split('/').pop() || `reference-${index + 1}.${ext}`;
}

function providerEditBatchLimit(model: string, requestedCount: number) {
  const capability = getModelCapability(model);
  return Math.max(1, Math.min(requestedCount, capability?.maxProviderEditOutputCount ?? requestedCount));
}

async function buildEditForm(storage: LocalStorageService, model: string, request: any, params: any, count: number) {
  const refKeys = Array.isArray(params?.refKeys) ? params.refKeys.slice(0, 4) : [];
  const maskKey = typeof params?.maskKey === 'string' && params.maskKey ? params.maskKey : null;
  const maskMode = params?.maskMode === 'provider-transparent-edit' ? 'provider-transparent-edit' : 'painted-area';
  if (!refKeys.length) throw new Error('at least one reference image is required');
  const form = new FormData();
  form.set('model', model);
  form.set('prompt', request.prompt);
  form.set('n', String(count));
  form.set('response_format', 'b64_json');
  form.set('size', request.size ?? '1024x1024');
  form.set('quality', request.quality ?? 'low');
  form.set('format', request.format ?? 'png');
  form.set('background', request.background ?? 'auto');
  form.set('moderation', 'low');
  let firstReferenceBytes: Uint8Array | null = null;
  const imageField = refKeys.length > 1 ? 'image[]' : 'image';
  for (const [index, key] of refKeys.entries()) {
    const bytes = await storage.readImage(key);
    firstReferenceBytes ??= bytes;
    form.append(imageField, new Blob([Buffer.from(bytes)], { type: imageMimeFromKey(key) }), imageFilenameFromKey(key, index));
  }
  if (maskKey) {
    const maskBytes = await storage.readImage(maskKey);
    const normalizedMask = firstReferenceBytes ? await normalizeMaskForReference(maskBytes, firstReferenceBytes, maskMode) : Buffer.from(maskBytes);
    const maskPart = new Uint8Array(normalizedMask.byteLength);
    maskPart.set(normalizedMask);
    form.set('mask', new Blob([maskPart], { type: 'image/png' }), maskKey.split('/').pop() || 'mask.png');
  }
  return form;
}

async function postEditForm(baseUrl: string, apiKey: string, form: FormData, timeoutSec: number): Promise<ProviderImagePayload[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
  try {
    const res = await fetch(`${baseUrl}/images/edits`, { method: 'POST', headers: { authorization: `Bearer ${apiKey}` }, body: form, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && !res.ok) throw new Error(`server returned HTML instead of JSON | HTTP ${res.status} | Content-Type: ${contentType}`);
    const text = await res.text();
    const json = parseProviderBody(text);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${json?.error?.message || text.slice(0, 240)}`);
    return extractImages(json);
  } finally {
    clearTimeout(timer);
  }
}

export async function callImagesEdit(storage: LocalStorageService, baseUrl: string, apiKey: string, model: string, request: any, params: any): Promise<ProviderImagePayload[]> {
  const requestedCount = Math.max(1, Number(request.count ?? 1));
  const timeoutSec = Number(request.timeoutSec ?? 300);
  const providerImages: ProviderImagePayload[] = [];
  const batchLimit = providerEditBatchLimit(model, requestedCount);
  const attempts = Math.ceil(requestedCount / batchLimit);
  for (let index = 0; index < attempts; index += 1) {
    const providerRequestCount = Math.min(batchLimit, requestedCount - index * batchLimit);
    const form = await buildEditForm(storage, model, request, params, providerRequestCount);
    providerImages.push(...await postEditForm(baseUrl, apiKey, form, timeoutSec));
  }
  return providerImages;
}
