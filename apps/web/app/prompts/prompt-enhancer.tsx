'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type PromptEnhancerProps = { initial?: string };

export function PromptEnhancer({ initial = '' }: PromptEnhancerProps) {
  const [subject, setSubject] = useState(initial);
  const [style, setStyle] = useState('cinematic');
  const [enhanced, setEnhanced] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const res = await fetch('/api/prompts/enhance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, style }) });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const json = await res.json();
    setEnhanced(json.prompt);
  }

  return <Card>
    <form onSubmit={submit}>
      <CardHeader>
        <CardDescription>Local Enhancer</CardDescription>
        <CardTitle>本地 Prompt 增强</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="enhancer-subject">Subject / Rough prompt</Label>
          <Input id="enhancer-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="orange robot repairing a neon sign" />
        </div>
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cinematic">cinematic</SelectItem>
              <SelectItem value="warm hand-painted illustration">warm hand-painted illustration</SelectItem>
              <SelectItem value="premium product photography">premium product photography</SelectItem>
              <SelectItem value="minimal vector icon">minimal vector icon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">本地增强</Button>
        {error ? <pre className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100 whitespace-pre-wrap">{error}</pre> : null}
        {enhanced ? <div className="space-y-3">
          <Label htmlFor="enhanced-prompt">Enhanced Prompt</Label>
          <Textarea id="enhanced-prompt" readOnly value={enhanced} />
          <Button asChild variant="secondary"><a href={`/?prompt=${encodeURIComponent(enhanced)}`}>套用到 Generate</a></Button>
        </div> : null}
      </CardContent>
    </form>
  </Card>;
}
