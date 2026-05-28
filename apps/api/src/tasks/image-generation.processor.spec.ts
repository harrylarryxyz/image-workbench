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
    const imageCreate = successUpdate.data.images.create;
    expect(imageCreate).toEqual({
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

});
