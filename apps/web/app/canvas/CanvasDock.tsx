import type { Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';

type CanvasDockProps = {
  selectedNode: Node | null;
  activeProjectId: string | null;
  selectedNodeId: string | null;
  addPromptNode: () => void;
  addImageNode: () => void;
  addTaskNode: () => void;
  duplicateSelected: () => void;
  rerunSelectedNode: () => void;
  createTaskFromCanvas: () => void;
};

export function CanvasDock({
  selectedNode,
  activeProjectId,
  selectedNodeId,
  addPromptNode,
  addImageNode,
  addTaskNode,
  duplicateSelected,
  rerunSelectedNode,
  createTaskFromCanvas,
}: CanvasDockProps) {
  return <div className="canvas-dock" aria-label="Canvas Dock">
    <Button size="sm" variant="secondary" type="button" onClick={addPromptNode}>添加 Prompt 节点</Button>
    <Button size="sm" variant="secondary" type="button" onClick={addImageNode}>添加 Image 节点</Button>
    <Button size="sm" variant="secondary" type="button" onClick={addTaskNode}>添加 Task 节点</Button>
    <Button size="sm" variant="outline" type="button" onClick={duplicateSelected} disabled={!selectedNode}>复制节点</Button>
    <Button size="sm" variant="outline" type="button" onClick={rerunSelectedNode} disabled={!activeProjectId || !selectedNodeId}>单节点重跑</Button>
    <Button size="sm" type="button" onClick={createTaskFromCanvas}>执行画布任务</Button>
  </div>;
}
