import { useEffect, useState } from 'react';
import type { Dimensions } from './mask-editor-types';
import { fitDimensions } from './mask-editor-utils';

export function useImageDimensions(imageUrl?: string | null) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  useEffect(() => {
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
  return dimensions;
}
