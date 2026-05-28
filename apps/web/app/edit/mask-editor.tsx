'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { Layer, Line, Stage } from 'react-konva';

type MaskEditorProps = {
  imageUrl?: string | null;
  onMaskReady: (file: File) => void;
};

type Stroke = { points: number[] };

function MaskEditorInner({ imageUrl, onMaskReady }: MaskEditorProps) {
  const stageRef = useRef<any>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState(false);

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
    const stage = stageRef.current;
    if (!stage) return;
    const blob: Blob | null = await new Promise((resolve) => stage.toCanvas().toBlob(resolve, 'image/png'));
    if (!blob) return;
    onMaskReady(new File([blob], 'mask.png', { type: 'image/png' }));
  }

  return <div>
    <div className="muted">在画布上涂白色区域作为 mask；保存后会作为 mask.png 上传并随编辑任务提交。</div>
    {imageUrl ? <div className="thumb" style={{backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 260}}>
      <Stage ref={stageRef} width={360} height={260} onMouseDown={start} onTouchStart={start} onMouseMove={move as any} onTouchMove={move as any} onMouseUp={() => setDrawing(false)} onTouchEnd={() => setDrawing(false)}>
        <Layer>
          {strokes.map((stroke, index) => <Line key={index} points={stroke.points} stroke="white" strokeWidth={28} lineCap="round" lineJoin="round" globalCompositeOperation="source-over" />)}
        </Layer>
      </Stage>
    </div> : <div className="thumb">先添加参考图再画 mask</div>}
    <div className="actions">
      <button className="pill" type="button" onClick={() => setStrokes([])}>清空 Mask</button>
      <button className="pill" type="button" disabled={!imageUrl || strokes.length === 0} onClick={exportMask}>保存 Mask</button>
    </div>
  </div>;
}

export const MaskEditor = dynamic(() => Promise.resolve(MaskEditorInner), { ssr: false });
