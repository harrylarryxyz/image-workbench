'use client';

import '@xyflow/react/dist/style.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

type CanvasExport = { nodes: Node[]; edges: Edge[] };
type CanvasProject = CanvasExport & { id: string; name: string; description?: string | null; updatedAt?: string };
type CanvasRunResult = { projectId?: string; created?: Array<{ nodeId: string; taskId: string; status: string; type?: string }>; [key: string]: unknown };

const initialNodes: Node[] = [
  { id: 'prompt-1', type: 'default', position: { x: 40, y: 80 }, data: { label: 'Text\nA cinematic orange robot fixing a neon sign', prompt: 'A cinematic orange robot fixing a neon sign' } },
  { id: 'task-1', type: 'default', position: { x: 380, y: 80 }, data: { label: 'Generation\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } },
];
const initialEdges: Edge[] = [{ id: 'prompt-1-task-1', source: 'prompt-1', target: 'task-1', label: 'creates' }];

function labelForNode(id: string, data: Record<string, unknown>) {
  if (id.startsWith('prompt')) return `Text\n${String(data.prompt ?? '').trim() || 'Describe your subject here'}`;
  if (id.startsWith('image')) return `Image\n${String(data.storageKey ?? '').trim() || 'Paste storage key from Gallery/Edit upload'}`;
  if (id.startsWith('task')) return `Generation\n${data.model ?? 'gpt-image-2'} · ${data.size ?? '1024x1024'}`;
  return String(data.label ?? id);
}

function nodeKind(id?: string | null) {
  if (!id) return 'none';
  if (id.startsWith('prompt')) return 'Text node';
  if (id.startsWith('image')) return 'Image node';
  if (id.startsWith('task')) return 'Generation config';
  return 'Node';
}

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [importText, setImportText] = useState('');
  const [result, setResult] = useState<CanvasRunResult | null>(null);
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('prompt-1');
  const exported = useMemo(() => JSON.stringify({ nodes, edges } satisfies CanvasExport, null, 2), [nodes, edges]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const image = params.get('image');
    const prompt = params.get('prompt');
    if (!image && !prompt) return;
    setNodes((prev) => {
      let next = prev;
      if (prompt) next = next.map((node) => node.id === 'prompt-1' ? { ...node, data: { ...(node.data ?? {}), prompt, label: `Text\n${prompt}` } } : node);
      if (image) next = [...next, { id: `image-${Date.now()}`, type: 'default', position: { x: 210, y: 230 }, data: { label: `Image\n${image}`, storageKey: image } }];
      return next;
    });
  }, []);

  function addPromptNode() {
    const id = `prompt-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 80, y: 220 + prev.length * 20 }, data: { label: 'Text\nDescribe your subject here', prompt: 'Describe your subject here' } }]);
    setSelectedNodeId(id);
  }

  function addImageNode() {
    const id = `image-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 260, y: 240 + prev.length * 20 }, data: { label: 'Image\nPaste storage key from Gallery/Edit upload', storageKey: '' } }]);
    setSelectedNodeId(id);
  }

  function addTaskNode() {
    const id = `task-${Date.now()}`;
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 520, y: 260 + prev.length * 20 }, data: { label: 'Generation\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } }]);
    setSelectedNodeId(id);
  }

  function duplicateSelected() {
    if (!selectedNode) return;
    const id = `${selectedNode.id.split('-')[0]}-${Date.now()}`;
    setNodes((prev) => [...prev, { ...selectedNode, id, selected: false, position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 40 } }]);
    setSelectedNodeId(id);
  }

  function clearCanvas() {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId('prompt-1');
    setResult(null);
  }

  function patchSelectedData(patch: Record<string, unknown>) {
    if (!selectedNode) return;
    setNodes((prev) => prev.map((node) => {
      if (node.id !== selectedNode.id) return node;
      const data = { ...(node.data ?? {}), ...patch } as Record<string, unknown>;
      return { ...node, data: { ...data, label: labelForNode(node.id, data) } };
    }));
  }

  function importCanvas(event: FormEvent) {
    event.preventDefault();
    const parsed = JSON.parse(importText) as CanvasExport;
    setNodes(parsed.nodes ?? []);
    setEdges(parsed.edges ?? []);
    setSelectedNodeId(parsed.nodes?.[0]?.id ?? null);
    setResult({ imported: true, nodes: parsed.nodes?.length ?? 0, edges: parsed.edges?.length ?? 0 });
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
    const run = await apiPost<CanvasRunResult>(`/canvas-projects/${saved.id}/run`, {});
    setResult(run);
    const created = run.created ?? [];
    if (created.length) {
      setNodes((prev) => prev.map((node) => {
        const match = created.find((item) => item.nodeId === node.id);
        return match ? { ...node, data: { ...(node.data ?? {}), taskId: match.taskId, status: match.status, label: `${String(node.data?.label ?? 'Generation').split('\n')[0]}\n${match.taskId}` } } : node;
      }));
    }
  }

  const runItems = result?.created ?? [];

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Canvas Workflow</p>
      <h1>无限画布工作台</h1>
      <p className="sub">Canvas Dock + 右侧 Inspector：用 Text / Image / Generation 节点组织创作，执行后自动保存项目、创建任务并回写 taskId。</p>
    </div>

    <div className="canvas-workbench">
      <div className="canvas-surface">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={(changes) => setNodes((items) => applyNodeChanges(changes, items))} onEdgesChange={(changes) => setEdges((items) => applyEdgeChanges(changes, items))} onConnect={(params) => setEdges((items) => addEdge(params, items))} onNodeClick={(_, node) => setSelectedNodeId(node.id)} fitView>
          <Background color="rgba(255,255,255,.14)" gap={22} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
        <div className="canvas-dock" aria-label="Canvas Dock">
          <button className="pill" type="button" onClick={addPromptNode}>添加 Prompt 节点</button>
          <button className="pill" type="button" onClick={addImageNode}>添加 Image 节点</button>
          <button className="pill" type="button" onClick={addTaskNode}>添加 Task 节点</button>
          <button className="pill" type="button" onClick={duplicateSelected} disabled={!selectedNode}>复制节点</button>
          <button className="pill" type="button" onClick={createTaskFromCanvas}>执行画布任务</button>
        </div>
      </div>

      <aside className="card canvas-inspector" data-testid="canvas-node-editor">
        <p className="eyebrow">Inspector</p>
        <h2>{nodeKind(selectedNode?.id)}</h2>
        <label>项目名</label>
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
        <div className="actions">
          <button className="pill" type="button" onClick={() => saveProject()}>{activeProjectId ? '保存项目' : '新建保存'}</button>
          <button className="pill" type="button" onClick={loadProjects}>加载项目列表</button>
          <button className="pill" type="button" onClick={deleteProject} disabled={!activeProjectId}>删除当前项目</button>
          <button className="pill" type="button" onClick={clearCanvas}>重置画布</button>
        </div>

        {selectedNode ? <div className="control-stack">
          <div className="notice"><b>{selectedNode.id}</b><p className="fine-print">选中节点会在这里编辑；连线决定执行时的 prompt 与 reference 关系。</p></div>
          {selectedNode.id.startsWith('prompt') ? <>
            <label>Prompt</label>
            <textarea value={String(selectedNode.data?.prompt ?? String(selectedNode.data?.label ?? '').split('\n').slice(1).join('\n'))} onChange={(event) => patchSelectedData({ prompt: event.target.value })} />
          </> : null}
          {selectedNode.id.startsWith('image') ? <>
            <label>Storage Key</label>
            <input placeholder="local://uploads/default/... 或图库 storageKey" value={String(selectedNode.data?.storageKey ?? '')} onChange={(event) => patchSelectedData({ storageKey: event.target.value })} />
            <p className="muted">可从 Asset Library 的“Canvas”动作或 Edit 上传结果传入。</p>
          </> : null}
          {selectedNode.id.startsWith('task') ? <>
            <label>Model</label>
            <input value={String(selectedNode.data?.model ?? 'gpt-image-2')} onChange={(event) => patchSelectedData({ model: event.target.value })} />
            <label>Size</label>
            <input value={String(selectedNode.data?.size ?? '1024x1024')} onChange={(event) => patchSelectedData({ size: event.target.value })} />
            <label>Quality</label>
            <select value={String(selectedNode.data?.quality ?? 'low')} onChange={(event) => patchSelectedData({ quality: event.target.value })}><option>low</option><option>medium</option><option>high</option></select>
          </> : null}
        </div> : <p className="muted">点击画布节点后编辑。</p>}

        <div className="actions">
          {projects.length ? projects.map((project) => <button className="pill" type="button" key={project.id} onClick={() => openProject(project.id)}>{project.name}</button>) : <span className="fine-print">点击“加载项目列表”查看已保存画布。</span>}
        </div>
      </aside>
    </div>

    <div className="grid two" style={{ marginTop: 16 }}>
      <section className="card">
        <p className="eyebrow">Run output</p>
        <h2>{runItems.length ? `${runItems.length} 个节点已创建任务` : '还没有运行结果'}</h2>
        <div className="task-list">
          {runItems.map((item) => <div className="task-card" key={`${item.nodeId}-${item.taskId}`}>
            <div className="task-head"><span className="status wait">{item.status}</span><span className="fine-print">{item.nodeId}</span></div>
            <h3>{item.taskId}</h3>
            <div className="actions"><a className="pill" href={`/tasks/${item.taskId}`}>打开任务详情</a></div>
          </div>)}
        </div>
        <details className="diagnostics">
          <summary>Diagnostics · run result</summary>
          <pre className="debug-json">{JSON.stringify(result ?? { hint: 'Create a task from canvas.' }, null, 2)}</pre>
        </details>
      </section>

      <form className="card" onSubmit={importCanvas}>
        <p className="eyebrow">Import / Export</p>
        <h2>Canvas JSON</h2>
        <p className="muted">导入/导出保留为高级能力，默认折叠，避免画布主界面被 raw JSON 占据。</p>
        <details className="diagnostics" data-testid="canvas-json-panel">
          <summary>打开 Import / Export JSON</summary>
          <textarea data-testid="canvas-json" value={importText || exported} onChange={(e) => setImportText(e.target.value)} />
          <div className="actions"><button className="btn" type="submit">导入 JSON</button><button className="pill" type="button" onClick={() => navigator.clipboard?.writeText(exported)}>复制 JSON</button></div>
        </details>
      </form>
    </div>
  </section>;
}
