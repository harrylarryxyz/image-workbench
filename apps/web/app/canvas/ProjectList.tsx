import { Button } from '@/components/ui/button';
import type { CanvasProject } from './types';

type ProjectListProps = {
  projects: CanvasProject[];
  templates: CanvasProject[];
  openProject: (id: string) => void;
  useTemplate: (id: string) => void;
};

export function ProjectList({ projects, templates, openProject, useTemplate }: ProjectListProps) {
  return <div className="flex flex-wrap gap-2">
    {projects.map((project) => <Button size="sm" variant="outline" type="button" key={project.id} onClick={() => openProject(project.id)}>{project.name}</Button>)}
    {templates.map((template) => <Button size="sm" variant="outline" type="button" key={template.id} onClick={() => useTemplate(template.id)}>模板：{template.name}</Button>)}
  </div>;
}
