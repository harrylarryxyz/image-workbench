import { RefObject, useState } from 'react';
import type { Stroke } from './mask-editor-types';

export function useMaskDrawing(stageRef: RefObject<any>) {
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

  function stop() {
    setDrawing(false);
  }

  function clear() {
    setStrokes([]);
  }

  return { strokes, setStrokes, start, move, stop, clear };
}
