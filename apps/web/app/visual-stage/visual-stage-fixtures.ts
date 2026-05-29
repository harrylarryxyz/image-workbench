import type { ComparisonCandidate, ReferenceTerritory } from './creation-case';

export const visualStageScaffolds = ['头像', '海报', '产品图', '封面', '参考图改造'];

export const referenceTerritoryFixtures: ReferenceTerritory[] = [
  {
    id: 'restrained-premium',
    label: 'Reference-first · 克制高级',
    reason: '用更少元素建立专业质感，适合从模糊审美进入方向选择。',
    cues: ['低饱和', '留白', '柔和边缘', '高级但不冷漠'],
  },
  {
    id: 'commercial-contrast',
    label: 'Generate-first · 商业黑金',
    reason: '当主体、用途、受众、视觉方向足够清楚时，可先给一个可判断首稿。',
    cues: ['黑金', '强对比', '产品中心', '社媒首发'],
  },
  {
    id: 'safe-likeness',
    label: 'Ask-first · 安全替代',
    reason: '遇到真人肖像、品牌或 IP 风险时，只阻塞不安全生成，舞台仍保持可继续。',
    cues: ['抽象头像', '非侵权', '身份确认', '来源与权利'],
  },
];

export const visualStageComparisonPlaceholders: ComparisonCandidate[] = [
  {
    id: 'champion-placeholder',
    label: 'Champion · 当前最佳',
    summary: 'Visual Stage 会把当前最可用方向放在中心，而不是让用户在历史里找。',
    active: true,
  },
  {
    id: 'comparison-placeholder',
    label: 'Comparison Set · 备选方向',
    summary: '2–4 个有意义的分支会靠近 Champion，支持判断而不是重写 prompt。',
  },
];
