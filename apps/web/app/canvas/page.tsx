'use client';

import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

type CanvasExport = { nodes: Node[]; edges: Edge[] };
type CanvasProject = CanvasExport & { id: string; name: string; description?: string | null; updatedAt?: string; isTemplate?: boolean };
type CanvasRunNode = { id: string; nodeId: string; status: string; taskId?: string; images?: Array<{ assetUrl?: string; thumbnailUrl?: string; storageKey?: string }> };
type CanvasRun = { id: string; status: string; label?: string | null; createdAt?: string; nodes?: CanvasRunNode[]; created?: Array<{ nodeId: string; taskId: string; status: string; type?: string }> };
type CanvasRunResult = CanvasRun & { projectId?: string; [key: string]: unknown };

const initialNodes: Node[] = [
  { id: 'prompt-1', type: 'default', position: { x: 40, y: 80 }, data: { label: 'Text\nA cinematic orange robot fixing a neon sign', prompt: 'A cinematic orange robot fixing a neon sign' } },
  { id: 'task-1', type: 'default', position: { x: 380, y: 80 }, data: { label: 'Generation\ngpt-image-2 · 1024x1024', model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png' } },
];
const initialEdges: Edge[] = [{ id: 'prompt-1-task-1', source: 'prompt-1', target: 'task-1', label: 'creates' }];

function withApi(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return url.startsWith('/api') ? url : `/api${url}`;
}

function labelForNode(id: string, data: Record<string, unknown>) {
  if (id.startsWith('prompt')) return `Text\n${String(data.prompt ?? '').trim() || 'Describe your subject here'}`;
  if (id.startsWith('image')) return `Image\n${String(data.storageKey ?? '').trim() || 'Paste storage key from Gallery/Edit upload'}`;
  if (id.startsWith('task')) return `Generation\n${data.taskId ?? data.model ?? 'gpt-image-2'} · ${data.size ?? '1024x1024'}`;
  return String(data.label ?? id);
}

function nodeKind(id?: string | null) {
  if (!id) return 'none';
  if (id.startsWith('prompt')) return 'Text node';
  if (id.startsWith('image')) return 'Image node';
  if (id.startsWith('task')) return 'Generation config';
  return 'Node';
}

function statusClass(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'succeeded') return 'status ok';
  if (normalized === 'failed' || normalized === 'cancelled') return 'status bad';
  if (normalized === 'running') return 'status run';
  return 'status wait';
}

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [importText, setImportText] = useState('');
  const [result, setResult] = useState<CanvasRunResult | null>(null);
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [templates, setTemplates] = useState<CanvasProject[]>([]);
  const [runs, setRuns] = useState<CanvasRun[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('prompt-1');
  const [message, setMessage] = useState('');
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
    setResult({ id: 'import', status: 'SUCCEEDED', imported: true, importedNodes: parsed.nodes?.length ?? 0, importedEdges: parsed.edges?.length ?? 0 });
  }

  async function loadProjects() {
    const rows = await apiGet<CanvasProject[]>('/canvas-projects');
    setProjects(rows);
    setMessage(`Loaded ${rows.length} projects`);
  }

  async function loadTemplates() {
    const rows = await apiGet<CanvasProject[]>('/canvas-projects/templates');
    setTemplates(rows);
    setMessage(`Loaded ${rows.length} templates`);
  }

  async function loadRuns(projectId = activeProjectId) {
    if (!projectId) return;
    const rows = await apiGet<CanvasRun[]>(`/canvas-projects/${projectId}/runs`);
    setRuns(rows);
  }

  async function openProject(id: string) {
    const project = await apiGet<CanvasProject>(`/canvas-projects/${id}`);
    setActiveProjectId(project.id);
    setProjectName(project.name);
    setNodes(project.nodes ?? []);
    setEdges(project.edges ?? []);
    setSelectedNodeId(project.nodes?.[0]?.id ?? null);
    setImportText('');
    setResult({ id: 'open', status: 'SUCCEEDED', opened: project.id });
    await loadRuns(project.id);
  }

  async function useTemplate(id: string) {
    const project = await apiPost<CanvasProject>(`/canvas-projects/templates/${id}/use`, { name: `${projectName || 'Template'} workspace` });
    await openProject(project.id);
  }

  async function saveProject(options: { template?: boolean } = {}): Promise<CanvasProject> {
    const body = { name: projectName, nodes, edges, isTemplate: options.template };
    const saved = activeProjectId ? await apiPatch<CanvasProject>(`/canvas-projects/${activeProjectId}`, body) : await apiPost<CanvasProject>('/canvas-projects', body);
    setActiveProjectId(saved.id);
    setProjectName(saved.name);
    setResult({ id: 'save', status: 'SUCCEEDED', saved: saved.id });
    await loadProjects();
    return saved;
  }

  async function deleteProject() {
    if (!activeProjectId) return;
    await apiDelete(`/canvas-projects/${activeProjectId}`);
    setActiveProjectId(null);
    setRuns([]);
    setResult({ id: 'delete', status: 'SUCCEEDED', deleted: true });
    await loadProjects();
  }

  function hydrateRun(run: CanvasRunResult) {
    setResult(run);
    setRuns((prev) => [run, ...prev.filter((item) => item.id !== run.id)]);
    const created = run.created ?? [];
    if (created.length) {
      setNodes((prev) => prev.map((node) => {
        const match = created.find((item) => item.nodeId === node.id);
        return match ? { ...node, data: { ...(node.data ?? {}), taskId: match.taskId, status: match.status, label: `${String(node.data?.label ?? 'Generation').split('\n')[0]}\n${match.taskId}` } } : node;
      }));
    }
  }

  async function createTaskFromCanvas() {
    const saved = await saveProject();
    const run = await apiPost<CanvasRunResult>(`/canvas-projects/${saved.id}/run`, {});
    hydrateRun(run);
  }

  async function rerunSelectedNode() {
    if (!activeProjectId || !selectedNodeId) return;
    const run = await apiPost<CanvasRunResult>(`/canvas-projects/${activeProjectId}/run/${selectedNodeId}`, {});
    hydrateRun(run);
  }

  async function replayRun(id: string) {
    if (!activeProjectId) return;
    const run = await apiPost<CanvasRunResult>(`/canvas-projects/${activeProjectId}/runs/${id}/replay`, {});
    hydrateRun(run);
  }

  async function askAgentNext() {
    const reply = await apiPost<any>('/agent/canvas-next', { canvasId: activeProjectId, nodes, edges });
    setResult({ id: 'agent', status: 'SUCCEEDED', agentSuggestion: reply });
    setMessage(reply?.suggestion?.content ?? 'Agent suggestion created.');
  }

  const runItems = result?.created ?? [];
  const visibleRuns = result?.nodes ? [result, ...runs.filter((run) => run.id !== result.id)] : runs;

  return <section>
    <div className="studio-hero">
      <p className="eyebrow">Canvas Workflow</p>
      <h1>专业节点画布</h1>
      <p className="sub">CanvasRun 记录每一次执行：节点状态、任务回写、缩略图、单节点 rerun、run replay 和模板项目都在同一个画布桌面完成。</p>
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
          <button className="pill" type="button" onClick={rerunSelectedNode} disabled={!activeProjectId || !selectedNodeId}>单节点重跑</button>
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
          <button className="pill" type="button" onClick={() => saveProject({ template: true })}>保存为模板</button>
          <button className="pill" type="button" onClick={loadProjects}>加载项目</button>
          <button className="pill" type="button" onClick={loadTemplates}>加载模板</button>
          <button className="pill" type="button" onClick={() => loadRuns()} disabled={!activeProjectId}>刷新运行</button>
          <button className="pill" type="button" onClick={askAgentNext}>Agent 建议下一步</button>
          <button className="pill" type="button" onClick={deleteProject} disabled={!activeProjectId}>删除当前项目</button>
          <button className="pill" type="button" onClick={clearCanvas}>重置画布</button>
        </div>
        {message ? <div className="notice">{message}</div> : null}

        {selectedNode ? <div className="control-stack">
          <div className="notice"><b>{selectedNode.id}</b><p className="fine-print">选中节点会在这里编辑；连线决定执行时的 prompt、reference、mask 和 rerun 范围。</p></div>
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
            <label>Prompt override</label>
            <textarea value={String(selectedNode.data?.prompt ?? '')} onChange={(event) => patchSelectedData({ prompt: event.target.value })} placeholder="可留空，自动使用上游 Prompt 节点" />
            <label>Model</label>
            <input value={String(selectedNode.data?.model ?? 'gpt-image-2')} onChange={(event) => patchSelectedData({ model: event.target.value })} />
            <label>Size</label>
            <input value={String(selectedNode.data?.size ?? '1024x1024')} onChange={(event) => patchSelectedData({ size: event.target.value })} />
            <label>Quality</label>
            <select value={String(selectedNode.data?.quality ?? 'low')} onChange={(event) => patchSelectedData({ quality: event.target.value })}><option>low</option><option>medium</option><option>high</option></select>
            <label>Mask Key</label>
            <input value={String(selectedNode.data?.maskKey ?? '')} onChange={(event) => patchSelectedData({ maskKey: event.target.value })} placeholder="可选：Mask 上传后得到的 storageKey" />
          </> : null}
        </div> : <p className="muted">点击画布节点后编辑。</p>}

        <div className="actions">
          {projects.map((project) => <button className="pill" type="button" key={project.id} onClick={() => openProject(project.id)}>{project.name}</button>)}
          {templates.map((template) => <button className="pill" type="button" key={template.id} onClick={() => useTemplate(template.id)}>模板：{template.name}</button>)}
        </div>
      </aside>
    </div>

    <div className="grid two" style={{ marginTop: 16 }}>
      <section className="card">
        <p className="eyebrow">Run output</p>
        <h2>{runItems.length ? `${runItems.length} 个节点已创建任务` : '运行记录与缩略图'}</h2>
        <div className="task-list">
          {runItems.map((item) => <div className="task-card" key={`${item.nodeId}-${item.taskId}`}>
            <div className="task-head"><span className="status wait">{item.status}</span><span className="fine-print">{item.nodeId}</span></div>
            <h3>{item.taskId}</h3>
            <div className="actions"><Link className="pill" href={`/tasks/${item.taskId}`}>打开任务详情</Link></div>
          </div>)}
          {visibleRuns.map((run) => (run.nodes ?? []).map((node) => <div className="task-card" key={node.id}>
            <div className="task-head"><span className={statusClass(node.status)}>{node.status}</span><span className="fine-print">{node.nodeId}</span></div>
            <h3>{node.taskId ?? node.id}</h3>
            <div className="reference-strip">
              {(node.images ?? []).map((image, index) => {
                const src = withApi(image.thumbnailUrl ?? image.assetUrl ?? (image.storageKey ? `/assets/file?key=${encodeURIComponent(image.storageKey)}` : null));
                return src ? <Link className="reference-card" href={`/gallery?q=${encodeURIComponent(image.storageKey ?? '')}`} key={`${node.id}-${index}`}><img src={src} alt="canvas run result" /></Link> : null;
              })}
            </div>
            {node.taskId ? <div className="actions"><Link className="pill" href={`/tasks/${node.taskId}`}>任务详情</Link><button className="pill" type="button" onClick={() => replayRun(run.id)}>Replay run</button></div> : null}
          </div>))}
        </div>
        <details className="diagnostics">
          <summary>Diagnostics · run result</summary>
          <pre className="debug-json">{JSON.stringify(result ?? { hint: 'Create a task from canvas.' }, null, 2)}</pre>
        </details>
      </section>

      <form className="card" onSubmit={importCanvas}>
        <p className="eyebrow">Import / Export</p>
        <h2>Canvas JSON</h2>
        <p className="muted">导入/导出保留为高级能力，默认折叠。CanvasRun 会额外保留每次执行快照，可 replay。</p>
        <details className="diagnostics" data-testid="canvas-json-panel">
          <summary>打开 Import / Export JSON</summary>
          <textarea data-testid="canvas-json" value={importText || exported} onChange={(e) => setImportText(e.target.value)} />
          <div className="actions"><button className="btn" type="submit">导入 JSON</button><button className="pill" type="button" onClick={() => navigator.clipboard?.writeText(exported)}>复制 JSON</button></div>
        </details>
      </form>
    </div>
  </section>;
}
