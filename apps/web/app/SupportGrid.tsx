import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SupportGridProps = {
  prompt: string;
  referenceKey: string;
};

export function SupportGrid({ prompt, referenceKey }: SupportGridProps) {
  return <div className="support-grid">
    <Card className="bg-card/70"><CardHeader><p className="eyebrow">Touch Edit</p><CardTitle>局部修改</CardTitle><CardDescription>进入 Mask 工作区，针对画面局部继续调整。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href="/edit">打开 Edit</Link></Button></CardContent></Card>
    <Card className="bg-card/70"><CardHeader><p className="eyebrow">Asset Flow</p><CardTitle>素材复用</CardTitle><CardDescription>从图库挑选作品，回到创作台或发送到画布。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href="/gallery">浏览素材库</Link></Button></CardContent></Card>
    <Card className="bg-card/70"><CardHeader><p className="eyebrow">Workflow</p><CardTitle>画布编排</CardTitle><CardDescription>把 Prompt、图像和任务节点组合成可复用流程。</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/canvas?prompt=${encodeURIComponent(prompt)}${referenceKey ? `&image=${encodeURIComponent(referenceKey)}` : ''}`}>发送到 Canvas</Link></Button></CardContent></Card>
  </div>;
}
