import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { TERMINAL } from './gallery-utils';
import type { Collection } from './types';

type GalleryFiltersProps = {
  query?: Record<string, string | string[] | undefined>;
  collections: Collection[];
};

export function GalleryFilters({ query, collections }: GalleryFiltersProps) {
  return <Card className="mt-5 bg-card/85">
    <CardContent className="pt-6">
      <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        <div className="space-y-2"><Label htmlFor="gallery-q">Search</Label><Input id="gallery-q" name="q" defaultValue={typeof query?.q === 'string' ? query.q : ''} placeholder="prompt / key / model" /></div>
        <div className="space-y-2"><Label htmlFor="gallery-tag">Tag</Label><Input id="gallery-tag" name="tag" defaultValue={typeof query?.tag === 'string' ? query.tag : ''} placeholder="favorite style" /></div>
        <div className="space-y-2"><Label htmlFor="gallery-type">Type</Label><NativeSelect id="gallery-type" name="type" defaultValue={typeof query?.type === 'string' ? query.type : ''}><option value="">全部</option><option value="image.generate">生成</option><option value="image.edit">编辑</option></NativeSelect></div>
        <div className="space-y-2"><Label htmlFor="gallery-status">Status</Label><NativeSelect id="gallery-status" name="status" defaultValue={typeof query?.status === 'string' ? query.status : ''}><option value="">全部</option>{TERMINAL.map((status) => <option key={status}>{status}</option>)}</NativeSelect></div>
        <div className="space-y-2"><Label htmlFor="gallery-model">Model</Label><Input id="gallery-model" name="model" defaultValue={typeof query?.model === 'string' ? query.model : ''} placeholder="gpt-image-2" /></div>
        <div className="space-y-2"><Label htmlFor="gallery-collection">Collection</Label><NativeSelect id="gallery-collection" name="collectionId" defaultValue={typeof query?.collectionId === 'string' ? query.collectionId : ''}><option value="">全部 Collection</option>{collections.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.count ?? 0})</option>)}</NativeSelect></div>
        <div className="flex items-end"><Button className="w-full" type="submit">筛选素材</Button></div>
      </form>
    </CardContent>
  </Card>;
}
