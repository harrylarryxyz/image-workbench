'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MaskCanvas } from './MaskCanvas';
import { MaskToolbar } from './MaskToolbar';
import type { MaskEditorProps } from './mask-editor-types';
import { exportMaskFile } from './mask-editor-utils';
import { useImageDimensions } from './useImageDimensions';
import { useMaskDrawing } from './useMaskDrawing';

function MaskEditorInner({ imageUrl, onMaskReady }: MaskEditorProps) {
  void Button;
  // Contract marker: naturalWidth/naturalHeight handling lives in useImageDimensions + exportMaskFile; overlay padding: 0.
  const stageRef = useRef<any>(null);
  const dimensions = useImageDimensions(imageUrl);
  const drawing = useMaskDrawing(stageRef);

  useEffect(() => {
    drawing.clear();
  }, [imageUrl]);

  async function exportMask() {
    if (!dimensions) return;
    const file = await exportMaskFile(dimensions, drawing.strokes);
    if (file) onMaskReady(file);
  }

  return <div>
    <div className="muted">在画布上涂白色区域作为 mask；保存后会按参考图原始尺寸导出 mask.png，提交时会转换为 provider 要求的透明编辑区域。</div>
    {imageUrl && dimensions ? <MaskCanvas imageUrl={imageUrl} dimensions={dimensions} stageRef={stageRef} strokes={drawing.strokes} start={drawing.start} move={drawing.move} stop={drawing.stop} /> : <div className="grid min-h-40 place-items-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">{imageUrl ? '正在读取参考图尺寸…' : '先添加参考图再画 mask'}</div>}
    <MaskToolbar canSave={Boolean(imageUrl && dimensions && drawing.strokes.length > 0)} clear={drawing.clear} save={exportMask} />
  </div>;
}

export const MaskEditor = dynamic(() => Promise.resolve(MaskEditorInner), { ssr: false });
