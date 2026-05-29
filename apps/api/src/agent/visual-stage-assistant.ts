type VisualStageReference = {
  label?: string;
  role?: string;
  title?: string;
  hint?: string;
};

type VisualStageAssistantInput = {
  intent: string;
  references: VisualStageReference[];
  generateMode: boolean;
};

type VisualStageAssistantReply = {
  provider: 'llm' | 'local';
  title: string;
  body: string;
  chips: string[];
};

function sanitizeText(value: unknown, fallback = '') {
  return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
}

function parseJsonObject(text: string): any | null {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}

function localReply(input: VisualStageAssistantInput): VisualStageAssistantReply {
  const intent = input.intent.trim() || '这次创作';
  const hasReferences = input.references.length > 0;
  const useCase = /小红书|封面|海报|宣传|首图|banner|Banner/i.test(intent) ? '使用场景已经比较明确' : '使用场景还可以再补一句';
  const referenceHint = hasReferences
    ? `已看到 ${input.references.map((item) => item.label).filter(Boolean).join('、')}，建议明确每张图负责构图、人物、色调、风格或产品中的哪一类。`
    : '建议补充一张参考图，或用一句话说明风格锚点。';
  return {
    provider: 'local',
    title: input.generateMode ? '出图前建议' : '助手建议',
    body: `针对「${intent}」：${useCase}。${referenceHint} 下一步优先锁定主体、比例、发布渠道和不能改变的元素。${input.generateMode ? '我会先生成草稿，确认后再加入画布。' : '如果只是讨论，不会消耗生图额度；打开出图后再生成。'}`,
    chips: [input.generateMode ? '准备出图' : '普通对话', hasReferences ? '已带参考图' : '建议补参考', '可继续细化'],
  };
}

export async function createVisualStageAssistantReply(input: VisualStageAssistantInput): Promise<VisualStageAssistantReply> {
  const baseUrl = process.env.AGENT_LLM_BASE_URL?.replace(/\/$/, '');
  const apiKey = process.env.AGENT_LLM_API_KEY;
  const model = process.env.AGENT_LLM_MODEL ?? 'deepseek-v4-flash';
  if (!baseUrl || !apiKey) return localReply(input);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              '你是 image-workbench 的中文创作助手，只服务图像创作决策。',
              '输出严格 JSON：{"title":"...","body":"...","chips":["..."]}。',
              '不要暴露 provider、base url、api key、debug payload、storage key。',
              '回答要短，给判断和下一步动作；不要假装已经看懂图片内容，只能基于用户给的引用标签和用途推断。',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify({
              intent: input.intent,
              generateMode: input.generateMode,
              references: input.references.map((item) => ({ label: item.label, role: item.role, title: item.title, hint: item.hint })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return localReply(input);
    const json: any = await response.json();
    const text = String(json?.choices?.[0]?.message?.content ?? '');
    const parsed = parseJsonObject(text);
    if (!parsed?.body) return localReply(input);
    return {
      provider: 'llm',
      title: sanitizeText(parsed.title, input.generateMode ? '出图前判断' : '创作判断').slice(0, 24),
      body: sanitizeText(parsed.body).slice(0, 420),
      chips: Array.isArray(parsed.chips) ? parsed.chips.slice(0, 4).map((chip: unknown) => sanitizeText(chip).slice(0, 12)).filter(Boolean) : ['真实助手'],
    };
  } catch {
    return localReply(input);
  }
}
