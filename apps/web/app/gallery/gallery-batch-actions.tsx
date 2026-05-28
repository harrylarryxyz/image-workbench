'use client';

import { FormEvent, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost } from '../../lib/api';

export function GalleryBatchActions({ images }: { images: Array<{ id: string; prompt?: string }> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState('Campaign picks');
  const [message, setMessage] = useState('');
  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  async function batchDelete(event: FormEvent) {
    event.preventDefault();
    if (!selected.length) return;
    if (!window.confirm('I understand this changes production data')) return;
    const result = await apiPost<{ deleted: number }>('/gallery/batch/delete', { ids: selected });
    setMessage(`Deleted ${result.deleted} image(s). Refresh to update gallery.`);
  }
  async function createCollection() {
    if (!selected.length) return;
    const collection = await apiPost<{ id: string; name: string }>('/gallery/collections', { name: collectionName });
    const reply = await apiPost<{ added: number }>(`/gallery/collections/${collection.id}/items`, { ids: selected });
    setMessage(`Collection “${collection.name}” created with ${reply.added} item(s).`);
  }
  const ids = selected.join(',');
  return <Card className="mt-5 bg-card/85">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Batch actions</p>
          <CardTitle>批量整理素材</CardTitle>
          <CardDescription>选择图库项目后可建 Collection、下载 zip/manifest，删除前必须通过浏览器危险操作确认。</CardDescription>
        </div>
        <Badge variant="outline">Selected {selected.length}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <form onSubmit={batchDelete} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={() => setSelected(images.map((image) => image.id))}>全选</Button>
          <Button variant="outline" type="button" onClick={() => setSelected([])}>清空</Button>
          <Button variant="destructive" type="submit" disabled={!selected.length}>删除选中 ({selected.length})</Button>
          <Button asChild variant="outline"><a href={ids ? `/api/gallery/batch/download.zip?ids=${encodeURIComponent(ids)}` : '#'}>批量下载 ZIP</a></Button>
          <Button asChild variant="outline"><a href={ids ? `/api/gallery/batch/manifest?ids=${encodeURIComponent(ids)}` : '#'}>导出 Manifest</a></Button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <Label htmlFor="collection-name">Collection name</Label>
          <Input id="collection-name" value={collectionName} onChange={(event) => setCollectionName(event.target.value)} />
        </div>
        <div className="flex items-end"><Button type="button" onClick={createCollection} disabled={!selected.length}>加入新 Collection</Button></div>
      </div>

      {message ? <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">{message}</div> : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((image) => {
          const active = selected.includes(image.id);
          return <Button
            className="h-auto justify-start whitespace-normal rounded-xl p-3 text-left"
            key={image.id}
            type="button"
            variant={active ? 'secondary' : 'outline'}
            onClick={() => toggle(image.id)}
          >
            <span className="grid gap-1">
              <span>{active ? '✓ ' : ''}{image.prompt?.slice(0, 36) || image.id}</span>
              <span className="text-muted-foreground text-xs">{image.id.slice(0, 8)}</span>
            </span>
          </Button>;
        })}
      </div>
    </CardContent>
  </Card>;
}
