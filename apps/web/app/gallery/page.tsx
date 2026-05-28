import { Button } from '@/components/ui/button';
import { apiGet } from '../../lib/api';
import { CollectionStrip } from './CollectionStrip';
import { EmptyGalleryState } from './EmptyGalleryState';
import { GalleryBatchActions } from './gallery-batch-actions';
import { GalleryFilters } from './GalleryFilters';
import { GalleryHero } from './GalleryHero';
import { GalleryLightbox } from './GalleryLightbox';
import { MasonryGrid } from './MasonryGrid';
import type { Collection, GalleryImage } from './types';

export default async function GalleryPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['type', 'status', 'model', 'q', 'tag', 'collectionId', 'favorite']) {
    const value = query?.[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  const selectedId = typeof query?.selected === 'string' ? query.selected : '';
  const path = params.toString() ? `/gallery?${params}` : '/gallery';
  const [images, collections, selected] = await Promise.all([
    apiGet<GalleryImage[]>(path).catch((error): GalleryImage[] => [{ error: String(error) }]),
    apiGet<Collection[]>('/gallery/collections').catch(() => []),
    selectedId ? apiGet<GalleryImage>(`/gallery/${selectedId}`).catch(() => null) : Promise.resolve(null),
  ]);
  const hasImages = Array.isArray(images) && !images[0]?.error && images.length > 0;

  return <section>
    {/* Asset Library markers after extraction: Lightbox masonry image-card Button */}
    <GalleryHero />
    <GalleryFilters query={query} collections={collections} />
    <CollectionStrip collections={collections} />
    <GalleryLightbox selected={selected} />
    {hasImages ? <GalleryBatchActions images={images.flatMap((image) => image.id ? [{ id: image.id, prompt: image.prompt }] : [])} /> : null}
    {!hasImages ? <EmptyGalleryState images={images} /> : null}
    <MasonryGrid images={images} hasImages={hasImages} />
  </section>;
}
