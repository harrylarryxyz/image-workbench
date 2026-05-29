export type AnchorKey = 'subject' | 'useContext' | 'audience' | 'visualDirection';
export type AnchorState = 'known' | 'assumed' | 'missing';
export type RouteState = 'reference-first' | 'generate-first' | 'ask-first';

export type CreationCaseAnchor = {
  key: AnchorKey;
  label: string;
  value?: string;
  state: AnchorState;
  hardBlocker?: boolean;
};

export type ReferenceTerritory = {
  id: string;
  label: string;
  reason: string;
  cues: string[];
};

export type ComparisonCandidate = {
  id: string;
  label: string;
  summary: string;
  active?: boolean;
};

export type CreationCase = {
  originalIntent: string;
  intentSummary: string;
  route: RouteState;
  routeReason: string;
  anchors: CreationCaseAnchor[];
  assumptions: string[];
  nextAction: string;
  referenceTerritories: ReferenceTerritory[];
  champion?: ComparisonCandidate;
  comparisons: ComparisonCandidate[];
  blocker?: {
    anchor: AnchorKey;
    title: string;
    actions: string[];
  };
  committed?: boolean;
  commitSummary?: string;
};

export const visualStageProductMarkers = [
  'Visual Stage',
  'Creation Case',
  'Reference-first',
  'Generate-first',
  'Ask-first',
  'Champion',
  'Comparison Set',
  'Unblocker Card',
  '专业不降级，兴趣不劝退',
] as const;

export function deriveCreationCase(intent: string): CreationCase {
  const trimmed = intent.trim();

  return {
    originalIntent: trimmed,
    intentSummary: trimmed ? `Creation Case draft：${trimmed}` : 'Creation Case draft：等待你的第一句粗糙意图。',
    route: 'reference-first',
    routeReason: 'Reference-first / Generate-first / Ask-first router will choose the fastest useful visual feedback after intent is understood.',
    anchors: [
      { key: 'subject', label: 'Subject / Source', state: 'missing', hardBlocker: true },
      { key: 'useContext', label: 'Use context', state: 'missing' },
      { key: 'audience', label: 'Audience', state: 'missing' },
      { key: 'visualDirection', label: 'Visual direction', state: 'missing' },
    ],
    assumptions: [],
    nextAction: 'Start Visual Stage',
    referenceTerritories: [],
    comparisons: [],
  };
}
