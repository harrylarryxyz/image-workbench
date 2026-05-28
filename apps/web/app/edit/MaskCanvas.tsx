import { Layer, Line, Stage } from 'react-konva';
import type { Dimensions, Stroke } from './mask-editor-types';

type MaskCanvasProps = {
  imageUrl: string;
  dimensions: Dimensions;
  stageRef: any;
  strokes: Stroke[];
  start: () => void;
  move: () => void;
  stop: () => void;
};

export function MaskCanvas({ imageUrl, dimensions, stageRef, strokes, start, move, stop }: MaskCanvasProps) {
  return <div
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
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchEnd={stop}
    >
      <Layer>
        {strokes.map((stroke, index) => <Line key={index} points={stroke.points} stroke="white" strokeWidth={28} lineCap="round" lineJoin="round" globalCompositeOperation="source-over" />)}
      </Layer>
    </Stage>
  </div>;
}
