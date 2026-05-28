import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Collection } from './types';

type CollectionStripProps = { collections: Collection[] };

export function CollectionStrip({ collections }: CollectionStripProps) {
  if (!collections.length) return null;
  return <div className="collection-strip">
    {collections.map((collection) => <Button asChild key={collection.id} variant="outline" className="h-auto rounded-full px-4 py-2"><Link href={`/gallery?collectionId=${collection.id}`}><b>{collection.name}</b><span className="text-muted-foreground">{collection.count ?? 0} assets</span></Link></Button>)}
  </div>;
}
