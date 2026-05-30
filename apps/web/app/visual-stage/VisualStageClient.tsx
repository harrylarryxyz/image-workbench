'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiFormPost, apiPost } from '@/lib/api';
import { subscribeTaskEvents, pollTaskUntilTerminal } from '@/lib/task-events';
import type { TaskImage, TaskResult, Uploaded } from '../create-types';
import { imageUrl } from '../create-utils';
import { cn } from '@/lib/utils';
import { CreationBoard } from './creation-board/CreationBoard';

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
type MessageTone = 'user' | 'assistant' | 'suggestion' | 'reference' | 'drafts' | 'notice';

type ReferenceToken = {
  id: string;
  label: string;
  source: ReferenceSource;
  title: string;
  hint: string;
  role?: string;
  storageKey?: string;
  assetUrl?: string;
};

type Draft = {
  id: string;
  taskId?: string;
  status: string;
  image?: TaskImage;
  images?: TaskImage[];
  championIndex?: number;
  error?: string | null;
};

type CanvasItem = {
  id: string;
  title: string;
  image?: TaskImage;
  intent?: string;
  references?: ReferenceToken[];
  branchCount?: number;
};

type AssistantMessage = {
  id: string;
  tone: MessageTone;
  title?: string;
  body: string;
  chips?: string[];
  references?: ReferenceToken[];
  draft?: Draft;
  onCommitDraft?: (draft: Draft) => void;
  onSelectChampion?: (draft: Draft, index: number) => void;
  onContinueEdit?: (draft: Draft) => void;
  createdAt?: number;
};

type ConversationEntry = {
  id: string;
  tone: 'user' | 'assistant';
  title?: string;
  body: string;
  chips?: string[];
  createdAt: number;
};

type DraftMessage = AssistantMessage & { tone: 'drafts'; draft: Draft };

type PersistedVisualStageSession = {
  intent: string;
  references: ReferenceToken[];
  generateMode: boolean;
  showDrafts: boolean;
  draft: Draft | null;
  draftMessages: DraftMessage[];
  canvasItems: CanvasItem[];
  conversation: ConversationEntry[];
};

const sessionStorageKey = 'image-workbench.visual-stage.session.v1';

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

const referenceRoles = ['构图', '人物', '色调', '风格', '产品', '背景'];

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

function humanError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = message.match(/failed:\s*(\d{3})/)?.[1];
  if (status) return `生成请求失败：服务返回 ${status}，请稍后重试或检查配置。`;
  return message.replace(/POST .* failed: /, '生成请求失败：');
}

function fileNameFromDraft(draft: Draft) {
  const key = draft.image?.storageKey ?? draft.image?.assetUrl ?? '生成草稿';
  const name = decodeURIComponent(key.split('?')[0]).split('/').pop() ?? '生成草稿';
  return name.length > 34 ? `${name.slice(0, 18)}…${name.slice(-12)}` : name;
}

function buildReferenceGuidance(references: ReferenceToken[]) {
  const roleCopy: Record<string, string> = {
    构图: '作为构图参考，优先学习画面结构、景别和留白关系',
    人物: '作为人物参考，优先保持人物姿态、气质和身份一致性',
    色调: '只作为色调参考，提取冷暖、明暗和饱和度气质，不改变主体',
    风格: '只作为风格参考，提取材质、镜头感和设计语言，不复制具体内容',
    产品: '作为产品参考，优先保持主体和关键细节',
    背景: '作为背景参考，服务主体但不抢画面中心',
  };
  const lines = references.map((reference) => `${reference.label} ${roleCopy[reference.role ?? ''] ?? '作为参考图使用，先确认它负责的用途再生成'}`);
  return lines.length ? `参考使用规则：${lines.join('；')}。` : '';
}

function assetSrc(assetUrl?: string) {
  if (!assetUrl) return undefined;
  if (assetUrl.startsWith('/api/')) return assetUrl;
  if (assetUrl.startsWith('/assets/')) return `/api${assetUrl}`;
  return assetUrl;
}

function referencePreviewSrc(reference: ReferenceToken) {
  return assetSrc(reference.assetUrl) ?? (reference.storageKey ? `/api/assets/file?key=${encodeURIComponent(reference.storageKey)}` : undefined);
}

function draftStatusSummary(draft: Draft) {
  if (draft.status === 'SUCCEEDED') {
    const count = draft.images?.length ?? (draft.image ? 1 : 1);
    return `生成完成 · ${Math.max(count, 1)} 张候选`;
  }
  if (draft.status === 'FAILED') return '生成失败';
  if (draft.status === 'CANCELLED') return '已取消';
  if (draft.status === 'QUEUED') return '已提交生成';
  return '生成中';
}

function createAssistantSuggestion(intent: string, references: ReferenceToken[], generateMode: boolean, createdAt = Date.now()): ConversationEntry {
  const hasReference = references.length > 0;
  const useCase = /小红书|封面|海报|宣传|首图/.test(intent) ? '使用场景已经比较明确' : '使用场景还可以再补一句';
  const referenceHint = hasReference ? `已识别 ${references.map((item) => item.label).join('、')}，出图时会把这些参考图作为画面锚点。` : '建议补充一张参考图或一句风格锚点，这样第一张会更接近你想要的感觉。';
  return {
    id: `assistant-${createdAt}`,
    tone: 'assistant',
    title: generateMode ? '出图前建议' : '助手建议',
    body: `针对「${intent}」：${useCase}。${referenceHint} 建议补充：主体、画面比例、发布渠道和不能改变的元素。${generateMode ? '我会先生成草稿，确认后再加入画布。' : '如果只是讨论，我不会消耗生图额度；打开出图后再生成。'}`,
    chips: [generateMode ? '准备出图' : '普通对话', hasReference ? '已带参考图' : '建议补参考', '建议补充'],
    createdAt,
  };
}

function loadPersistedSession(): Partial<PersistedVisualStageSession> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    return raw ? JSON.parse(raw) as Partial<PersistedVisualStageSession> : null;
  } catch {
    return null;
  }
}

function savePersistedSession(session: PersistedVisualStageSession) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  } catch {
    // localStorage can be unavailable in private mode; keep the live session usable.
  }
}

function Glow({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[430px] rounded-[2.25rem] border border-[#d9c2a7]/80 bg-[#fffaf2]/72 p-2 shadow-[0_28px_80px_rgba(37,48,72,0.16)] md:max-w-[460px]">
    <div className="overflow-hidden rounded-[1.8rem] border border-[#e9d8c4] bg-[#fffaf2] shadow-[inset_0_1px_0_rgba(255,250,242,0.9)]">{children}</div>
  </div>;
}

function ReferenceThumb({ reference, compact = false, tray = false, onRemove }: { reference: ReferenceToken; compact?: boolean; tray?: boolean; onRemove?: (id: string) => void }) {
  const src = referencePreviewSrc(reference);
  if (tray) {
    return <div data-testid="reference-token" className={cn('inline-flex h-9 w-[9rem] shrink-0 items-center justify-between gap-1 rounded-full border px-2 text-xs', sourceClass[reference.source])}>
      {src ? <img src={src} alt={`${reference.label} 缩略图`} className="h-7 w-7 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border border-current/15 bg-[#fffaf2]/60" />}
      <span className="min-w-0 flex-1 truncate font-semibold">{reference.label}</span>
      {onRemove ? <Button type="button" variant="ghost" size="icon" aria-label={`删除 ${reference.label}`} className="h-5 w-5 shrink-0 rounded-full p-0 text-xs opacity-70" onClick={() => onRemove(reference.id)}>×</Button> : null}
      <Button type="button" variant="ghost" size="sm" aria-label={`${reference.label} 用途`} className="h-6 shrink-0 rounded-full px-1.5 text-[0.62rem] opacity-80" onClick={() => onRemove?.(`${reference.id}:role`)}>{reference.role ?? '用途'}</Button>
    </div>;
  }
  return <div className={cn('rounded-[1rem] border p-2', sourceClass[reference.source], 'min-w-0')}>
    <div className="flex min-w-0 items-center gap-2">
      <div className={cn('shrink-0 overflow-hidden rounded-[0.75rem] border border-current/15 bg-[linear-gradient(145deg,#fffaf2,#f8e3dd_48%,#e7f1ec)]', compact ? 'h-9 w-9' : 'h-12 w-12')}>
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-xs">{reference.label}</b>
        <span className="block truncate text-[0.68rem] opacity-75">{reference.title}</span>
      </div>
    </div>
  </div>;
}

function DraftCard({ draft, onCommitDraft, onSelectChampion, onContinueEdit }: { draft: Draft; onCommitDraft?: (draft: Draft) => void; onSelectChampion?: (draft: Draft, index: number) => void; onContinueEdit?: (draft: Draft) => void }) {
  const images = draft.images?.length ? draft.images : draft.image ? [draft.image] : [];
  const championIndex = Math.min(draft.championIndex ?? 0, Math.max(images.length - 1, 0));
  const champion = images[championIndex];
  const url = imageUrl(champion);
  const done = draft.status === 'SUCCEEDED' && champion;
  const displayDraft = { ...draft, image: champion };
  const summary = draftStatusSummary(displayDraft);
  return <div data-testid="draft-card" className="mt-3 min-w-0 overflow-hidden rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2]">
    <div className="grid aspect-square place-items-center bg-[linear-gradient(145deg,#fff1de,#f8e3dd)] text-xs text-[#9e574c]">
      {url ? <img src={url} alt="真实生成草稿" className="h-full w-full object-cover" /> : draft.status === 'FAILED' ? '生成失败' : '生成中'}
    </div>
    <div className="grid gap-2 px-2 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[#253048]">{summary}</span>
        <span className="shrink-0 text-[#b96a5c]">{done ? '可确认' : '等待结果'}</span>
      </div>
      {images.length > 1 ? <div className="grid gap-2">
        <div className="flex items-center justify-between text-[#6b7488]"><span>比较草稿</span><b className="text-[#9e574c]">冠军图 {championIndex + 1}</b></div>
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => <Button key={image.storageKey ?? index} type="button" variant="outline" size="sm" aria-label={`选择第 ${index + 1} 张为冠军图`} className={cn('h-8 rounded-full text-xs', index === championIndex ? vi.coralPill : vi.softButton)} onClick={() => onSelectChampion?.(draft, index)}>第 {index + 1} 张</Button>)}
        </div>
      </div> : null}
      {draft.error ? <span className="text-[#9e574c]">{draft.error}</span> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" className={cn('h-8 text-xs', vi.softButton)} disabled={!done} onClick={() => onContinueEdit?.(displayDraft)}>继续改</Button>
        <Button type="button" size="sm" className={cn('h-8 text-xs', vi.primaryButton)} disabled={!done} onClick={() => onCommitDraft?.(displayDraft)}>加入画布</Button>
      </div>
    </div>
  </div>;
}

function MessageBubble({ message, onChipClick }: { message: AssistantMessage; onChipClick?: (chip: string) => void }) {
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
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-[#d6e7df] bg-[linear-gradient(145deg,#e7f1ec,#fffaf2_55%,#f8e3dd)]">
            {referencePreviewSrc(reference) ? <img src={referencePreviewSrc(reference)} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="grid content-center gap-1 text-xs text-[#6b7488]">
            <span>{reference.title}</span>
            <span>{reference.hint}</span>
          </div>
        </div>)}
      </div> : null}
      {isDrafts ? <>
        {message.draft ? <DraftCard draft={message.draft} onCommitDraft={message.onCommitDraft} onSelectChampion={message.onSelectChampion} onContinueEdit={message.onContinueEdit} /> : <div className="mt-3 grid grid-cols-2 gap-2">
          {['初稿一', '初稿二', '初稿三', '初稿四'].map((label, index) => <div key={label} className="overflow-hidden rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2]">
            <div className={cn('aspect-square', index % 3 === 0 && 'bg-[linear-gradient(145deg,#fff1de,#f8e3dd)]', index % 3 === 1 && 'bg-[linear-gradient(145deg,#e7f1ec,#fffaf2)]', index % 3 === 2 && 'bg-[linear-gradient(145deg,#eef0f4,#fff1de)]')} />
            <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs">
              <span className="text-[#253048]">{label}</span>
              <span className="text-[#b96a5c]">加入画布</span>
            </div>
          </div>)}
        </div>}
      </> : null}
      {message.chips?.length ? <div className="mt-3 flex flex-wrap gap-1.5">
        {message.chips.map((chip) => onChipClick && !isUser ? <Button key={chip} type="button" variant="outline" size="sm" className={cn('h-auto rounded-full px-2 py-0.5 text-[0.68rem]', 'border-[#e9d8c4] bg-[#fff1de]/70 text-[#45506a] hover:bg-[#fffaf2]')} onClick={() => onChipClick(chip)}>{chip}</Button> : <Badge key={chip} variant="outline" className={cn('rounded-full px-2 py-0.5 text-[0.68rem]', isUser ? 'border-[#fffaf2]/30 bg-[#fffaf2]/10 text-[#fffaf2]' : 'border-[#e9d8c4] bg-[#fff1de]/70 text-[#45506a]')}>{chip}</Badge>)}
      </div> : null}
    </div>
  </div>;
}

function CanvasPreview({ items, onReuse }: { items: CanvasItem[]; onReuse?: (item: CanvasItem) => void }) {
  const latest = items[0];
  return <Card data-testid="mobile-canvas-preview" className={cn('rounded-[1.6rem]', vi.paperPanel)}>
    <CardContent className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <b className="block text-[#253048]">Creation Board</b>
          <span className="text-xs text-[#6b7488]">创作案画布：意图、参考、冠军图和分支都在这里沉淀</span>
        </div>
        <Badge variant="outline" className={cn('rounded-full px-3 py-1', latest ? vi.coralPill : vi.sagePill)}>{latest ? '已加入画布' : '不污染画布'}</Badge>
      </div>
      <div className="relative min-h-56 overflow-hidden rounded-[1.35rem] border border-[#e9d8c4] bg-[#fff1de]/70 p-4">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.16)_1px,transparent_0)] bg-[size:18px_18px] opacity-35" />
        {latest ? <div className="relative grid gap-3">
          <div className="rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2] p-3 text-xs text-[#45506a] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">
            <b className="mb-1 block text-[#253048]">创作目标</b>
            <span>{latest.intent ?? '已确认的创作目标'}</span>
          </div>
          {latest.references?.length ? <div className="flex gap-2 overflow-x-auto pb-1">
            {latest.references.map((reference) => <Badge key={reference.id} variant="outline" className={cn('shrink-0 rounded-full px-2 py-1 text-[0.68rem]', vi.sagePill)}>{reference.label} · {reference.role ?? '参考'}</Badge>)}
          </div> : null}
          <div className="overflow-hidden rounded-[1rem] border border-[#f2d6cf] bg-[#fffaf2] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">
            <div className="aspect-[4/3] bg-[linear-gradient(145deg,#fff1de,#f8e3dd)]">{imageUrl(latest.image) ? <img src={imageUrl(latest.image) ?? ''} alt="已加入画布" className="h-full w-full object-cover" /> : null}</div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[#253048]">
              <span className="min-w-0 truncate">主图 · {latest.title}</span>
              <Badge variant="outline" className={cn('shrink-0 rounded-full px-2 py-0.5', vi.coralPill)}>分支 {latest.branchCount ?? 0}</Badge>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className={cn('h-8 rounded-full text-xs', vi.softButton)} onClick={() => latest && onReuse?.(latest)}>把主图作为参考</Button>
        </div> : <div className="relative grid gap-3">
          <div className="w-[72%] rounded-[1rem] border border-[#e9d8c4] bg-[#fffaf2] p-3 text-xs text-[#45506a] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">创作意图</div>
          <div className="ml-auto w-[70%] rounded-[1rem] border border-[#d6e7df] bg-[#e7f1ec] p-3 text-xs text-[#486e64] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">@图片 引用关系</div>
          <div className="w-[78%] rounded-[1rem] border border-[#f2d6cf] bg-[#f8e3dd] p-3 text-xs text-[#9e574c] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">对话流里的生成草稿</div>
          <div className="ml-auto w-[64%] rounded-[1rem] border border-[#253048]/20 bg-[#253048] p-3 text-xs text-[#fffaf2] shadow-[0_10px_24px_rgba(37,48,72,0.12)]">确认后加入画布</div>
        </div>}
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
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftMessages, setDraftMessages] = useState<DraftMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const lastIntentRef = useRef('');
  const lastReferencesRef = useRef<ReferenceToken[]>([]);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const persisted = loadPersistedSession();
    if (!persisted) return;
    setIntent(persisted.intent ?? '');
    setReferences(persisted.references ?? []);
    setGenerateMode(Boolean(persisted.generateMode));
    setShowDrafts(Boolean(persisted.showDrafts));
    setDraft(persisted.draft ?? null);
    setDraftMessages(persisted.draftMessages ?? []);
    setCanvasItems(persisted.canvasItems ?? []);
    setConversation(persisted.conversation ?? []);
    if (persisted.draft?.taskId && !['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(persisted.draft.status)) watchTask(persisted.draft.taskId);
    // Hydrate client-only persisted session once after SSR.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    savePersistedSession({ intent, references, generateMode, showDrafts, draft, draftMessages, canvasItems, conversation });
  }, [canvasItems, conversation, draft, draftMessages, generateMode, intent, references, showDrafts]);

  function appendToken(reference: ReferenceToken) {
    setIntent((current) => {
      const spacer = current.trim().length ? ' ' : '';
      return `${current}${spacer}${reference.label} `;
    });
  }

  function pushReference(reference: ReferenceToken) {
    setReferences((current) => [...current, reference]);
    appendToken(reference);
    setShowMentionPicker(false);
  }

  function addReference(source: ReferenceSource, title?: string, hint?: string) {
    const nextNumber = references.length + 1;
    pushReference({
      id: `${source}-${nextNumber}`,
      label: `@图片${nextNumber}`,
      source,
      title: title ?? `本地新图片 ${nextNumber}`,
      hint: hint ?? '＋号偏向添加本地新图片；当前为轻量前端引用，上传后可参与真实生成。',
    });
  }

  function removeReference(id: string) {
    if (id.includes(':role:')) {
      const [targetId, , role] = id.split(':');
      setReferences((current) => current.map((reference) => reference.id === targetId ? { ...reference, role } : reference));
      return;
    }
    if (id.endsWith(':role')) {
      const targetId = id.replace(':role', '');
      setReferences((current) => current.map((reference) => {
        if (reference.id !== targetId) return reference;
        const nextIndex = (referenceRoles.indexOf(reference.role ?? '') + 1) % referenceRoles.length;
        return { ...reference, role: referenceRoles[nextIndex] };
      }));
      return;
    }
    const removed = references.find((reference) => reference.id === id);
    setReferences((current) => current.filter((reference) => reference.id !== id));
    if (removed) setIntent((current) => current.replaceAll(removed.label, '').replace(/\s{2,}/g, ' ').trimStart());
  }

  async function onLocalImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const nextNumber = references.length + 1;
    const fallbackReference: ReferenceToken = {
      id: `local-${nextNumber}`,
      label: `@图片${nextNumber}`,
      source: 'local',
      title: file.name,
      hint: '本地图片上传中；上传完成后可作为真实参考图。',
    };
    try {
      const form = new FormData();
      form.set('file', file);
      const uploaded = await apiFormPost<Uploaded>('/assets/upload', form);
      pushReference({ ...fallbackReference, title: uploaded.originalName ?? file.name, hint: '本地图片已上传，出图时会作为参考图传入。', storageKey: uploaded.storageKey, assetUrl: uploaded.assetUrl });
    } catch (error) {
      pushReference({ ...fallbackReference, hint: humanError(error) });
    }
  }

  function watchTask(id: string) {
    let fallbackStarted = false;
    const onTask = (task: TaskResult) => {
      const images = task.images ?? [];
      const image = images[0];
      const nextDraft = { id, taskId: task.id ?? id, status: task.status ?? 'RUNNING', image, images, championIndex: 0, error: task.errorMessage ?? task.error ?? null };
      setDraft(nextDraft);
      setDraftMessages((current) => current.map((message) => message.draft.taskId === id || message.draft.id === id ? { ...message, body: task.status === 'SUCCEEDED' ? `${draftStatusSummary(nextDraft)}。先选冠军图，确认后再加入画布。` : '已进入真实生成流程，等待任务返回。', draft: { ...message.draft, ...nextDraft, championIndex: message.draft.championIndex ?? 0 }, onCommitDraft: commitDraft, onSelectChampion: selectChampion, onContinueEdit: continueEdit } : message));
    };
    const fallback = async () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      await pollTaskUntilTerminal<TaskResult>(id, onTask);
    };
    const unsubscribe = subscribeTaskEvents<TaskResult>(id, (task) => {
      onTask(task);
      if (['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(task.status ?? '')) unsubscribe();
    }, fallback);
  }

  async function requestAssistantSuggestion(userBody: string, refs: ReferenceToken[], wantsGeneration: boolean, createdAt: number) {
    try {
      const reply = await apiPost<{ provider: 'llm' | 'local'; title: string; body: string; chips?: string[] }>('/agent/visual-stage/reply', {
        intent: userBody,
        references: refs.map((reference) => ({ label: reference.label, title: reference.title, hint: reference.hint, role: reference.role })),
        generateMode: wantsGeneration,
      });
      setConversation((current) => [...current, { id: `assistant-${createdAt + 1}`, tone: 'assistant', title: reply.title, body: reply.body, chips: reply.chips ?? [reply.provider === 'llm' ? '真实助手' : '本地兜底'], createdAt: createdAt + 1 }]);
    } catch {
      setConversation((current) => [...current, createAssistantSuggestion(userBody, refs, wantsGeneration, createdAt + 1)]);
    }
  }

  async function submit() {
    if (!intent.trim() && !references.length) return;
    const userBody = intent.trim() || references.map((reference) => reference.label).join('、');
    const timestamp = Date.now();
    setConversation((current) => [
      ...current,
      { id: `user-${timestamp}`, tone: 'user', body: userBody, createdAt: timestamp },
    ]);
    if (!generateMode) void requestAssistantSuggestion(userBody, references, generateMode, timestamp);
    setShowDrafts(true);
    setIntent('');
    if (!generateMode) return;
    setLoading(true);
    setDraft({ id: 'pending', status: 'QUEUED' });
    try {
      const refKeys = references.map((reference) => reference.storageKey).filter(Boolean) as string[];
      const endpoint = refKeys.length ? '/tasks/edit' : '/tasks/generate';
      const prompt = `${intent.trim()}\n${buildReferenceGuidance(references)}`.trim();
      lastIntentRef.current = intent.trim();
      lastReferencesRef.current = references;
      const payload = refKeys.length
        ? { prompt, model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png', background: 'auto', apiMode: 'auto', refKeys, count: 2, timeoutSec: 600 }
        : { prompt, model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 };
      const created = await apiPost<TaskResult>(endpoint, payload);
      const initialImages = created.images ?? [];
      const initialDraft = { id: created.id ?? 'draft', taskId: created.id, status: created.status ?? 'QUEUED', image: initialImages[0], images: initialImages, championIndex: 0 };
      setDraft(initialDraft);
      setDraftMessages((current) => [...current, { id: `draft-${created.id ?? Date.now()}`, tone: 'drafts', title: '真实生成草稿', body: '已进入真实生成流程，等待任务返回。', draft: initialDraft, onCommitDraft: commitDraft, onSelectChampion: selectChampion, onContinueEdit: continueEdit, createdAt: Date.now() }]);
      if (created.id) watchTask(created.id);
    } catch (error) {
      setDraft({ id: 'failed', status: 'FAILED', error: humanError(error) });
    } finally {
      setLoading(false);
    }
  }

  function commitDraft(nextDraft: Draft) {
    if (!nextDraft.image) return;
    setCanvasItems((current) => [{ id: nextDraft.image?.storageKey ?? nextDraft.id, title: fileNameFromDraft(nextDraft), image: nextDraft.image, intent: lastIntentRef.current, references: lastReferencesRef.current, branchCount: current.length + 1 }, ...current]);
  }

  function reuseCanvasImage(item: CanvasItem) {
    if (!item.image) return;
    const nextNumber = references.length + 1;
    pushReference({ id: `canvas-${nextNumber}`, label: `@图片${nextNumber}`, source: 'history', title: item.title, hint: '来自 Creation Board 主图，可继续作为风格或成片参考。', role: '风格', storageKey: item.image.storageKey, assetUrl: item.image.assetUrl });
  }

  function selectChampion(nextDraft: Draft, index: number) {
    setDraft((current) => current && (current.id === nextDraft.id || current.taskId === nextDraft.taskId) ? { ...current, championIndex: index, image: current.images?.[index] ?? current.image } : current);
    setDraftMessages((current) => current.map((message) => message.draft.id === nextDraft.id || message.draft.taskId === nextDraft.taskId ? { ...message, draft: { ...message.draft, championIndex: index, image: message.draft.images?.[index] ?? message.draft.image } } : message));
  }

  function continueEdit(nextDraft: Draft) {
    const championIndex = nextDraft.championIndex ?? 0;
    setIntent(`继续优化冠军图 ${championIndex + 1}：保留当前主体和构图，调整为更温润、更适合发布的版本`);
    setGenerateMode(true);
  }

  function applyChipSuggestion(chip: string) {
    setIntent((current) => current.trim() ? `${current.trim()} ${chip}` : chip);
  }

  const messages = useMemo<AssistantMessage[]>(() => {
    const committed = [...conversation, ...draftMessages].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    return [...initialMessages, ...committed];
  }, [conversation, draftMessages]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    requestAnimationFrame(() => {
      thread.scrollTop = thread.scrollHeight;
    });
  }, [messages.length]);

  return <section data-testid="visual-stage-shell" data-vi="warm-editorial-board-v1" aria-label={vi.system} className={vi.shell}>
    <div aria-hidden="true" className={vi.wash} />
    <div aria-hidden="true" className={vi.grain} />
    <Glow className="left-0 top-10 h-72 w-72 bg-[#f8e3dd]/72" />
    <Glow className="right-0 top-24 h-72 w-72 bg-[#e7f1ec]/80" />

    <div className="relative z-10 mx-auto grid max-w-[1680px] gap-5 px-4 py-5 md:px-8 md:py-8">
      <div className="grid gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn('rounded-full px-3 py-1 text-xs', vi.inkPill)}>创作中心原型</Badge>
          <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-xs', vi.coralPill)}>移动端优先</Badge>
          <Badge variant="outline" className="rounded-full border-[#e9d8c4] bg-[#fff1de] px-3 py-1 text-xs text-[#45506a]">中文优先</Badge>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.72fr)_minmax(340px,0.28fr)] xl:items-end">
          <div className="grid gap-3">
            <h1 className="max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.07em] text-[#253048] md:text-6xl">
              先把一句想法变成可看的初稿，再沉淀成可操作的创作案板
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#6b7488] md:text-base">
              本切片把移动端创作助手和 Lovart-like WYSIWYG 画布合并：＋添加本地新图片，@引用素材图片或对话历史图片；默认普通对话，打开出图后才进入生成草稿，草稿确认后进画布。
            </p>
          </div>
          <Card className={cn('rounded-[1.35rem]', vi.paperPanel)}>
            <CardContent className="grid gap-2 p-4 text-sm text-[#6b7488]">
              <b className="text-[#253048]">Live Board · 无限画布创作案板</b>
              <span>对话生成图会进入案板，作为可继续参考、可选中、可审美判断的图片对象。</span>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
        <CreationBoard canvasItems={canvasItems} onReuseCanvasItem={reuseCanvasImage} />

        <PhoneFrame>
          <div data-testid="visual-stage-phone" className="flex h-[780px] max-h-[calc(100vh-2rem)] min-h-[720px] flex-col bg-[#fffaf2]">
            <div className="shrink-0 border-b border-[#e9d8c4] bg-[#fffaf2]/92 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#6b7488]">新的创作</p>
                  <h2 className="text-xl font-bold tracking-[-0.045em] text-[#253048]">创作助手</h2>
                </div>
                <Badge variant="outline" className={cn('rounded-full px-3 py-1', generateMode ? vi.coralPill : vi.sagePill)}>{generateMode ? '出图开启' : '普通对话'}</Badge>
              </div>
            </div>

            <div ref={threadRef} data-testid="creation-assistant-thread" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#fff1de]/45 px-3 py-4">
              {messages.map((message) => <MessageBubble key={message.id} message={message} onChipClick={applyChipSuggestion} />)}
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
                <input ref={fileInputRef} aria-label="选择本地新图片" type="file" accept="image/*" className="sr-only" onChange={onLocalImageChange} />
                {references.length ? <div data-testid="composer-reference-tokens" className="mb-2 flex max-w-full gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1">
                  {references.map((reference) => <ReferenceThumb key={reference.id} reference={reference} compact tray onRemove={removeReference} />)}
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
                    <Button type="button" variant="outline" size="icon" aria-label="添加本地新图片" className={cn('h-9 w-9 text-lg', vi.softButton)} onClick={() => fileInputRef.current?.click()}>＋</Button>
                    <Button type="button" variant="outline" size="icon" aria-label="引用素材或历史图片" className={cn('h-9 w-9 text-base', vi.softButton)} onClick={() => setShowMentionPicker((current) => !current)}>@</Button>
                    <Button type="button" variant="outline" size="sm" className={cn('h-9 px-3 text-xs', vi.softButton)} onClick={() => setShowParams(true)}>参数</Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" aria-pressed={generateMode} className={cn('h-9 px-3 text-xs', generateMode ? vi.coralPill : vi.sagePill)} onClick={() => setGenerateMode((current) => !current)}>{generateMode ? '出图开' : '出图关'}</Button>
                    <Button type="button" size="sm" className={cn('h-9 px-4', vi.primaryButton)} disabled={loading || (!intent.trim() && !references.length)} onClick={submit}>{loading ? '提交中' : generateMode ? '发送出图' : '发送'}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  </section>;
}
