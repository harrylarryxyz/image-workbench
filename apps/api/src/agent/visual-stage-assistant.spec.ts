import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createVisualStageAssistantReply } from './visual-stage-assistant';

describe('createVisualStageAssistantReply', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AGENT_LLM_BASE_URL = 'https://llm.example/v1';
    process.env.AGENT_LLM_API_KEY = 'test-secret-key';
    process.env.AGENT_LLM_MODEL = 'deepseek-v4-flash';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it('calls an OpenAI-compatible chat model and returns Chinese creative guidance without leaking credentials', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(String(_url)).toBe('https://llm.example/v1/chat/completions');
      expect((init.headers as Record<string, string>).authorization).toBe('Bearer test-secret-key');
      expect(String(init.body)).toContain('deepseek-v4-flash');
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ title: '创作判断', body: '这张适合走温润杂志感，先固定主体和光线。', chips: ['真实助手', '可出图'] }) } }],
        }),
      } as Response;
    });
    global.fetch = fetchMock as any;

    const reply = await createVisualStageAssistantReply({ intent: '做一张护肤品海报', references: [{ label: '@图片1', role: '构图' }], generateMode: false });

    expect(reply.provider).toBe('llm');
    expect(reply.title).toBe('创作判断');
    expect(reply.body).toContain('温润杂志感');
    expect(reply.chips).toContain('真实助手');
    expect(JSON.stringify(reply)).not.toContain('test-secret-key');
  });

  it('falls back to a local Chinese assistant reply when the model is unavailable', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 429, text: async () => 'quota exceeded' })) as any;

    const reply = await createVisualStageAssistantReply({ intent: '想做头像', references: [], generateMode: true });

    expect(reply.provider).toBe('local');
    expect(reply.title).toBe('出图前建议');
    expect(reply.body).toContain('想做头像');
    expect(JSON.stringify(reply)).not.toContain('quota exceeded');
  });
});
