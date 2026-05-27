'use client';

import '@xyflow/react/dist/style.css';
import { FormEvent, useMemo, useState } from 'react';
import { Background, Controls, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { apiPost } from '../../lib/api';

type CanvasExport = { nodes: Node[]; edges: Edge[] };

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

  async function createTaskFromCanvas() {
    const prompt = promptFromNodes(nodes);
    const created = await apiPost('/tasks/generate', { prompt, model: 'gpt-image-2', size: '1024x1024', quality: 'low', format: 'png', background: 'auto', apiMode: 'auto', count: 1, timeoutSec: 600 });
    setResult(created);
    setNodes((prev) => [...prev, { id: `created-task-${Date.now()}`, position: { x: 720, y: 100 }, data: { label: `Created Task\n${(created as any).id ?? 'unknown'}` } }]);
  }

  return <section>
    <div className="hero"><p className="eyebrow">Canvas Workflow</p><h1>节点画布</h1><p className="sub">React Flow 画布：Prompt / Image / Task 节点、引用边、JSON 导入导出，并可直接从 Prompt 节点创建生成任务。</p></div>
    <div className="actions" style={{ marginTop: 16 }}>
      <button className="pill" type="button" onClick={addPromptNode}>添加 Prompt 节点</button>
      <button className="pill" type="button" onClick={addImageNode}>添加 Image 节点</button>
      <button className="pill" type="button" onClick={addTaskNode}>添加 Task 节点</button>
      <button className="pill" type="button" onClick={createTaskFromCanvas}>从画布创建任务</button>
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
        <textarea value={importText || exported} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn" type="submit">导入 JSON</button>
      </form>
      <div className="card"><p className="eyebrow">Result</p><pre>{JSON.stringify(result ?? { hint: 'Create a task from canvas.' }, null, 2)}</pre></div>
    </div>
  </section>;
}
