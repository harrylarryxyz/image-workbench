import type { Node } from '@xyflow/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nodeKind } from './canvas-utils';
import { NodeEditor } from './NodeEditor';
import { ProjectActions } from './ProjectActions';
import { ProjectList } from './ProjectList';
import type { CanvasProject } from './types';

type CanvasInspectorProps = {
  selectedNode: Node | null;
  projectName: string;
  setProjectName: (value: string) => void;
  activeProjectId: string | null;
  message: string;
  projects: CanvasProject[];
  templates: CanvasProject[];
  patchSelectedData: (patch: Record<string, unknown>) => void;
  saveProject: (options?: { template?: boolean }) => void;
  loadProjects: () => void;
  loadTemplates: () => void;
  loadRuns: () => void;
  askAgentNext: () => void;
  deleteProject: () => void;
  clearCanvas: () => void;
  openProject: (id: string) => void;
  useTemplate: (id: string) => void;
};

export function CanvasInspector({
  selectedNode,
  projectName,
  setProjectName,
  activeProjectId,
  message,
  projects,
  templates,
  patchSelectedData,
  saveProject,
  loadProjects,
  loadTemplates,
  loadRuns,
  askAgentNext,
  deleteProject,
  clearCanvas,
  openProject,
  useTemplate,
}: CanvasInspectorProps) {
  return <Card className="canvas-inspector" data-testid="canvas-node-editor">
    <CardHeader>
      <p className="eyebrow">Inspector</p>
      <CardTitle>{nodeKind(selectedNode?.id)}</CardTitle>
      <CardDescription>选中节点会在这里编辑；连线决定执行时的 prompt、reference、mask 和 rerun 范围。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="canvas-project-name">项目名</Label>
        <Input id="canvas-project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
      </div>
      <ProjectActions activeProjectId={activeProjectId} saveProject={saveProject} loadProjects={loadProjects} loadTemplates={loadTemplates} loadRuns={loadRuns} askAgentNext={askAgentNext} deleteProject={deleteProject} clearCanvas={clearCanvas} />
      {message ? <Card className="border-border/70 bg-muted/30"><CardContent className="pt-6 text-sm text-muted-foreground">{message}</CardContent></Card> : null}
      <NodeEditor selectedNode={selectedNode} patchSelectedData={patchSelectedData} />
      <ProjectList projects={projects} templates={templates} openProject={openProject} useTemplate={useTemplate} />
    </CardContent>
  </Card>;
}
