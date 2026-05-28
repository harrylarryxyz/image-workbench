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
    className="reference-dropzone"
    onDragOver={(event) => event.preventDefault()}
    onDrop={onDropReference}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click(); }}
  >
    <Input ref={fileInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={onReferenceFileChange} />
    <div>
      <b>上传参考图</b>
      <p>点击上传或拖拽图片到这里；选择后自动用于参考图编辑。</p>
      {referenceName ? <span>{referenceName}</span> : null}
    </div>
    <Button type="button" variant="secondary" disabled={uploadingReference} onClick={() => fileInputRef.current?.click()}>{uploadingReference ? '上传中…' : '选择图片'}</Button>
  </div>;
}
