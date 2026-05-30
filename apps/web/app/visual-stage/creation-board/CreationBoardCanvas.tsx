'use client';

import { useEffect, useMemo } from 'react';
import { Background, Controls, MiniMap, ReactFlow, useNodesState, type Edge, type Node as FlowNode, type NodeProps } from '@xyflow/react';
import type { CreationObject, CreationRelation } from './types';
import { CreationObjectNode } from './CreationObjectNode';

type CreationNodeData = Record<string, unknown> & {
  object: CreationObject;
  selectedObjectId: string;
  onShowDetails: (id: string) => void;
  onUseInAssistant: (id: string) => void;
};

type CreationFlowNodeType = FlowNode<CreationNodeData, 'creationObject'>;

function edgeStyle(relation: CreationRelation) {
  if (relation.selectedLineage) return { stroke: '#b96a5c', strokeWidth: 2.8 };
  if (relation.type === 'brand-constraint') return { stroke: '#5b8277', strokeWidth: 1.8 };
  if (relation.type === 'text-binding') return { stroke: '#6b7488', strokeWidth: 1.8 };
  return { stroke: '#d9c2a7', strokeWidth: 1.6 };
}

function CreationFlowNode({ data }: NodeProps<CreationFlowNodeType>) {
  return <CreationObjectNode
    object={data.object}
    selected={data.object.id === data.selectedObjectId}
    onShowDetails={data.onShowDetails}
    onUseInAssistant={data.onUseInAssistant}
  />;
}

const nodeTypes = { creationObject: CreationFlowNode };

export function CreationBoardCanvas({ objects, relations, selectedObjectId, onShowDetails, onUseInAssistant }: {
  objects: CreationObject[];
  relations: CreationRelation[];
  selectedObjectId: string;
  onShowDetails: (id: string) => void;
  onUseInAssistant: (id: string) => void;
}) {
  const hydratedNodes = useMemo<CreationFlowNodeType[]>(() => objects.map((object) => ({
    id: object.id,
    type: 'creationObject',
    position: object.position,
    draggable: true,
    selectable: true,
    dragHandle: '.creation-object-drag-handle',
    data: { object, selectedObjectId, onShowDetails, onUseInAssistant },
  })), [objects, onShowDetails, onUseInAssistant, selectedObjectId]);
  const [nodes, setNodes, onNodesChange] = useNodesState<CreationFlowNodeType>(hydratedNodes);

  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((node) => [node.id, node]));
      return hydratedNodes.map((node) => {
        const existing = currentById.get(node.id);
        return existing ? { ...node, position: existing.position, selected: existing.selected } : node;
      });
    });
  }, [hydratedNodes, setNodes]);

  const edges = useMemo<Edge[]>(() => relations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    type: 'smoothstep',
    animated: relation.selectedLineage,
    label: relation.type,
    markerEnd: relation.selectedLineage ? { type: 'arrowclosed', color: '#b96a5c' } : undefined,
    style: edgeStyle(relation),
    labelStyle: { fill: '#6b7488', fontSize: 10, fontWeight: 700 },
    labelBgStyle: { fill: '#fffaf2', fillOpacity: 0.9 },
    className: relation.strength === 'faded' ? 'opacity-30' : relation.strength === 'secondary' ? 'opacity-70' : undefined,
  })), [relations]);

  return <div data-testid="creation-board-canvas" className="relative h-[520px] min-h-[460px] overflow-hidden rounded-[1.5rem] border border-[#e9d8c4] bg-[#fff1de]/72 shadow-[inset_0_1px_0_rgba(255,250,242,0.82)] md:h-[620px] lg:h-[680px] lg:min-h-[620px]">
    <div aria-hidden="true" className="pointer-events-none absolute left-6 top-5 z-10 rounded-full border border-[#d6e7df] bg-[#e7f1ec]/90 px-3 py-1 text-xs font-semibold text-[#486e64] shadow-[0_10px_24px_rgba(37,48,72,0.08)]">WYSIWYG 无限画布 · 可拖拽 / 缩放 / 平移</div>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={(_, node) => onShowDetails(node.id)}
      onNodeDragStop={(_, node) => setNodes((current) => current.map((item) => item.id === node.id ? { ...item, position: node.position } : item))}
      fitView
      minZoom={0.25}
      maxZoom={1.8}
      defaultEdgeOptions={{ interactionWidth: 18 }}
      panOnDrag={[1, 2]}
      proOptions={{ hideAttribution: true }}
      className="bg-[#fff1de]/72"
    >
      <Background color="rgba(104,85,66,0.22)" gap={24} />
      <MiniMap pannable zoomable nodeStrokeColor="#b96a5c" nodeColor="#fffaf2" maskColor="rgba(37,48,72,0.08)" />
      <Controls />
    </ReactFlow>
  </div>;
}
