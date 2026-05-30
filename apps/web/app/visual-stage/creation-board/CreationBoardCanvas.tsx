'use client';

import type { CreationObject, CreationRelation } from './types';
import { CreationObjectNode } from './CreationObjectNode';

function center(object: CreationObject) {
  return {
    x: object.position.x + (object.size?.width ?? 190) / 2,
    y: object.position.y + (object.size?.height ?? 112) / 2,
  };
}

function strokeFor(relation: CreationRelation) {
  if (relation.selectedLineage) return '#b96a5c';
  if (relation.type === 'brand-constraint') return '#5b8277';
  if (relation.type === 'text-binding') return '#6b7488';
  return '#d9c2a7';
}

export function CreationBoardCanvas({ objects, relations, selectedObjectId, onSelectObject, onOpenInspector }: {
  objects: CreationObject[];
  relations: CreationRelation[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onOpenInspector: (id: string) => void;
}) {
  return <div data-testid="creation-board-canvas" className="relative min-h-[620px] min-w-[1160px] overflow-hidden rounded-[1.5rem] border border-[#e9d8c4] bg-[#fff1de]/72 shadow-[inset_0_1px_0_rgba(255,250,242,0.82)]">
    <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(104,85,66,0.15)_1px,transparent_0)] bg-[size:22px_22px] opacity-45" />
    <div aria-hidden="true" className="absolute left-6 top-5 rounded-full border border-[#d6e7df] bg-[#e7f1ec] px-3 py-1 text-xs font-semibold text-[#486e64]">WYSIWYG 创作画布 · 设计层 / 关系层 / 智能层</div>
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 1560 620" preserveAspectRatio="none">
      <defs>
        <marker id="creation-board-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L7,3 z" fill="#b96a5c" />
        </marker>
      </defs>
      {relations.map((relation) => {
        const source = objects.find((object) => object.id === relation.sourceId);
        const target = objects.find((object) => object.id === relation.targetId);
        if (!source || !target) return null;
        const start = center(source);
        const end = center(target);
        const midX = (start.x + end.x) / 2;
        const curve = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
        return <path
          key={relation.id}
          d={curve}
          fill="none"
          stroke={strokeFor(relation)}
          strokeWidth={relation.selectedLineage ? 3 : 1.8}
          strokeDasharray={relation.strength === 'faded' ? '5 8' : relation.strength === 'secondary' ? '4 5' : undefined}
          opacity={relation.strength === 'faded' ? 0.28 : 0.78}
          markerEnd={relation.selectedLineage ? 'url(#creation-board-arrow)' : undefined}
        />;
      })}
    </svg>
    {objects.map((object) => <CreationObjectNode
      key={object.id}
      object={object}
      selected={object.id === selectedObjectId}
      onSelect={onSelectObject}
      onOpenInspector={onOpenInspector}
    />)}
  </div>;
}
