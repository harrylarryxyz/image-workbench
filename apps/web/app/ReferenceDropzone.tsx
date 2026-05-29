import { ChangeEvent, DragEvent, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ReferenceDropzoneProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadingReference: boolean;
  referenceName: string;
  onReferenceFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropReference: (event: DragEvent<HTMLDivElement>) => void;
};

export function ReferenceDropzone({ fileInputRef, uploadingReference, referenceName, onReferenceFileChange, onDropReference }: ReferenceDropzoneProps) {
  return <div
    className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-dashed border-white/20 bg-[linear-gradient(135deg,rgba(113,112,255,0.12),rgba(255,255,255,0.035))] p-4 outline-none transition hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    onDragOver={(event) => event.preventDefault()}
    onDrop={onDropReference}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click(); }}
  >
    <Input ref={fileInputRef} className="reference-file-input sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={onReferenceFileChange} />
    <div className="min-w-0">
      <b className="block text-sm text-foreground">上传参考图</b>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">点击上传或拖拽图片到这里；选择后自动用于参考图编辑。</p>
      {referenceName ? <span className="mt-2 block truncate text-xs text-muted-foreground">{referenceName}</span> : null}
    </div>
    <Button className="shrink-0" type="button" variant="secondary" disabled={uploadingReference} onClick={() => fileInputRef.current?.click()}>{uploadingReference ? '上传中…' : '选择图片'}</Button>
  </div>;
}
