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

type ReferenceSource = 'local' | 'asset' | 'history';
type MessageTone = 'user' | 'assistant' | 'suggestion' | 'reference' | 'drafts';

type ReferenceToken = {
  id: string;
  label: string;
  source: ReferenceSource;
  title: string;
  hint: string;
};

type AssistantMessage = {
  id: string;
  tone: MessageTone;
  title?: string;
  body: string;
  chips?: string[];
  references?: ReferenceToken[];
};

const sourceLabel: Record<ReferenceSource, string> = {
  local: '本地新图片',
  asset: '素材图片',
  history: '历史图片',
};

const sourceClass: Record<ReferenceSource, string> = {
  local: 'border-[#f2d6cf] bg-[#f8e3dd] text-[#9e574c]',
  asset: 'border-[#d6e7df] bg-[#e7f1ec] text-[#486e64]',
  history: 'border-[#e9d8c4] bg-[#fff1de] text-[#45506a]',
};

const advancedReferences: Omit<ReferenceToken, 'id' | 'label'>[] = [
  { source: 'asset', title: '素材库：海报氛围图', hint: '引用素材图片，后续可扩展为素材库检索' },
  { source: 'history', title: '对话历史：上一张初稿', hint: '引用对话历史图片，后续可扩展为历史图选择器' },
];

const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    tone: 'assistant',
    title: '创作助手',
    body: '直接描述你想要的画面、用途或修改想法。＋适合添加本地新图片，@适合引用素材图片或对话历史图片。',
    chips: ['默认普通对话', '需要时打开出图', '草稿确认后进画布'],
  },
  {
    id: 'example',
    tone: 'suggestion',
    title: '示例',
    body: '比如：@图片1 保留人物姿态，换成温润杂志感的护肤品封面，背景更干净。',
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

function ReferenceThumb({ reference, compact = false }: { reference: ReferenceToken; compact?: boolean }) {
  return <div className={cn('min-w-0 rounded-[1rem] border p-2', sourceClass[reference.source])}>
    <div className="flex min-w-0 items-center gap-2">
      <div className={cn('shrink-0 rounded-[0.75rem] border border-current/15 bg-[linear-gradient(145deg,#fffaf2,#f8e3dd_48%,#e7f1ec)]', compact ? 'h-9 w-9' : 'h-12 w-12')} />
      <div className="min-w-0">
        <b className="block truncate text-xs">{reference.label}</b>
        <span className="block truncate text-[0.68rem] opacity-75">{sourceLabel[reference.source]}</span>
      </div>
    </div>
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
      {message.references?.length ? <div className="mt-3 grid gap-2">
        {message.references.map((reference) => <ReferenceThumb key={reference.id} reference={reference} compact />)}
      </div> : null}
      {isReference ? <div className="mt-3 grid gap-2">
        {message.references?.map((reference) => <div key={reference.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
          <div className="aspect-[4/5] rounded-[1rem] border border-[#d6e7df] bg-[linear-gradient(145deg,#e7f1ec,#fffaf2_55%,#f8e3dd)]" />
          <div className="grid content-center gap-1 text-xs text-[#6b7488]">
            <span>{reference.title}</span>
            <span>{reference.hint}</span>
          </div>
        </div>)}
      </div> : null}
      {isDrafts ? <div className="mt-3 grid grid-cols-2 gap-2">
        {['初稿一', '初稿二', '初稿三', '初稿四'].map((label, index) => <div key={label} className="overflow-hidden rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2]">
          <div className={cn('aspect-square', index % 3 === 0 && 'bg-[linear-gradient(145deg,#fff1de,#f8e3dd)]', index % 3 === 1 && 'bg-[linear-gradient(145deg,#e7f1ec,#fffaf2)]', index % 3 === 2 && 'bg-[linear-gradient(145deg,#eef0f4,#fff1de)]')} />
          <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs">
            <span className="text-[#253048]">{label}</span>
            <span className="text-[#b96a5c]">加入画布</span>
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
          <span className="text-xs text-[#6b7488]">生成草稿确认后才加入画布</span>
        </div>
        <Badge variant="outline" className={cn('rounded-full px-3 py-1', vi.sagePill)}>不污染画布</Badge>
      </div>
      <div className="relative min-h-56 overflow-hidden rounded-[1.35rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-4">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.16)_1px,transparent_0)] bg-[size:18px_18px] opacity-35" />
        <div className="relative grid gap-3">
          <div className="w-[72%] rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2] p-3 text-xs text-[#45506a] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">创作意图</div>
          <div className="ml-auto w-[70%] rounded-[1rem] border border-[#d6e7df] bg-[#e7f1ec] p-3 text-xs text-[#486e64] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">@图片 引用关系</div>
          <div className="w-[78%] rounded-[1rem] border border-[#f2d6cf] bg-[#f8e3dd] p-3 text-xs text-[#9e574c] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">对话流里的生成草稿</div>
          <div className="ml-auto w-[64%] rounded-[1rem] border border-[#253048]/20 bg-[#253048] p-3 text-xs text-[#fffaf2] shadow-[0_10px_24px_rgba(37,48,72,0.12)]">确认后加入画布</div>
        </div>
      </div>
    </CardContent>
  </Card>;
}

export function VisualStageClient() {
  const [intent, setIntent] = useState('');
  const [references, setReferences] = useState<ReferenceToken[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [generateMode, setGenerateMode] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showParams, setShowParams] = useState(false);

  function appendToken(reference: ReferenceToken) {
    setIntent((current) => {
      const spacer = current.trim().length ? ' ' : '';
      return `${current}${spacer}${reference.label} `;
    });
  }

  function addReference(source: ReferenceSource, title?: string, hint?: string) {
    const nextNumber = references.length + 1;
    const reference: ReferenceToken = {
      id: `${source}-${nextNumber}`,
      label: `@图片${nextNumber}`,
      source,
      title: title ?? `本地新图片 ${nextNumber}`,
      hint: hint ?? '＋号偏向添加本地新图片；当前为原型占位，后续接真实上传。',
    };
    setReferences((current) => [...current, reference]);
    appendToken(reference);
    setShowMentionPicker(false);
  }

  const messages = useMemo<AssistantMessage[]>(() => {
    const next = [...initialMessages];
    if (references.length) {
      next.push({
        id: 'reference',
        tone: 'reference',
        title: '已添加到输入框',
        body: `${references.map((item) => item.label).join('、')} 已作为 token 放进描述里，发送后会和文字一起进入对话流。`,
        references,
      });
    }
    if (intent.trim()) {
      next.push({
        id: 'user-intent',
        tone: 'user',
        body: intent.trim(),
        references,
      });
      next.push({
        id: 'assistant-brief',
        tone: 'assistant',
        title: generateMode ? '出图前确认' : '我先这样理解',
        body: generateMode
          ? '出图开关已打开：发送后会进入生成草稿状态。草稿先留在对话流，确认“加入画布”后再进入画布。'
          : '当前是普通对话：我会先整理意图和参考关系，不会直接消耗生图额度。需要出图时再打开开关。',
        chips: [generateMode ? '出图已开启' : '普通对话', references.length ? '已包含 @图片 token' : '可继续补参考图', '草稿确认后进画布'],
      });
    }
    if (showDrafts && generateMode) {
      next.push({
        id: 'drafts',
        tone: 'drafts',
        title: '生成草稿占位',
        body: '原型阶段先展示生成后的呈现方式，不接真实 AI，也不消耗生图额度。',
      });
    }
    return next;
  }, [generateMode, intent, references, showDrafts]);

  return <section data-testid="visual-stage-shell" data-vi="warm-editorial-board-v1" aria-label={vi.system} className={vi.shell}>
    <div aria-hidden="true" className={vi.wash} />
    <div aria-hidden="true" className={vi.grain} />
    <Glow className="left-0 top-10 h-72 w-72 bg-[#f8e3dd]/72" />
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
            本切片固定移动端创作助手：＋添加本地新图片，@引用素材图片或对话历史图片；默认普通对话，打开出图后才进入生成草稿。
          </p>
        </div>
        <CanvasPreview />
      </div>

      <PhoneFrame>
        <div className="flex h-[780px] max-h-[calc(100vh-2rem)] min-h-[720px] flex-col bg-[#fffaf2]">
          <div className="shrink-0 border-b border-[#e9d8c4] bg-[#fffaf2]/92 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#6b7488]">新的创作</p>
                <h2 className="text-xl font-bold tracking-[-0.045em] text-[#253048]">创作助手</h2>
              </div>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', generateMode ? vi.coralPill : vi.sagePill)}>{generateMode ? '出图开启' : '普通对话'}</Badge>
            </div>
          </div>

          <div data-testid="creation-assistant-thread" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#fff1de]/45 px-3 py-4">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          </div>

          <div data-testid="creation-assistant-composer" className="relative shrink-0 border-t border-[#e9d8c4] bg-[#fffaf2] p-3">
            {showMentionPicker ? <div data-testid="mention-reference-picker" className={cn('absolute bottom-[calc(100%-0.35rem)] left-3 right-3 z-20 rounded-[1.35rem] border p-3', vi.raisedPanel)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <b className="text-sm text-[#253048]">@ 引用图片</b>
                <span className="text-xs text-[#6b7488]">素材 / 历史，后续拓展</span>
              </div>
              <div className="grid gap-2">
                {advancedReferences.map((item) => <Button key={item.title} type="button" variant="outline" className={cn('h-auto justify-start rounded-[1rem] px-3 py-2 text-left', vi.softButton)} onClick={() => addReference(item.source, item.title, item.hint)}>
                  <span className="grid gap-0.5">
                    <b className="text-xs">{item.title}</b>
                    <span className="text-[0.68rem] text-[#6b7488]">{item.hint}</span>
                  </span>
                </Button>)}
              </div>
            </div> : null}

            {showParams ? <div data-testid="generation-params-drawer" className={cn('absolute bottom-0 left-0 right-0 z-30 rounded-t-[1.6rem] border border-[#e9d8c4] bg-[#fffaf2] p-4 shadow-[0_-18px_50px_rgba(37,48,72,0.16)]')}>
              <div className="mb-3 flex items-center justify-between">
                <b className="text-[#253048]">出图参数</b>
                <Button type="button" variant="ghost" size="sm" className="rounded-full text-[#6b7488]" onClick={() => setShowParams(false)}>收起</Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#45506a]">
                {['尺寸 3:4', '数量 4张', '模型 自动', '风格强度 中', '参考权重 70%', '草稿先进对话'].map((item) => <div key={item} className="rounded-[1rem] border border-[#e9d8c4] bg-[#fff1de]/60 px-3 py-2">{item}</div>)}
              </div>
            </div> : null}

            <div className="rounded-[1.35rem] border border-[#e9d8c4] bg-[#fffaf2] p-2 shadow-[0_10px_26px_rgba(37,48,72,0.07)]">
              {references.length ? <div data-testid="composer-reference-tokens" className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {references.map((reference) => <ReferenceThumb key={reference.id} reference={reference} compact />)}
              </div> : null}
              <Textarea
                aria-label="描述你想创作的画面"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                placeholder="描述画面；用 @图片1 指定参考关系…"
                className="min-h-24 resize-none border-0 bg-transparent px-2 text-base text-[#253048] shadow-none placeholder:text-[#9ba4b3] focus-visible:ring-0"
              />
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="outline" size="icon" aria-label="添加本地新图片" className={cn('h-9 w-9 text-lg', vi.softButton)} onClick={() => addReference('local')}>＋</Button>
                  <Button type="button" variant="outline" size="icon" aria-label="引用素材或历史图片" className={cn('h-9 w-9 text-base', vi.softButton)} onClick={() => setShowMentionPicker((current) => !current)}>@</Button>
                  <Button type="button" variant="outline" size="sm" className={cn('h-9 px-3 text-xs', vi.softButton)} onClick={() => setShowParams(true)}>参数</Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" aria-pressed={generateMode} className={cn('h-9 px-3 text-xs', generateMode ? vi.coralPill : vi.sagePill)} onClick={() => setGenerateMode((current) => !current)}>{generateMode ? '出图开' : '出图关'}</Button>
                  <Button type="button" size="sm" className={cn('h-9 px-4', vi.primaryButton)} disabled={!intent.trim() && !references.length} onClick={() => setShowDrafts(true)}>{generateMode ? '发送出图' : '发送'}</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  </section>;
}
