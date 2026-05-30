import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { ImageGenerationProcessor } from './image-generation.processor';

const tinyPngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task_1',
    type: 'image.generate',
    model: 'gpt-image-1',
    prompt: 'test prompt',
    paramsJson: {
      prompt: 'test prompt',
      count: 1,
      size: '1024x1024',
      quality: 'low',
      format: 'png',
      timeoutSec: 30,
      apiMode: 'images',
    },
    provider: {
      id: 'provider_1',
      baseUrl: 'https://provider.example/v1',
      apiKeyEncrypted: 'plain-key',
      defaultModel: 'gpt-image-1',
    },
    ...overrides,
  } as any;
}

describe('ImageGenerationProcessor persistence', () => {
  it('stores only Prisma ImageAsset fields when storage returns runtime metadata', async () => {
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask()),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
    } as any;
    const storage = {
      putImage: vi.fn().mockResolvedValue({
        storageKey: 'local://ab/image.png',
        thumbnailKey: 'local://thumbs/ab/image.webp',
        thumbnailFormat: 'webp',
        thumbnailSizeBytes: 456,
        format: 'png',
        sizeBytes: 123,
        sha256: 'abcdef',
        backend: 'local',
        assetUrl: '/assets/file?key=local%3A%2F%2Fab%2Fimage.png',
        thumbnailUrl: '/assets/file?key=local%3A%2F%2Fthumbs%2Fab%2Fimage.webp',
      }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: [{ b64_json: tinyPngB64 }] }),
    }));

    await processor.process({ data: { taskId: 'task_1' } } as any);

    const successUpdate = updates.find((args) => args.data?.status === 'SUCCEEDED');
    expect(successUpdate).toBeTruthy();
    const imageCreates = successUpdate.data.images.create;
    const imageCreate = Array.isArray(imageCreates) ? imageCreates[0] : imageCreates;
    expect(imageCreate).toMatchObject({
      storageKey: 'local://ab/image.png',
      thumbnailKey: 'local://thumbs/ab/image.webp',
      format: 'png',
      sizeBytes: 123,
      sha256: 'abcdef',
      prompt: 'test prompt',
      metadataJson: {
        backend: 'local',
        assetUrl: '/assets/file?key=local%3A%2F%2Fab%2Fimage.png',
        thumbnailUrl: '/assets/file?key=local%3A%2F%2Fthumbs%2Fab%2Fimage.webp',
        thumbnailFormat: 'webp',
        thumbnailSizeBytes: 456,
      },
    });
    expect(imageCreate).not.toHaveProperty('backend');
    expect(imageCreate).not.toHaveProperty('assetUrl');
    expect(imageCreate).not.toHaveProperty('thumbnailUrl');
    vi.unstubAllGlobals();
  });

  it('passes generation options and persists url-only provider images', async () => {
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask({ paramsJson: { prompt: 'url option', count: 1, size: '1024x1024', quality: 'low', format: 'webp', background: 'opaque', timeoutSec: 30, apiMode: 'images' } })),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
      imageAsset: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const storage = {
      putImage: vi.fn().mockResolvedValue({ storageKey: 'local://url-out.webp', format: 'webp', sizeBytes: 123, sha256: 'url' }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    const downloaded = Buffer.from(tinyPngB64, 'base64');
    const fetchMock = vi.fn(async (url: string, init?: any) => {
      if (String(url).endsWith('/images/generations')) {
        const payload = JSON.parse(String(init.body));
        expect(payload.format).toBe('webp');
        expect(payload.background).toBe('opaque');
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ data: [{ url: 'https://cdn.example/out.webp', revised_prompt: 'url variant' }] }) };
      }
      if (String(url) === 'https://cdn.example/out.webp') {
        return { ok: true, status: 200, arrayBuffer: async () => downloaded.buffer.slice(downloaded.byteOffset, downloaded.byteOffset + downloaded.byteLength) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await processor.process({ data: { taskId: 'task_1' } } as any);

    const successUpdate = updates.find((args) => args.data?.status === 'SUCCEEDED');
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example/out.webp');
    expect(storage.putImage).toHaveBeenCalledTimes(1);
    expect(successUpdate.data.images.create.map((image: any) => image.storageKey)).toEqual(['local://url-out.webp']);
    expect(successUpdate.data.images.create.map((image: any) => image.revisedPrompt)).toEqual(['url variant']);
    vi.unstubAllGlobals();
  });

  it('resizes edit masks to match the first reference image before provider upload', async () => {
    const refBytes = await sharp({ create: { width: 2, height: 3, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } } }).png().toBuffer();
    const maskBytes = await sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer();
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask({
          type: 'image.edit',
          model: 'gpt-image-2',
          paramsJson: { prompt: 'paint only the masked area', count: 1, size: '1024x1024', quality: 'low', format: 'png', timeoutSec: 30, apiMode: 'images', refKeys: ['local://ref.png'], maskKey: 'local://mask.png' },
        })),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
      imageAsset: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const storage = {
      readImage: vi.fn(async (key: string) => key.includes('mask') ? maskBytes : refBytes),
      putImage: vi.fn().mockResolvedValue({ storageKey: 'local://out.png', format: 'png', sizeBytes: 123, sha256: 'abcdef' }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    let sentMask: { width?: number; height?: number; alpha0?: number; alpha255?: number } = {};
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, init: any) => {
      const mask = init.body.get('mask') as Blob;
      const maskBuffer = Buffer.from(await mask.arrayBuffer());
      const meta = await sharp(maskBuffer).metadata();
      const raw = await sharp(maskBuffer).ensureAlpha().raw().toBuffer();
      let alpha0 = 0;
      let alpha255 = 0;
      for (let index = 3; index < raw.length; index += 4) {
        if (raw[index] === 0) alpha0 += 1;
        if (raw[index] === 255) alpha255 += 1;
      }
      sentMask = { width: meta.width, height: meta.height, alpha0, alpha255 };
      return { ok: true, headers: { get: () => 'application/json' }, text: async () => JSON.stringify({ data: [{ b64_json: tinyPngB64 }] }) };
    }));

    await processor.process({ data: { taskId: 'task_1' } } as any);

    expect(sentMask.width).toBe(2);
    expect(sentMask.height).toBe(3);
    expect(sentMask.alpha0).toBe(6);
    expect(sentMask.alpha255).toBe(0);
    expect(updates.some((args) => args.data?.status === 'SUCCEEDED')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('stores every image returned by an images generation response instead of only the first one', async () => {
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask({ paramsJson: { prompt: 'two options', count: 2, size: '1024x1024', quality: 'low', format: 'png', background: 'opaque', timeoutSec: 30, apiMode: 'images' } })),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
      imageAsset: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const storage = {
      putImage: vi.fn()
        .mockResolvedValueOnce({ storageKey: 'local://out-a.png', format: 'png', sizeBytes: 111, sha256: 'a' })
        .mockResolvedValueOnce({ storageKey: 'local://out-b.png', format: 'png', sizeBytes: 222, sha256: 'b' }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: [{ b64_json: tinyPngB64, revised_prompt: 'variant a' }, { b64_json: tinyPngB64, revised_prompt: 'variant b' }] }),
    }));

    await processor.process({ data: { taskId: 'task_1' } } as any);

    const successUpdate = updates.find((args) => args.data?.status === 'SUCCEEDED');
    expect(storage.putImage).toHaveBeenCalledTimes(2);
    expect(successUpdate.data.images.create).toHaveLength(2);
    expect(successUpdate.data.images.create.map((image: any) => image.storageKey)).toEqual(['local://out-a.png', 'local://out-b.png']);
    expect(successUpdate.data.images.create.map((image: any) => image.revisedPrompt)).toEqual(['variant a', 'variant b']);
    vi.unstubAllGlobals();
  });

  it('splits gpt-image-2 edit comparison drafts into single-output provider calls, preserving multi-reference image[] fields', async () => {
    const refBytes = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } } }).png().toBuffer();
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask({
          type: 'image.edit',
          model: 'gpt-image-2',
          paramsJson: { prompt: 'make two edited options', count: 2, size: '1024x1024', quality: 'low', format: 'png', background: 'opaque', timeoutSec: 30, apiMode: 'images', refKeys: ['local://ref-a.png', 'local://ref-b.png'] },
        })),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
      imageAsset: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const storage = {
      readImage: vi.fn(async () => refBytes),
      putImage: vi.fn()
        .mockResolvedValueOnce({ storageKey: 'local://edit-a.png', format: 'png', sizeBytes: 111, sha256: 'ea' })
        .mockResolvedValueOnce({ storageKey: 'local://edit-b.png', format: 'png', sizeBytes: 222, sha256: 'eb' }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    const sentForms: FormData[] = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, init: any) => {
      sentForms.push(init.body as FormData);
      return { ok: true, headers: { get: () => 'application/json' }, text: async () => JSON.stringify({ data: [{ b64_json: tinyPngB64 }] }) };
    }));

    await processor.process({ data: { taskId: 'task_1' } } as any);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sentForms).toHaveLength(2);
    for (const capturedForm of sentForms) {
      expect(capturedForm.get('n')).toBe('1');
      expect(capturedForm.get('format')).toBe('png');
      expect(capturedForm.get('background')).toBe('opaque');
      expect(capturedForm.get('moderation')).toBe('low');
      expect(capturedForm.getAll('image[]')).toHaveLength(2);
      expect(capturedForm.getAll('image')).toHaveLength(0);
    }
    const successUpdate = updates.find((args) => args.data?.status === 'SUCCEEDED');
    expect(storage.putImage).toHaveBeenCalledTimes(2);
    expect(successUpdate.data.images.create.map((image: any) => image.storageKey)).toEqual(['local://edit-a.png', 'local://edit-b.png']);
    vi.unstubAllGlobals();
  });

  it('loops responses-mode generation when count is greater than one instead of silently dropping variants', async () => {
    const updates: any[] = [];
    const prisma = {
      generationTask: {
        findUnique: vi.fn().mockResolvedValue(makeTask({ paramsJson: { prompt: 'two response options', count: 2, size: '1024x1024', quality: 'low', format: 'png', background: 'opaque', timeoutSec: 30, apiMode: 'responses' } })),
        update: vi.fn().mockImplementation(async (args) => { updates.push(args); return args; }),
      },
      imageAsset: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const storage = {
      putImage: vi.fn()
        .mockResolvedValueOnce({ storageKey: 'local://response-a.png', format: 'png', sizeBytes: 111, sha256: 'ra' })
        .mockResolvedValueOnce({ storageKey: 'local://response-b.png', format: 'png', sizeBytes: 222, sha256: 'rb' }),
    } as any;
    const diagnostics = { classify: vi.fn() } as any;
    const processor = new ImageGenerationProcessor(prisma, storage, diagnostics);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ output: [{ type: 'image_generation_call', result: tinyPngB64 }] }),
    }));

    await processor.process({ data: { taskId: 'task_1' } } as any);

    expect(fetch).toHaveBeenCalledTimes(2);
    const successUpdate = updates.find((args) => args.data?.status === 'SUCCEEDED');
    expect(successUpdate.data.images.create.map((image: any) => image.storageKey)).toEqual(['local://response-a.png', 'local://response-b.png']);
    vi.unstubAllGlobals();
  });

});
