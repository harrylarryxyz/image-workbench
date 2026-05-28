import { Button } from '@/components/ui/button';

type ProjectActionsProps = {
  activeProjectId: string | null;
  saveProject: (options?: { template?: boolean }) => void;
  loadProjects: () => void;
  loadTemplates: () => void;
  loadRuns: () => void;
  askAgentNext: () => void;
  deleteProject: () => void;
  clearCanvas: () => void;
};

export function ProjectActions({ activeProjectId, saveProject, loadProjects, loadTemplates, loadRuns, askAgentNext, deleteProject, clearCanvas }: ProjectActionsProps) {
  return <div className="flex flex-wrap gap-2">
    <Button size="sm" type="button" onClick={() => saveProject()}>{activeProjectId ? '保存项目' : '新建保存'}</Button>
    <Button size="sm" variant="outline" type="button" onClick={() => saveProject({ template: true })}>保存为模板</Button>
    <Button size="sm" variant="outline" type="button" onClick={loadProjects}>加载项目</Button>
    <Button size="sm" variant="outline" type="button" onClick={loadTemplates}>加载模板</Button>
    <Button size="sm" variant="outline" type="button" onClick={() => loadRuns()} disabled={!activeProjectId}>刷新运行</Button>
    <Button size="sm" variant="outline" type="button" onClick={askAgentNext}>Agent 建议下一步</Button>
    <Button size="sm" variant="destructive" type="button" onClick={deleteProject} disabled={!activeProjectId}>删除当前项目</Button>
    <Button size="sm" variant="secondary" type="button" onClick={clearCanvas}>重置画布</Button>
  </div>;
}
