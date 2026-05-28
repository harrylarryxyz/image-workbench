import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, ErrorState, friendlyError } from '@/components/product/state';
import { apiGet } from '../../lib/api';
import { PromptEnhancer } from './prompt-enhancer';
import { PromptActions } from './prompt-actions';

export default async function PromptsPage() {
  const [prompts, history] = await Promise.all([
    apiGet<any[]>('/prompts').catch((error) => [{ error: friendlyError(error, '提示词库暂时不可用') }]),
    apiGet<any[]>('/prompts/history').catch(() => []),
  ]);
  const hasPromptError = Boolean(prompts[0]?.error && !prompts[0]?.id);
  const visiblePrompts = hasPromptError ? [] : prompts;
  return <section>
    <div className="hero">
      <p className="eyebrow">Prompt Library</p>
      <h1>提示词库</h1>
      <p className="sub">保存风格模板、沉淀常用表达，并把粗略想法增强成可执行 prompt。</p>
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
      <form action="/api/prompts/seed" method="post"><Button variant="outline" type="submit">初始化内置模板</Button></form>
      <Button asChild variant="outline"><Link href="/">回到 Create Studio</Link></Button>
    </div>
    <div className="grid gap-4 mt-5 lg:grid-cols-[minmax(0,.95fr)_minmax(320px,.75fr)]">
      <Card>
        <CardHeader>
          <p className="eyebrow">New Prompt</p>
          <CardTitle>保存新模板</CardTitle>
          <CardDescription>支持 tags 和 [subject] 这样的占位符，方便从 Create Studio 复用。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action="/api/prompts" method="post">
            <div className="space-y-2"><Label htmlFor="prompt-title">标题</Label><Input id="prompt-title" name="title" placeholder="例如：产品海报模板" /></div>
            <div className="space-y-2"><Label htmlFor="prompt-tags">Tags，用逗号分隔</Label><Input id="prompt-tags" name="tags" placeholder="poster, product, style" /></div>
            <div className="space-y-2"><Label htmlFor="prompt-content">Prompt</Label><Textarea id="prompt-content" name="content" placeholder="输入提示词模板，支持 [subject] 这样的占位符" /></div>
            <Button type="submit">保存 Prompt</Button>
          </form>
        </CardContent>
      </Card>
      <PromptEnhancer />
    </div>

    <div className="grid gap-4 mt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="gallery">
        {hasPromptError ? <ErrorState title="提示词库暂时不可用" description={prompts[0]?.error} actionHref="/ops" actionLabel="查看服务状态" /> : null}
        {!hasPromptError && visiblePrompts.length === 0 ? <EmptyState title="还没有模板" description="初始化内置模板，或保存你的第一个创作 prompt。" /> : null}
        {visiblePrompts.map((prompt, i) => {
          const reuseHref = `/?prompt=${encodeURIComponent(prompt.content ?? '')}`;
          return <Card key={prompt.id ?? i}>
            <CardHeader>
              <CardTitle>{prompt.title ?? 'Prompt'}</CardTitle>
              <CardDescription>{prompt.source ?? 'manual'} · {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString() : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{prompt.content ?? '空模板'}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link href={reuseHref}>套用</Link></Button>
                {prompt.tags?.map((tag: string) => <Badge variant="secondary" key={tag}>{tag}</Badge>)}
              </div>
              {prompt.id ? <PromptActions prompt={prompt} /> : null}
            </CardContent>
          </Card>;
        })}
      </div>
      <Card>
        <CardHeader>
          <p className="eyebrow">History</p>
          <CardTitle>最近任务 Prompt</CardTitle>
          <CardDescription>最近任务 prompt，可复制沉淀为模板。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length ? history.slice(0, 8).map((item) => <p key={item.id}><b>{item.status}</b> · {item.prompt}</p>) : <EmptyState title="暂无历史 Prompt" description="完成一次创作后，这里会出现最近用过的表达。" />}
        </CardContent>
      </Card>
    </div>
  </section>;
}
