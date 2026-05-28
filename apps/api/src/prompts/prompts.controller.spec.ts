import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PromptsController } from './prompts.controller';

const now = new Date('2026-05-27T00:00:00Z');

describe('PromptsController', () => {
  it('filters presets by tag', async () => {
    const prisma = { promptPreset: { findMany: vi.fn().mockResolvedValue([{ id: 'p1', title: 'Warm', content: 'warm [subject]', tags: ['style'], source: 'seed', createdAt: now, updatedAt: now }]) } };
    const controller = new PromptsController(prisma as any);

    await expect(controller.list('style')).resolves.toEqual([{ id: 'p1', title: 'Warm', content: 'warm [subject]', tags: ['style'], source: 'seed', createdAt: now.toISOString(), updatedAt: now.toISOString() }]);
    expect(prisma.promptPreset.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: 'default', tags: { has: 'style' } } }));
  });

  it('enhances a local prompt without external provider dependency', () => {
    const controller = new PromptsController({} as any);

    expect(controller.enhance({ subject: 'orange robot', style: 'cinematic' })).toEqual({ prompt: 'cinematic, orange robot, clear subject, coherent composition, refined lighting, high detail, professional image generation prompt, no extra text', source: 'local-enhancer' });
    expect(() => controller.enhance({})).toThrow(BadRequestException);
  });
});
