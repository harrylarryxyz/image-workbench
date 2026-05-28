'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Layer, Line, Stage } from 'react-konva';
import { Button } from '@/components/ui/button';

type MaskEditorProps = {
  imageUrl?: string | null;
  onMaskReady: (file: File) => void;
};

type Stroke = { points: number[] };
type Dimensions = { naturalWidth: number; naturalHeight: number; displayWidth: number; displayHeight: number };

function fitDimensions(naturalWidth: number, naturalHeight: number): Dimensions {
  const maxWidth = 360;
  const maxHeight = 360;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1) || 1;
  return {
    naturalWidth,
    naturalHeight,
    displayWidth: Math.max(1, Math.round(naturalWidth * scale)),
    displayHeight: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

function MaskEditorInner({ imageUrl, onMaskReady }: MaskEditorProps) {
  const stageRef = useRef<any>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    setStrokes([]);
    setDimensions(null);
    if (!imageUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const naturalWidth = img.naturalWidth || 1024;
      const naturalHeight = img.naturalHeight || 1024;
      setDimensions(fitDimensions(naturalWidth, naturalHeight));
    };
    img.onerror = () => {
      if (!cancelled) setDimensions(fitDimensions(1024, 1024));
    };
    img.src = imageUrl;
    return () => { cancelled = true; };
  }, [imageUrl]);

  function pointer() {
    const pos = stageRef.current?.getPointerPosition();
    return pos ? [pos.x, pos.y] : [];
  }

  function start() {
    const p = pointer();
    if (!p.length) return;
    setDrawing(true);
    setStrokes((prev) => [...prev, { points: p }]);
  }

  function move() {
    if (!drawing) return;
    const p = pointer();
    if (!p.length) return;
    setStrokes((prev) => prev.map((stroke, index) => index === prev.length - 1 ? { points: [...stroke.points, ...p] } : stroke));
  }

  async function exportMask() {
    if (!dimensions) return;
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.naturalWidth;
    canvas.height = dimensions.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    const scaleX = dimensions.naturalWidth / dimensions.displayWidth;
    const scaleY = dimensions.naturalHeight / dimensions.displayHeight;
    context.strokeStyle = 'white';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 28 * Math.max(scaleX, scaleY);
    for (const stroke of strokes) {
      const points = stroke.points;
      if (points.length < 2) continue;
      context.beginPath();
      context.moveTo(points[0] * scaleX, points[1] * scaleY);
      for (let index = 2; index < points.length; index += 2) {
        context.lineTo(points[index] * scaleX, points[index + 1] * scaleY);
      }
      context.stroke();
    }
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    onMaskReady(new File([blob], 'mask.png', { type: 'image/png' }));
  }

  return <div>
    <div className="muted">在画布上涂白色区域作为 mask；保存后会按参考图原始尺寸导出 mask.png，提交时会转换为 provider 要求的透明编辑区域。</div>
    {imageUrl && dimensions ? <div
      className="mask-editor-canvas"
      style={{
        position: 'relative',
        width: dimensions.displayWidth,
        height: dimensions.displayHeight,
        minHeight: dimensions.displayHeight,
        padding: 0,
        display: 'block',
        overflow: 'hidden',
        borderRadius: 12,
        background: '#0b0d14',
        touchAction: 'none',
      }}
    >
      <img
        src={imageUrl}
        alt="mask reference"
        style={{ width: dimensions.displayWidth, height: dimensions.displayHeight, display: 'block', objectFit: 'fill' }}
      />
      <Stage
        ref={stageRef}
        width={dimensions.displayWidth}
        height={dimensions.displayHeight}
        style={{ position: 'absolute', left: 0, top: 0 }}
        onMouseDown={start}
        onTouchStart={start}
        onMouseMove={move as any}
        onTouchMove={move as any}
        onMouseUp={() => setDrawing(false)}
        onMouseLeave={() => setDrawing(false)}
        onTouchEnd={() => setDrawing(false)}
      >
        <Layer>
          {strokes.map((stroke, index) => <Line key={index} points={stroke.points} stroke="white" strokeWidth={28} lineCap="round" lineJoin="round" globalCompositeOperation="source-over" />)}
        </Layer>
      </Stage>
    </div> : <div className="grid min-h-40 place-items-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">{imageUrl ? '正在读取参考图尺寸…' : '先添加参考图再画 mask'}</div>}
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="secondary" type="button" onClick={() => setStrokes([])}>清空 Mask</Button>
      <Button variant="outline" type="button" disabled={!imageUrl || !dimensions || strokes.length === 0} onClick={exportMask}>保存 Mask</Button>
    </div>
  </div>;
}

export const MaskEditor = dynamic(() => Promise.resolve(MaskEditorInner), { ssr: false });
