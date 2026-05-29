import Link from 'next/link';
import type { ChangeEvent, DragEvent, RefObject, Dispatch, SetStateAction } from 'react';
import { StudioActionToolbar, StudioPanel, StudioPanelContent, StudioPanelHeader } from '@/components/product/studio';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import { PromptVariants } from './PromptVariants';
import { ReferenceDropzone } from './ReferenceDropzone';
import type { Variant } from './create-types';

type PromptComposerProps = {
  prompt: string;
  setPrompt: (value: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadingReference: boolean;
  referenceName: string;
  onReferenceFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropReference: (event: DragEvent<HTMLDivElement>) => void;
  makeVariants: () => void;
  variants: Variant[];
  advancedOpen: boolean;
  setAdvancedOpen: Dispatch<SetStateAction<boolean>>;
  model: string;
  setModel: (value: string) => void;
  size: string;
  setSize: (value: string) => void;
  quality: string;
  setQuality: (value: string) => void;
  format: string;
  setFormat: (value: string) => void;
  background: string;
  setBackground: (value: string) => void;
  apiMode: string;
  setApiMode: (value: string) => void;
  maskKey: string;
  setMaskKey: (value: string) => void;
  loading: boolean;
  referenceKey: string;
  submit: () => void;
};

export function PromptComposer(props: PromptComposerProps) {
  return <StudioPanel>
    <StudioPanelHeader
      eyebrow="Create Studio"
      title="What shall we create together?"
      description="默认只保留创作必需项；模型、尺寸、质量和格式统一收进高级设置。"
    />
    <StudioPanelContent>
      <div className="space-y-2">
        <Label htmlFor="prompt">画面描述</Label>
        <Textarea id="prompt" value={props.prompt} onChange={(e) => props.setPrompt(e.target.value)} className="min-h-48 rounded-3xl border-white/10 bg-black/30 p-5 text-base leading-7 shadow-inner" placeholder="你想创作什么？描述主体、风格、场景或上传参考图继续编辑。" />
      </div>
      <ReferenceDropzone fileInputRef={props.fileInputRef} uploadingReference={props.uploadingReference} referenceName={props.referenceName} onReferenceFileChange={props.onReferenceFileChange} onDropReference={props.onDropReference} />
      <StudioActionToolbar>
        <Button type="button" variant="secondary" onClick={props.makeVariants}>生成 Prompt 变体</Button>
        <Button asChild type="button" variant="outline"><Link href="/prompts">Prompt Library</Link></Button>
        <Button asChild type="button" variant="outline"><Link href="/gallery">从素材库选择</Link></Button>
      </StudioActionToolbar>
      <PromptVariants variants={props.variants} setPrompt={props.setPrompt} />
      <AdvancedSettingsPanel advancedOpen={props.advancedOpen} setAdvancedOpen={props.setAdvancedOpen} model={props.model} setModel={props.setModel} size={props.size} setSize={props.setSize} quality={props.quality} setQuality={props.setQuality} format={props.format} setFormat={props.setFormat} background={props.background} setBackground={props.setBackground} apiMode={props.apiMode} setApiMode={props.setApiMode} maskKey={props.maskKey} setMaskKey={props.setMaskKey} />
      <Button className="h-12 w-full rounded-full text-base" disabled={props.loading} onClick={props.submit}>
        {props.loading ? '正在创作…' : props.referenceKey.trim() ? '基于参考图创作' : '开始生成'}
      </Button>
    </StudioPanelContent>
  </StudioPanel>;
}
