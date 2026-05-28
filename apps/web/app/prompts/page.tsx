import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiGet } from '../../lib/api';
import { PromptEnhancer } from './prompt-enhancer';
import { PromptActions } from './prompt-actions';

export default async function PromptsPage() {
  const [prompts, history] = await Promise.all([
    apiGet<any[]>('/prompts').catch((error) => [{ error: String(error) }]),
    apiGet<any[]>('/prompts/history').catch(() => []),
  ]);
  return <section>
    <div className="hero">
      <p className="eyebrow">Prompt Library</p>
      <h1>提示词库</h1>
      <p className="sub">保存常用 prompt 和风格模板。点击“套用”会带着 prompt 回到 Generate 页面。</p>
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
      <form action="/api/prompts/seed" method="post"><Button variant="outline" type="submit">初始化内置模板</Button></form>
    </div>
    <div className="grid gap-4 mt-5">
      <Card>
        <CardHeader>
          <p className="eyebrow">New Prompt</p>
          <CardTitle>保存新模板</CardTitle>
          <CardDescription>支持 tags 和 [subject] 这样的占位符，方便从 Generate 页面复用。</CardDescription>
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
      <Card>
        <CardHeader>
          <p className="eyebrow">History</p>
          <CardTitle>最近任务 Prompt</CardTitle>
          <CardDescription>最近成功/失败任务 prompt，可复制沉淀为模板。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.slice(0, 8).map((item) => <p key={item.id}><b>{item.status}</b> · {item.prompt}</p>)}
        </CardContent>
      </Card>
      <div className="gallery">
        {prompts.map((prompt, i) => {
          const reuseHref = `/?prompt=${encodeURIComponent(prompt.content ?? '')}`;
          return <Card key={prompt.id ?? i}>
            <CardHeader>
              <CardTitle>{prompt.title ?? 'Prompt'}</CardTitle>
              <CardDescription>{prompt.source ?? 'manual'} · {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString() : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{prompt.content ?? prompt.error}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link href={reuseHref}>套用</Link></Button>
                {prompt.tags?.map((tag: string) => <Badge variant="secondary" key={tag}>{tag}</Badge>)}
              </div>
              {prompt.id ? <PromptActions prompt={prompt} /> : null}
            </CardContent>
          </Card>;
        })}
      </div>
    </div>
  </section>;
}
