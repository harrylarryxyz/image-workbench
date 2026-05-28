'use client';

import '@xyflow/react/dist/style.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { CanvasArea } from './CanvasArea';
import { CanvasHero } from './CanvasHero';
import { CanvasInspector } from './CanvasInspector';
import { ImportExportPanel } from './ImportExportPanel';
import { RunOutputPanel } from './RunOutputPanel';
import { initialEdges, initialNodes, labelForNode } from './canvas-utils';
import type { CanvasExport, CanvasProject, CanvasRun, CanvasRunResult } from './types';

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
  const exported = useMemo(() => JSON.stringify({ nodes, edges } satisfies CanvasExport), [nodes, edges]);
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
    setNodes((prev) => [...prev, { id, type: 'default', position: { x: 260, y: 240 + prev.length * 20 }, data: { label: 'Image\n从素材库或编辑工作区选择图片', storageKey: '' } }]);
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
    <CanvasHero />
    {/* Canvas Dock lives in CanvasArea; keep this marker for product UI contract. */}
    <div className="canvas-workbench responsive-canvas-workbench">
      <CanvasArea nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} setSelectedNodeId={setSelectedNodeId} selectedNode={selectedNode} activeProjectId={activeProjectId} selectedNodeId={selectedNodeId} addPromptNode={addPromptNode} addImageNode={addImageNode} addTaskNode={addTaskNode} duplicateSelected={duplicateSelected} rerunSelectedNode={rerunSelectedNode} createTaskFromCanvas={createTaskFromCanvas} />
      <CanvasInspector selectedNode={selectedNode} projectName={projectName} setProjectName={setProjectName} activeProjectId={activeProjectId} message={message} projects={projects} templates={templates} patchSelectedData={patchSelectedData} saveProject={saveProject} loadProjects={loadProjects} loadTemplates={loadTemplates} loadRuns={loadRuns} askAgentNext={askAgentNext} deleteProject={deleteProject} clearCanvas={clearCanvas} openProject={openProject} useTemplate={useTemplate} />
    </div>
    <div className="grid gap-4 md:grid-cols-2 mt-4 canvas-secondary-panels">
      <RunOutputPanel runItems={runItems} visibleRuns={visibleRuns} replayRun={replayRun} />
      <ImportExportPanel importText={importText} exported={exported} setImportText={setImportText} importCanvas={importCanvas} />
    </div>
  </section>;
}
