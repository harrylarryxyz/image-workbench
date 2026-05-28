import type { Dimensions, Stroke } from './mask-editor-types';

export function fitDimensions(naturalWidth: number, naturalHeight: number): Dimensions {
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

export async function exportMaskFile(dimensions: Dimensions, strokes: Stroke[]) {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.naturalWidth;
  canvas.height = dimensions.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return null;
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
    for (let index = 2; index < points.length; index += 2) context.lineTo(points[index] * scaleX, points[index + 1] * scaleY);
    context.stroke();
  }
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? new File([blob], 'mask.png', { type: 'image/png' }) : null;
}
