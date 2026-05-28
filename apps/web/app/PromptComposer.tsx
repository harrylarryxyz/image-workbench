import Link from 'next/link';
import { ChangeEvent, DragEvent, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  setAdvancedOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  return <Card className="composer-card gap-5 bg-card/85">
    <CardHeader>
      <p className="eyebrow">Create Studio</p>
      <CardTitle>What shall we create together?</CardTitle>
      <CardDescription>默认只保留创作必需项；模型、尺寸、质量和格式统一收进高级设置。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="prompt">画面描述</Label>
        <Textarea id="prompt" value={props.prompt} onChange={(e) => props.setPrompt(e.target.value)} className="min-h-44 text-base leading-7" />
      </div>
      <ReferenceDropzone fileInputRef={props.fileInputRef} uploadingReference={props.uploadingReference} referenceName={props.referenceName} onReferenceFileChange={props.onReferenceFileChange} onDropReference={props.onDropReference} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={props.makeVariants}>生成 Prompt 变体</Button>
        <Button asChild type="button" variant="outline"><Link href="/prompts">Prompt Library</Link></Button>
        <Button asChild type="button" variant="outline"><Link href="/gallery">从素材库选择</Link></Button>
      </div>
      <PromptVariants variants={props.variants} setPrompt={props.setPrompt} />
      <AdvancedSettingsPanel advancedOpen={props.advancedOpen} setAdvancedOpen={props.setAdvancedOpen} model={props.model} setModel={props.setModel} size={props.size} setSize={props.setSize} quality={props.quality} setQuality={props.setQuality} format={props.format} setFormat={props.setFormat} background={props.background} setBackground={props.setBackground} apiMode={props.apiMode} setApiMode={props.setApiMode} maskKey={props.maskKey} setMaskKey={props.setMaskKey} />
      <Button className="h-12 w-full rounded-full text-base" disabled={props.loading} onClick={props.submit}>
        {props.loading ? '正在创作…' : props.referenceKey.trim() ? '基于参考图创作' : '开始生成'}
      </Button>
    </CardContent>
  </Card>;
}
