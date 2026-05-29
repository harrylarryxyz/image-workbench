'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const vi = {
  system: 'warm-editorial-board-v1 · 温润编辑式创作板 · 中文优先 · Paper 0 · Ink 900 · Coral 600 · Sage 600 · no pure black UI surfaces · UI is the frame, not the artwork',
  ratio: '70% Paper / 20% Ink / 7% Coral / 3% Sage',
  tokens: {
    paper: { 0: '#fffaf2', 1: '#fff1de', 2: '#e9d8c4', 3: '#d9c2a7' },
    ink: { 900: '#253048', 800: '#303b55', 700: '#45506a', 500: '#6b7488', 300: '#9ba4b3' },
    coral: { 700: '#9e574c', 600: '#b96a5c', 150: '#f2d6cf', 100: '#f8e3dd' },
    sage: { 700: '#486e64', 600: '#5b8277', 150: '#d6e7df', 100: '#e7f1ec' },
  },
  shell: 'relative min-w-0 overflow-hidden bg-[#fff1de] text-[#253048]',
  wash: 'absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(185,106,92,0.16),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(91,130,119,0.18),transparent_30%),linear-gradient(145deg,#fff1de_0%,#fffaf2_52%,#f7eadb_100%)]',
  grain: 'absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.13)_1px,transparent_0)] bg-[size:22px_22px] opacity-35 [mask-image:linear-gradient(to_bottom,rgba(37,48,72,0.62),rgba(37,48,72,0.04))]',
  paperPanel: 'border-[#e9d8c4]/90 bg-[#fffaf2]/92 shadow-[0_18px_45px_rgba(37,48,72,0.09)] backdrop-blur',
  raisedPanel: 'border-[#e9d8c4]/90 bg-[#fffaf2]/95 shadow-[0_24px_64px_rgba(37,48,72,0.12),0_8px_24px_rgba(37,48,72,0.08)]',
  primaryButton: 'rounded-full bg-[#253048] text-[#fffaf2] shadow-[0_14px_26px_rgba(37,48,72,0.20)] hover:bg-[#303b55]',
  softButton: 'rounded-full border-[#d9c2a7]/90 bg-[#fffaf2]/70 text-[#253048] hover:bg-[#fff1de]',
  coralPill: 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  sagePill: 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  inkPill: 'bg-[#253048] text-[#fffaf2]',
};

type MessageTone = 'user' | 'assistant' | 'suggestion' | 'reference' | 'drafts';

type AssistantMessage = {
  id: string;
  tone: MessageTone;
  title?: string;
  body: string;
  chips?: string[];
};

const quickPrompts = ['做封面', '换风格', '改背景', '参考这张', '出几版'];

const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    tone: 'assistant',
    title: '创作助手',
    body: '直接描述你想要的画面、用途或修改想法。你也可以先添加参考图，我会把描述和参考整理成一个可生成的创作案。',
    chips: ['自然语言开始', '参考图可选', '先看效果再细化'],
  },
  {
    id: 'example',
    tone: 'suggestion',
    title: '示例',
    body: '比如：做一张温柔高级的护肤品宣传图，适合小红书封面，背景干净，有一点杂志感。',
  },
];

function Glow({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[430px] rounded-[2.25rem] border border-[#d9c2a7]/80 bg-[#fffaf2]/72 p-2 shadow-[0_28px_80px_rgba(37,48,72,0.16)] md:max-w-[460px]">
    <div className="overflow-hidden rounded-[1.8rem] border border-[#e9d8c4] bg-[#fffaf2] shadow-[inset_0_1px_0_rgba(255,250,242,0.9)]">{children}</div>
  </div>;
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.tone === 'user';
  const isReference = message.tone === 'reference';
  const isDrafts = message.tone === 'drafts';
  return <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[88%] rounded-[1.35rem] border p-3 text-sm leading-6 shadow-[0_10px_26px_rgba(37,48,72,0.07)]',
        isUser && 'border-[#253048]/15 bg-[#253048] text-[#fffaf2]',
        message.tone === 'assistant' && 'border-[#e9d8c4] bg-[#fffaf2] text-[#45506a]',
        message.tone === 'suggestion' && 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
        isReference && 'border-[#d6e7df] bg-[#e7f1ec]/86 text-[#486e64]',
        isDrafts && 'w-full max-w-full border-[#f2d6cf] bg-[#f8e3dd]/70 text-[#45506a]',
      )}
    >
      {message.title ? <b className={cn('mb-1 block text-xs', isUser ? 'text-[#fffaf2]' : 'text-[#253048]')}>{message.title}</b> : null}
      <p>{message.body}</p>
      {isReference ? <div className="mt-3 grid grid-cols-[4.5rem_1fr] gap-3">
        <div className="aspect-[4/5] rounded-[1rem] border border-[#d6e7df] bg-[linear-gradient(145deg,#e7f1ec,#fffaf2_55%,#f8e3dd)]" />
        <div className="grid content-center gap-1 text-xs text-[#6b7488]">
          <span>已添加参考图</span>
          <span>下一步可描述：保留什么、改变什么。</span>
        </div>
      </div> : null}
      {isDrafts ? <div className="mt-3 grid grid-cols-2 gap-2">
        {['初稿一', '初稿二', '初稿三', '初稿四'].map((label, index) => <div key={label} className="overflow-hidden rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2]">
          <div className={cn('aspect-square', index % 3 === 0 && 'bg-[linear-gradient(145deg,#fff1de,#f8e3dd)]', index % 3 === 1 && 'bg-[linear-gradient(145deg,#e7f1ec,#fffaf2)]', index % 3 === 2 && 'bg-[linear-gradient(145deg,#eef0f4,#fff1de)]')} />
          <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs">
            <span className="text-[#253048]">{label}</span>
            <span className="text-[#b96a5c]">加到画布</span>
          </div>
        </div>)}
      </div> : null}
      {message.chips?.length ? <div className="mt-3 flex flex-wrap gap-1.5">
        {message.chips.map((chip) => <Badge key={chip} variant="outline" className={cn('rounded-full px-2 py-0.5 text-[0.68rem]', isUser ? 'border-[#fffaf2]/30 bg-[#fffaf2]/10 text-[#fffaf2]' : 'border-[#e9d8c4] bg-[#fff1de]/70 text-[#45506a]')}>{chip}</Badge>)}
      </div> : null}
    </div>
  </div>;
}

function CanvasPreview() {
  return <Card data-testid="mobile-canvas-preview" className={cn('rounded-[1.6rem]', vi.paperPanel)}>
    <CardContent className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <b className="block text-[#253048]">轻量画布预告</b>
          <span className="text-xs text-[#6b7488]">生成后自动形成创作路径</span>
        </div>
        <Badge variant="outline" className={cn('rounded-full px-3 py-1', vi.sagePill)}>可后续编辑</Badge>
      </div>
      <div className="relative min-h-56 overflow-hidden rounded-[1.35rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-4">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.16)_1px,transparent_0)] bg-[size:18px_18px] opacity-35" />
        <div className="relative grid gap-3">
          <div className="w-[72%] rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2] p-3 text-xs text-[#45506a] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">创作意图</div>
          <div className="ml-auto w-[70%] rounded-[1rem] border border-[#d6e7df] bg-[#e7f1ec] p-3 text-xs text-[#486e64] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">参考图 / 建议方向</div>
          <div className="w-[78%] rounded-[1rem] border border-[#f2d6cf] bg-[#f8e3dd] p-3 text-xs text-[#9e574c] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">生成初稿</div>
          <div className="ml-auto w-[64%] rounded-[1rem] border border-[#253048]/20 bg-[#253048] p-3 text-xs text-[#fffaf2] shadow-[0_10px_24px_rgba(37,48,72,0.12)]">选为主图</div>
        </div>
      </div>
    </CardContent>
  </Card>;
}

export function VisualStageClient() {
  const [intent, setIntent] = useState('');
  const [hasReference, setHasReference] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  const messages = useMemo<AssistantMessage[]>(() => {
    const next = [...initialMessages];
    if (hasReference) {
      next.push({
        id: 'reference',
        tone: 'reference',
        title: '参考图',
        body: '参考图已经放进当前创作案。',
      });
    }
    if (intent.trim()) {
      next.push({
        id: 'user-intent',
        tone: 'user',
        body: intent.trim(),
      });
      next.push({
        id: 'assistant-brief',
        tone: 'assistant',
        title: '我先这样理解',
        body: '你想先得到一组可判断的初稿。我会保留你的核心描述，把用途、气质、参考图和下一步生成动作整理在一起。',
        chips: ['可直接出初稿', hasReference ? '已包含参考图' : '可继续补参考图', '结果会进入画布'],
      });
    }
    if (showDrafts) {
      next.push({
        id: 'drafts',
        tone: 'drafts',
        title: '初稿占位',
        body: '原型阶段先展示生成后的呈现方式，不接真实 AI，也不消耗生图额度。',
      });
    }
    return next;
  }, [hasReference, intent, showDrafts]);

  function addQuickPrompt(prompt: string) {
    setIntent((current) => current.trim() ? `${current}，${prompt}` : prompt);
  }

  return <section data-testid="visual-stage-shell" data-vi="warm-editorial-board-v1" aria-label={vi.system} className={vi.shell}>
    <div aria-hidden="true" className={vi.wash} />
    <div aria-hidden="true" className={vi.grain} />
    <Glow className="-left-20 top-10 h-72 w-72 bg-[#f8e3dd]/72" />
    <Glow className="right-0 top-24 h-72 w-72 bg-[#e7f1ec]/80" />

    <div className="relative z-10 mx-auto grid max-w-6xl gap-5 px-4 py-5 md:grid-cols-[minmax(360px,0.74fr)_minmax(0,1fr)] md:px-8 md:py-8">
      <div className="grid content-start gap-5 md:sticky md:top-6">
        <div className="grid gap-3 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('rounded-full px-3 py-1 text-xs', vi.inkPill)}>创作中心原型</Badge>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-xs', vi.coralPill)}>移动端优先</Badge>
            <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-3 py-1 text-xs text-[#45506a]">中文优先</Badge>
          </div>
          <h1 className="text-4xl font-extrabold leading-[0.98] tracking-[-0.07em] text-[#253048] md:text-6xl">
            先把一句想法变成可看的初稿
          </h1>
          <p className="max-w-xl text-sm leading-7 text-[#6b7488] md:text-base">
            本切片只固定创作助手模块：用户通过对话描述、添加参考图、查看建议和初稿占位。暂不接真实 AI，不跑完整生图流程。
          </p>
        </div>
        <CanvasPreview />
      </div>

      <PhoneFrame>
        <div className="flex min-h-[780px] flex-col bg-[#fffaf2]">
          <div className="border-b border-[#e9d8c4] bg-[#fffaf2]/92 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#6b7488]">新的创作</p>
                <h2 className="text-xl font-bold tracking-[-0.045em] text-[#253048]">创作助手</h2>
              </div>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', vi.sagePill)}>原型</Badge>
            </div>
          </div>

          <div data-testid="creation-assistant-thread" className="flex-1 space-y-3 overflow-hidden bg-[#fff1de]/45 px-3 py-4">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          </div>

          <div data-testid="creation-assistant-composer" className="border-t border-[#e9d8c4] bg-[#fffaf2] p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => <Button key={prompt} type="button" variant="outline" size="sm" className={cn('h-8 shrink-0 px-3 text-xs', vi.softButton)} onClick={() => addQuickPrompt(prompt)}>{prompt}</Button>)}
            </div>
            <div className="rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2] p-2 shadow-[0_10px_26px_rgba(37,48,72,0.07)]">
              <Textarea
                aria-label="描述你想创作的画面"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                placeholder="描述你想要的画面、用途或修改想法…"
                className="min-h-24 resize-none border-0 bg-transparent px-2 text-base text-[#253048] shadow-none placeholder:text-[#9ba4b3] focus-visible:ring-0"
              />
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className={cn('px-3', vi.softButton)} onClick={() => setHasReference(true)}>＋参考图</Button>
                <Button type="button" size="sm" className={cn('px-4', vi.primaryButton)} disabled={!intent.trim() && !hasReference} onClick={() => setShowDrafts(true)}>生成初稿</Button>
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  </section>;
}
