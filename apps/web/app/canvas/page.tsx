'use client';

import '@xyflow/react/dist/style.css';
import { FormEvent, useMemo, useState } from 'react';
import { Background, Controls, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

type CanvasExport = { nodes: Node[]; edges: Edge[] };
type CanvasProject = CanvasExport & { id: string; name: string; description?: string | null; updatedAt?: string };

const initialNodes: Node[] = [
  { id: 'prompt-1', type: 'default', position: { x: 40, y: 80 }, data: { label: 'Prompt\nA cinematic orange robot fixing a neon sign' } },
  { id: 'task-1', type: 'default', position: { x: 380, y: 80 }, data: { label: 'Generate Task\ngpt-image-2 · 1024x1024' } },
];
const initialEdges: Edge[] = [{ id: 'prompt-1-task-1', source: 'prompt-1', target: 'task-1', label: 'creates' }];

function promptFromNodes(nodes: Node[]) {
  const promptNode = nodes.find((node) => node.id.startsWith('prompt'));
  const label = String(promptNode?.data?.label ?? '');
  return label.split('\n').slice(1).join('\n').trim() || label || 'A polished image generated from canvas nodes';
}

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [importText, setImportText] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled canvas');
  const exported = useMemo(() => JSON.stringify({ nodes, edges } satisfies CanvasExport, null, 2), [nodes, edges]);

  function addPromptNode() {
    setNodes((prev) => [...prev, { id: `prompt-${Date.now()}`, position: { x: 80, y: 220 + prev.length * 20 }, data: { label: 'Prompt\nDescribe your subject here' } }]);
  }

  function addImageNode() {
    setNodes((prev) => [...prev, { id: `image-${Date.now()}`, position: { x: 260, y: 240 + prev.length * 20 }, data: { label: 'Image Reference\nPaste storage key or gallery asset' } }]);
  }

  function addTaskNode() {
    setNodes((prev) => [...prev, { id: `task-${Date.now()}`, position: { x: 520, y: 260 + prev.length * 20 }, data: { label: 'Task\nGenerate/Edit from connected nodes' } }]);
  }

  function importCanvas(event: FormEvent) {
    event.preventDefault();
    const parsed = JSON.parse(importText) as CanvasExport;
    setNodes(parsed.nodes ?? []);
    setEdges(parsed.edges ?? []);
  }

  async function loadProjects() {
    const rows = await apiGet<CanvasProject[]>('/canvas-projects');
    setProjects(rows);
    setResult({ loadedProjects: rows.length });
  }

  async function openProject(id: string) {
    const project = await apiGet<CanvasProject>(`/canvas-projects/${id}`);
    setActiveProjectId(project.id);
    setProjectName(project.name);
    setNodes(project.nodes ?? []);
    setEdges(project.edges ?? []);
    setImportText('');
    setResult({ opened: project.id });
  }

  async function saveProject() {
    const body = { name: projectName, nodes, edges };
    const saved = activeProjectId ? await apiPatch<CanvasProject>(`/canvas-projects/${activeProjectId}`, body) : await apiPost<CanvasProject>('/canvas-projects', body);
    setActiveProjectId(saved.id);
    setProjectName(saved.name);
    setResult({ saved: saved.id });
    await loadProjects();
  }

  async function deleteProject() {
    if (!activeProjectId) return;
    await apiDelete(`/canvas-projects/${activeProjectId}`);
    setActiveProjectId(null);
    setResult({ deleted: true });
    await loadProjects();
  }

  async function createTaskFromCanvas() {
    if (activeProjectId) {
      await saveProject();
      const run = await apiPost(`/canvas-projects/${activeProjectId}/run`, {});
      setResult(run);
      return;
    }
    const prompt = promptFromNodes(nodes);
    const created = await apiPost('/tasks/generate', { prompt, model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 });
    setResult(created);
    setNodes((prev) => [...prev, { id: `created-task-${Date.now()}`, position: { x: 720, y: 100 }, data: { label: `Created Task\n${(created as any).id ?? 'unknown'}` } }]);
  }

  return <section>
    <div className="hero"><p className="eyebrow">Canvas Workflow</p><h1>节点画布</h1><p className="sub">React Flow 画布：Prompt / Image / Task 节点、引用边、JSON 导入导出、项目持久化，并可保存后按连线执行 Task 节点，自动创建 Generate/Edit 任务并回写 taskId。</p></div>
    <div className="actions" style={{ marginTop: 16 }}>
      <button className="pill" type="button" onClick={addPromptNode}>添加 Prompt 节点</button>
      <button className="pill" type="button" onClick={addImageNode}>添加 Image 节点</button>
      <button className="pill" type="button" onClick={addTaskNode}>添加 Task 节点</button>
      <button className="pill" type="button" onClick={createTaskFromCanvas}>执行画布任务</button>
    </div>
    <div className="grid two" style={{ marginTop: 16 }}>
      <div className="card">
        <p className="eyebrow">Project CRUD</p>
        <label>项目名</label>
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="pill" type="button" onClick={saveProject}>{activeProjectId ? '保存项目' : '新建保存'}</button>
          <button className="pill" type="button" onClick={loadProjects}>加载项目列表</button>
          <button className="pill" type="button" onClick={deleteProject} disabled={!activeProjectId}>删除当前项目</button>
        </div>
      </div>
      <div className="card">
        <p className="eyebrow">Saved Projects</p>
        {projects.length ? projects.map((project) => <button className="pill" style={{ margin: 4 }} type="button" key={project.id} onClick={() => openProject(project.id)}>{project.name}</button>) : <p className="muted">点击“加载项目列表”。</p>}
      </div>
    </div>
    <div className="card" style={{ height: 520, marginTop: 16 }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={(changes) => setNodes((items) => applyNodeChanges(changes, items))} onEdgesChange={(changes) => setEdges((items) => applyEdgeChanges(changes, items))} onConnect={(params) => setEdges((items) => addEdge(params, items))} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
    <div className="grid two" style={{ marginTop: 16 }}>
      <form className="card" onSubmit={importCanvas}>
        <p className="eyebrow">Import / Export</p>
        <label>Canvas JSON</label>
        <textarea data-testid="canvas-json" value={importText || exported} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn" type="submit">导入 JSON</button>
      </form>
      <div className="card"><p className="eyebrow">Result</p><pre>{JSON.stringify(result ?? { hint: 'Create a task from canvas.' }, null, 2)}</pre></div>
    </div>
  </section>;
}
