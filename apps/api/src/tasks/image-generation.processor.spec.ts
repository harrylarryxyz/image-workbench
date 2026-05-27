import { describe, expect, it, vi } from 'vitest';
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
});
