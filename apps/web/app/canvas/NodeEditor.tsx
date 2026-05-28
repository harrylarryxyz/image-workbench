import type { Node } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type NodeEditorProps = {
  selectedNode: Node | null;
  patchSelectedData: (patch: Record<string, unknown>) => void;
};

export function NodeEditor({ selectedNode, patchSelectedData }: NodeEditorProps) {
  if (!selectedNode) return <p className="muted">点击画布节点后编辑。</p>;

  return <div className="space-y-4">
    <Card className="bg-muted/30"><CardContent className="pt-6"><b>{selectedNode.id}</b><p className="fine-print">{String(selectedNode.data?.label ?? '').split('\n')[0]}</p></CardContent></Card>
    {selectedNode.id.startsWith('prompt') ? <div className="space-y-2">
      <Label htmlFor="canvas-node-prompt">Prompt</Label>
      <Textarea id="canvas-node-prompt" value={String(selectedNode.data?.prompt ?? String(selectedNode.data?.label ?? '').split('\n').slice(1).join('\n'))} onChange={(event) => patchSelectedData({ prompt: event.target.value })} />
    </div> : null}
    {selectedNode.id.startsWith('image') ? <div className="space-y-2">
      <Label htmlFor="canvas-image-ref">图片引用</Label>
      <Input id="canvas-image-ref" placeholder="local://uploads/default/... 或从素材库发送" value={String(selectedNode.data?.storageKey ?? '')} onChange={(event) => patchSelectedData({ storageKey: event.target.value })} />
      <p className="muted">可从 Asset Library 的“Canvas”动作或 Edit 上传结果传入。</p>
    </div> : null}
    {selectedNode.id.startsWith('task') ? <div className="space-y-3">
      <div className="space-y-2"><Label htmlFor="canvas-task-prompt">Prompt override</Label><Textarea id="canvas-task-prompt" value={String(selectedNode.data?.prompt ?? '')} onChange={(event) => patchSelectedData({ prompt: event.target.value })} placeholder="可留空，自动使用上游 Prompt 节点" /></div>
      <div className="space-y-2"><Label htmlFor="canvas-task-model">Model</Label><Input id="canvas-task-model" value={String(selectedNode.data?.model ?? 'gpt-image-2')} onChange={(event) => patchSelectedData({ model: event.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="canvas-task-size">Size</Label><Input id="canvas-task-size" value={String(selectedNode.data?.size ?? '1024x1024')} onChange={(event) => patchSelectedData({ size: event.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="canvas-task-quality">Quality</Label><NativeSelect id="canvas-task-quality" value={String(selectedNode.data?.quality ?? 'low')} onChange={(event) => patchSelectedData({ quality: event.target.value })}><option>low</option><option>medium</option><option>high</option></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="canvas-task-mask">Mask</Label><Input id="canvas-task-mask" value={String(selectedNode.data?.maskKey ?? '')} onChange={(event) => patchSelectedData({ maskKey: event.target.value })} placeholder="可选：从 Edit 工作区生成" /></div>
    </div> : null}
  </div>;
}
