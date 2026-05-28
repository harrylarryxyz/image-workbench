import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaskEditor } from './mask-editor';
import { assetSrc } from './edit-utils';
import type { ProviderSummary, Uploaded } from './types';

type EditInputPanelProps = {
  provider: ProviderSummary | null;
  busy: boolean;
  submitting: boolean;
  uploads: Uploaded[];
  prompt: string;
  setPrompt: (value: string) => void;
  mask: Uploaded | null;
  upload: (event: FormEvent<HTMLFormElement>) => void;
  uploadMask: (file: File) => void;
  submitEdit: () => void;
};

export function EditInputPanel({ provider, busy, submitting, uploads, prompt, setPrompt, mask, upload, uploadMask, submitEdit }: EditInputPanelProps) {
  return <Card>
    <CardHeader>
      <CardDescription>Create Studio · Edit</CardDescription>
      <CardTitle>编辑输入</CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="rounded-lg border bg-muted/30 p-3">
        <b className="block text-sm">编辑能力</b>
        <p className="mt-1 text-sm text-muted-foreground">{provider?.capabilities?.edit === false ? '当前 Provider 暂不支持参考图编辑，请切换后再试。' : '可上传参考图并按需绘制局部编辑区域。'}</p>
      </div>
      <form className="space-y-3" onSubmit={upload}>
        <Label htmlFor="reference-image">Reference Image</Label>
        <Input id="reference-image" name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
        <Button disabled={busy} type="submit">上传参考图</Button>
      </form>
      <div className="space-y-2">
        <Label htmlFor="edit-prompt">Edit Prompt</Label>
        <Textarea id="edit-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </div>
      <div className="space-y-3">
        <div><h3 className="text-base font-semibold">Mask 编辑器</h3><p className="text-sm text-muted-foreground">在第一张参考图上绘制白色区域，支持 mask 的 provider 会只编辑选中区域。</p></div>
        <MaskEditor imageUrl={assetSrc(uploads[0]?.assetUrl)} onMaskReady={uploadMask} />
        {mask ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">局部编辑区域已保存</div> : <p className="text-xs text-muted-foreground">Mask optional；不需要局部修改时可留空。</p>}
      </div>
      <Button disabled={submitting || uploads.length === 0} onClick={submitEdit}>{submitting ? '提交中…' : '创建编辑任务'}</Button>
    </CardContent>
  </Card>;
}
