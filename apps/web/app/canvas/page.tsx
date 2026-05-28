'use client';

import '@xyflow/react/dist/style.css';
import { FormEvent, useMemo, useState } from 'react';
import { Background, Controls, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

type CanvasExport = { nodes: Node[]; edges: Edge[] };
type CanvasProject = CanvasExport & { id: string; name: string; description?: string | null; updatedAt?: string };

const initialNodes: Node[] = [
  { id: 'prompt-1', type: 'default', position: { x: 40, y: 80 }, data: { label: 'Prompt\nA cinematic orange robot fixing a neon sign', prompt: 'A cinematic orange robot fixing a neon sign' } },
  { id: 'task-1', type: 'default', position: { x: 380, y: 80 }, data: { label: 'Task\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } },
];
const initialEdges: Edge[] = [{ id: 'prompt-1-task-1', source: 'prompt-1', target: 'task-1', label: 'creates' }];

function promptFromNodes(nodes: Node[]) {
  const promptNode = nodes.find((node) => node.id.startsWith('prompt'));
  const dataPrompt = String(promptNode?.data?.prompt ?? '').trim();
  if (dataPrompt) return dataPrompt;
  const label = String(promptNode?.data?.label ?? '');
  return label.split('\n').slice(1).join('\n').trim() || label || 'A polished image generated from canvas nodes';
}

function labelForNode(id: string, data: any) {
  if (id.startsWith('prompt')) return `Prompt\n${String(data.prompt ?? '').trim() || 'Describe your subject here'}`;
  if (id.startsWith('image')) return `Image Reference\n${String(data.storageKey ?? '').trim() || 'Paste storage key from Gallery/Edit upload'}`;
  if (id.startsWith('task')) return `Task\n${data.model ?? 'gpt-image-2'} · ${data.size ?? '1024x1024'}`;
  return String(data.label ?? id);
}

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [importText, setImportText] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('prompt-1');
  const exported = useMemo(() => JSON.stringify({ nodes, edges } satisfies CanvasExport, null, 2), [nodes, edges]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  function addPromptNode() {
    const id = `prompt-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 80, y: 220 + prev.length * 20 }, data: { label: 'Prompt\nDescribe your subject here', prompt: 'Describe your subject here' } }]);
    setSelectedNodeId(id);
  }

  function addImageNode() {
    const id = `image-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 260, y: 240 + prev.length * 20 }, data: { label: 'Image Reference\nPaste storage key from Gallery/Edit upload', storageKey: '' } }]);
    setSelectedNodeId(id);
  }

  function addTaskNode() {
    const id = `task-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 520, y: 260 + prev.length * 20 }, data: { label: 'Task\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } }]);
    setSelectedNodeId(id);
  }

  function patchSelectedData(patch: Record<string, unknown>) {
    if (!selectedNode) return;
    setNodes((prev) => prev.map((node) => {
      if (node.id !== selectedNode.id) return node;
      const data = { ...(node.data ?? {}), ...patch };
      return { ...node, data: { ...data, label: labelForNode(node.id, data) } };
    }));
  }

  function importCanvas(event: FormEvent) {
    event.preventDefault();
    const parsed = JSON.parse(importText) as CanvasExport;
    setNodes(parsed.nodes ?? []);
    setEdges(parsed.edges ?? []);
    setSelectedNodeId(parsed.nodes?.[0]?.id ?? null);
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
    setSelectedNodeId(project.nodes?.[0]?.id ?? null);
    setImportText('');
    setResult({ opened: project.id });
  }

  async function saveProject(): Promise<CanvasProject> {
    const body = { name: projectName, nodes, edges };
    const saved = activeProjectId ? await apiPatch<CanvasProject>(`/canvas-projects/${activeProjectId}`, body) : await apiPost<CanvasProject>('/canvas-projects', body);
    setActiveProjectId(saved.id);
    setProjectName(saved.name);
    setResult({ saved: saved.id });
    await loadProjects();
    return saved;
  }

  async function deleteProject() {
    if (!activeProjectId) return;
    await apiDelete(`/canvas-projects/${activeProjectId}`);
    setActiveProjectId(null);
    setResult({ deleted: true });
    await loadProjects();
  }

  async function createTaskFromCanvas() {
    const saved = await saveProject();
    const run = await apiPost(`/canvas-projects/${saved.id}/run`, {});
    setResult(run);
    const created = (run as any).created ?? [];
    if (created.length) {
      setNodes((prev) => prev.map((node) => {
        const match = created.find((item: any) => item.nodeId === node.id);
        return match ? { ...node, data: { ...(node.data ?? {}), taskId: match.taskId, status: match.status, label: `${String(node.data?.label ?? 'Task').split('\n')[0]}\n${match.taskId}` } } : node;
      }));
    }
  }

  return <section>
    <div className="hero"><p className="eyebrow">Canvas Workflow</p><h1>节点画布</h1><p className="sub">React Flow 画布：Prompt / Image / Task 节点、引用边、JSON 导入导出、项目持久化，并可直接按连线执行 Task 节点，自动创建 Generate/Edit 任务并回写 taskId。</p></div>
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
          <button className="pill" type="button" onClick={() => saveProject()}>{activeProjectId ? '保存项目' : '新建保存'}</button>
          <button className="pill" type="button" onClick={loadProjects}>加载项目列表</button>
          <button className="pill" type="button" onClick={deleteProject} disabled={!activeProjectId}>删除当前项目</button>
        </div>
      </div>
      <div className="card">
        <p className="eyebrow">Saved Projects</p>
        {projects.length ? projects.map((project) => <button className="pill" style={{ margin: 4 }} type="button" key={project.id} onClick={() => openProject(project.id)}>{project.name}</button>) : <p className="muted">点击“加载项目列表”。</p>}
      </div>
    </div>
    <div className="grid two" style={{ marginTop: 16 }}>
      <div className="card" style={{ height: 520 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={(changes) => setNodes((items) => applyNodeChanges(changes, items))} onEdgesChange={(changes) => setEdges((items) => applyEdgeChanges(changes, items))} onConnect={(params) => setEdges((items) => addEdge(params, items))} onNodeClick={(_, node) => setSelectedNodeId(node.id)} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="card" data-testid="canvas-node-editor">
        <p className="eyebrow">Node Editor</p>
        {selectedNode ? <>
          <h3>{selectedNode.id}</h3>
          {selectedNode.id.startsWith('prompt') ? <>
            <label>Prompt</label>
            <textarea value={String(selectedNode.data?.prompt ?? String(selectedNode.data?.label ?? '').split('\n').slice(1).join('\n'))} onChange={(event) => patchSelectedData({ prompt: event.target.value })} />
          </> : null}
          {selectedNode.id.startsWith('image') ? <>
            <label>Storage Key</label>
            <input placeholder="local://uploads/default/... 或图库 storageKey" value={String(selectedNode.data?.storageKey ?? '')} onChange={(event) => patchSelectedData({ storageKey: event.target.value })} />
            <p className="muted">可从 Gallery 的“作为参考图”或 Edit 上传结果里复制 storageKey。</p>
          </> : null}
          {selectedNode.id.startsWith('task') ? <>
            <label>Model</label>
            <input value={String(selectedNode.data?.model ?? 'gpt-image-2')} onChange={(event) => patchSelectedData({ model: event.target.value })} />
            <label>Size</label>
            <input value={String(selectedNode.data?.size ?? '1024x1024')} onChange={(event) => patchSelectedData({ size: event.target.value })} />
            <label>Quality</label>
            <select value={String(selectedNode.data?.quality ?? 'low')} onChange={(event) => patchSelectedData({ quality: event.target.value })}><option>low</option><option>medium</option><option>high</option></select>
          </> : null}
        </> : <p className="muted">点击画布节点后编辑。</p>}
      </div>
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
