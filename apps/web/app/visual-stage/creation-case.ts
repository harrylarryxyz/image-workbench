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

const referenceTerritories: ReferenceTerritory[] = [
  {
    id: 'restrained-premium',
    label: '克制高级 / restrained premium',
    reason: '低饱和、留白、质感光影，适合“高级一点”但还缺主体来源的头像方向。',
    cues: ['高级', '克制', '真实', '柔和边缘'],
  },
  {
    id: 'commercial-clean',
    label: '商业可信 / commercial clean',
    reason: '更适合公开账号或品牌身份，强调清晰、可信、可投放。',
    cues: ['商业', '可信', '清晰轮廓', '浅景深'],
  },
  {
    id: 'designed-avatar',
    label: '设计化头像 / designed avatar',
    reason: '当没有真人照片时，用抽象角色、品牌符号或材质隐喻避免伪造真人身份。',
    cues: ['抽象头像', '设计', '非侵权', '符号化'],
  },
];

const baseComparisons: ComparisonCandidate[] = [
  {
    id: 'restrained',
    label: '更克制方向',
    summary: '减少高饱和与装饰，保留专业质感。',
  },
  {
    id: 'commercial',
    label: '更商业方向',
    summary: '强调可读主体、可投放构图与明确用途。',
  },
];

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

function anchor(key: AnchorKey, label: string, value: string | undefined, state: AnchorState, hardBlocker = false): CreationCaseAnchor {
  return { key, label, value, state, hardBlocker };
}

export function deriveCreationCase(intent: string): CreationCase {
  const trimmed = intent.trim();
  const hasAvatar = includesAny(trimmed, ['头像', 'avatar']);
  const hasPoster = includesAny(trimmed, ['海报', 'poster', '社媒', '首发']);
  const hasAudience = includesAny(trimmed, ['面向', '受众', '年轻咖啡爱好者']);
  const hasSubject = includesAny(trimmed, ['瓶身', '冰块', '冷萃品牌', '产品', '照片', '参考图']);
  const hasVisualDirection = includesAny(trimmed, ['黑金', '极简', '高级', '克制', '商业']);
  const hasLikenessRisk = includesAny(trimmed, ['某明星', '明星风格', '像某明星', 'likeness', '肖像']);
  const hasPersonalPhoto = includesAny(trimmed, ['我照片', '真人', '本人照片']);

  if (hasLikenessRisk || (hasPersonalPhoto && hasAvatar)) {
    return {
      originalIntent: trimmed,
      intentSummary: trimmed ? `Creation Case draft：${trimmed}` : 'Creation Case draft：等待你的第一句粗糙意图。',
      route: 'ask-first',
      routeReason: 'Ask-first：真人肖像 / likeness / IP / 明星风格存在硬风险；先确认来源与安全替代，舞台保持可继续。',
      anchors: [
        anchor('subject', 'Subject / Source', hasPersonalPhoto ? '用户照片，来源/授权待确认' : undefined, 'missing', true),
        anchor('useContext', 'Use context', hasAvatar ? '社交头像 / social avatar' : undefined, hasAvatar ? 'assumed' : 'missing'),
        anchor('audience', 'Audience', '公开社交场景', 'assumed'),
        anchor('visualDirection', 'Visual direction', '安全替代：抽象头像 / 非侵权视觉气质', 'assumed'),
      ],
      assumptions: ['不生成可混淆真人或明星肖像', '保留抽象头像、材质隐喻、品牌符号作为可继续方向'],
      nextAction: 'Resolve blocker before generation',
      referenceTerritories,
      comparisons: baseComparisons,
      blocker: {
        anchor: 'subject',
        title: 'Unblocker Card · 安全替代 / 抽象头像 / 非侵权',
        actions: ['确认本人照片授权', '改成抽象头像', '改成非侵权气质参考', '使用品牌符号'],
      },
    };
  }

  if (hasPoster && hasAudience && hasSubject && hasVisualDirection) {
    return {
      originalIntent: trimmed,
      intentSummary: `Creation Case draft：年轻咖啡爱好者的黑金极简社媒海报，突出瓶身和冰块。`,
      route: 'generate-first',
      routeReason: 'Generate-first：用途、受众、主体与视觉方向足够清楚，可以先给一个可判断的本地 mock 首稿。',
      anchors: [
        anchor('subject', 'Subject / Source', '冷萃瓶身 + 冰块', 'known'),
        anchor('useContext', 'Use context', '1:1 社媒首发海报', 'known'),
        anchor('audience', 'Audience', '年轻咖啡爱好者', 'known'),
        anchor('visualDirection', 'Visual direction', '黑金配色，极简高级', 'known'),
      ],
      assumptions: ['Assumed format: 1:1 square / 方图', 'Assumed delivery: 社媒首发静态海报'],
      nextAction: 'Review champion draft',
      referenceTerritories,
      champion: {
        id: 'mock-poster-champion',
        label: 'Champion · 当前最佳首稿',
        summary: '黑金低调背景、瓶身居中、冰块作为冷感高光；用于判断方向，不调用真实生成。',
        active: true,
      },
      comparisons: [
        ...baseComparisons,
        { id: 'bold', label: '更大胆方向', summary: '增强反差和首发冲击，但不牺牲高级感。' },
      ],
    };
  }

  if (hasAvatar) {
    return {
      originalIntent: trimmed,
      intentSummary: `Creation Case draft：${trimmed}；系统先假设用途是社交头像 / social avatar，但主体来源缺失。`,
      route: 'reference-first',
      routeReason: 'Reference-first：审美词足够开始看方向，但头像主体/来源缺失，先给参考领地和一个补齐主体的 Unblocker Card。',
      anchors: [
        anchor('subject', 'Subject / Source', undefined, 'missing', true),
        anchor('useContext', 'Use context', '社交头像 / social avatar', 'assumed'),
        anchor('audience', 'Audience', '公开社交账号浏览者', 'assumed'),
        anchor('visualDirection', 'Visual direction', hasVisualDirection ? '高级、克制、专业' : undefined, hasVisualDirection ? 'assumed' : 'missing'),
      ],
      assumptions: ['Assumed use: 社交头像 / social avatar', 'Assumed audience: 公开社交账号浏览者'],
      nextAction: 'Choose a territory or resolve subject source',
      referenceTerritories,
      comparisons: baseComparisons,
      blocker: {
        anchor: 'subject',
        title: 'Unblocker Card · 补齐主体：上传照片 / 抽象头像 / 品牌符号',
        actions: ['上传照片', '使用抽象头像', '使用虚构角色', '选择品牌符号'],
      },
    };
  }

  return {
    originalIntent: trimmed,
    intentSummary: trimmed ? `Creation Case draft：${trimmed}` : 'Creation Case draft：等待你的第一句粗糙意图。',
    route: 'reference-first',
    routeReason: 'Reference-first / Generate-first / Ask-first router will choose the fastest useful visual feedback after intent is understood.',
    anchors: [
      anchor('subject', 'Subject / Source', undefined, 'missing', true),
      anchor('useContext', 'Use context', undefined, 'missing'),
      anchor('audience', 'Audience', undefined, 'missing'),
      anchor('visualDirection', 'Visual direction', undefined, 'missing'),
    ],
    assumptions: [],
    nextAction: 'Start Visual Stage',
    referenceTerritories: [],
    comparisons: [],
  };
}
