import { GalleryCard } from './GalleryCard';
import type { GalleryImage } from './types';

type MasonryGridProps = { images: GalleryImage[]; hasImages: boolean };

export function MasonryGrid({ images, hasImages }: MasonryGridProps) {
  return <div className="masonry-grid mt-5">
    {hasImages ? images.map((image, i) => <GalleryCard image={image} index={i} key={image.id ?? i} />) : null}
  </div>;
}
