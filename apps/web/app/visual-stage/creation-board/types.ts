export type CreationObjectKind =
  | 'brief'
  | 'reference.image'
  | 'generated.image'
  | 'text'
  | 'brand.palette'
  | 'brand.font'
  | 'task.generate'
  | 'task.edit'
  | 'artboard'
  | 'deliverable';

export type SemanticSlot =
  | 'product'
  | 'person'
  | 'composition'
  | 'styleMood'
  | 'background'
  | 'brand'
  | 'textLayout'
  | 'resultAnchor';

export type CreationObjectStatus = 'draft' | 'active' | 'champion' | 'rejected' | 'exported';

export type CreationObject = {
  id: string;
  kind: CreationObjectKind;
  title: string;
  summary?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  selected?: boolean;
  status?: CreationObjectStatus;
  asset?: {
    assetId?: string;
    storageKey?: string;
    thumbnailUrl?: string;
    assetUrl?: string;
  };
  text?: {
    content: string;
    role: 'title' | 'subtitle' | 'cta' | 'note' | 'prompt' | 'feedback';
    styleHint?: string;
  };
  semantic?: {
    slot?: SemanticSlot;
    priority?: number;
    keep?: string[];
    borrow?: string[];
    avoid?: string[];
  };
  lineage?: {
    sourceNodeIds?: string[];
    sourceRunId?: string;
    taskId?: string;
    versionOf?: string;
  };
};

export type CreationRelationType =
  | 'reference'
  | 'generation'
  | 'variant'
  | 'edit'
  | 'text-binding'
  | 'brand-constraint'
  | 'adoption'
  | 'export';

export type CreationRelation = {
  id: string;
  sourceId: string;
  targetId: string;
  type: CreationRelationType;
  strength?: 'primary' | 'secondary' | 'faded';
  selectedLineage?: boolean;
};

export type SessionRelation = { from: string; to: string; label?: string };

export type SessionCanvasItem = {
  id: string;
  title: string;
  image?: {
    storageKey: string;
    assetUrl?: string;
    format: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
  };
  intent?: string;
  references?: Array<{
    id: string;
    label: string;
    source: 'local' | 'asset' | 'history' | 'canvas';
    title: string;
    hint: string;
    role?: string;
    storageKey?: string;
    assetUrl?: string;
    sourceObjectId?: string;
    parentObjectIds?: string[];
  }>;
  branchCount?: number;
  candidateIndex?: number;
  taskId?: string;
  sourceObjectId?: string;
  parentObjectIds?: string[];
  generationParams?: { count: number; size: string; quality: string; format: string; apiMode: string; background: string };
  createdAt?: number;
};

export type CreationBoardState = {
  objects: CreationObject[];
  relations: CreationRelation[];
  selectedObjectId: string;
};
