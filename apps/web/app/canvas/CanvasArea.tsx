import { Background, Controls, MiniMap, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, type Edge, type Node } from '@xyflow/react';
import { Dispatch, SetStateAction } from 'react';
import { CanvasDock } from './CanvasDock';

type CanvasAreaProps = {
  nodes: Node[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;
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

export function CanvasArea(props: CanvasAreaProps) {
  const { nodes, edges, setNodes, setEdges, setSelectedNodeId } = props;

  return <div className="canvas-surface">
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={(changes) => setNodes((items) => applyNodeChanges(changes, items))} onEdgesChange={(changes) => setEdges((items) => applyEdgeChanges(changes, items))} onConnect={(params) => setEdges((items) => addEdge(params, items))} onNodeClick={(_, node) => setSelectedNodeId(node.id)} fitView>
      <Background color="rgba(255,255,255,.14)" gap={22} />
      <MiniMap pannable zoomable />
      <Controls />
    </ReactFlow>
    <CanvasDock {...props} />
  </div>;
}
