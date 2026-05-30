import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const appDir = join(process.cwd(), 'app');
const readPage = (relative) => readFileSync(join(appDir, relative), 'utf8');
const readWeb = (relative) => readFileSync(join(process.cwd(), relative), 'utf8');
const createStudioFiles = [
  'page.tsx',
  'CreateHero.tsx',
  'PromptComposer.tsx',
  'ReferenceDropzone.tsx',
  'AdvancedSettingsPanel.tsx',
  'PromptVariants.tsx',
  'PreviewStage.tsx',
  'SupportGrid.tsx',
];
const readCreateStudioFiles = () => createStudioFiles.map((relative) => ({ relative, text: readPage(relative) }));
const readCreateStudioSurface = () => readCreateStudioFiles().map(({ relative, text }) => `\n/* ${relative} */\n${text}`).join('\n');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('primary product surfaces use studio/library/canvas language instead of debug-first pages', () => {
  const generate = readCreateStudioSurface();
  const gallery = readPage('gallery/page.tsx');
  const canvas = readPage('canvas/page.tsx');

  assert.match(generate, /Create Studio|创作工作台|预览画布|上传参考图/, 'generate home should present a productized create studio');
  assert.match(gallery, /Asset Library|素材库|Lightbox|masonry|image-card/, 'gallery should present an asset library, not a basic list');
  assert.match(canvas, /Canvas Dock|bottom dock|画布工具栏|canvas-dock/, 'canvas should expose a canvas-style dock workflow');
});

test('visual stage route encodes the creation-case router product contract', () => {
  const files = [
    'visual-stage/page.tsx',
    'visual-stage/VisualStageClient.tsx',
    'visual-stage/creation-case.ts',
    'visual-stage/visual-stage-fixtures.ts',
  ];
  const surface = files.map((relative) => `\n/* ${relative} */\n${readPage(relative)}`).join('\n');

  for (const marker of [
    '创作中心原型',
    '移动端优先',
    '创作助手',
    '描述你想要的画面、用途或修改想法',
    '＋添加本地新图片',
    '@引用素材图片或对话历史图片',
    '@图片1',
    '出图关',
    '发送',
    '参数',
    '生成草稿',
    'Creation Board',
    '草稿确认后进画布',
    '中文优先',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `visual stage missing ${marker}`);
  }

  assert.match(surface, /@\/components\/ui\/(button|textarea|card|badge)/, 'Visual Stage should compose shadcn-style primitives');
  assert.doesNotMatch(surface, /JSON\.stringify\([^)]*,\s*null,\s*2\)/, 'Visual Stage must not expose raw JSON diagnostics');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json/i, 'Visual Stage first surface must not expose provider/storage diagnostics');
  assert.doesNotMatch(surface, /<(button|textarea)\b(?![^>]*data-slot)/, 'Visual Stage should use design-system action/input primitives');
});

test('visual stage locks the approved Warm Editorial Board art direction', () => {
  const docPath = join(process.cwd(), '..', '..', 'docs', 'ui', 'visual-stage-creative-board-master.md');
  assert.ok(existsSync(docPath), 'Visual Stage should have a reusable Warm Editorial Board visual-master rules doc');
  const doc = readFileSync(docPath, 'utf8');
  const surface = ['visual-stage/page.tsx', 'visual-stage/VisualStageClient.tsx', 'visual-stage/visual-stage-fixtures.ts']
    .map((relative) => `\n/* ${relative} */\n${readPage(relative)}`)
    .join('\n');

  for (const marker of [
    'D · Creative Board',
    'Warm Editorial Board',
    '温润编辑式创作板',
    'Board-first Visual Stage',
    'Mood before settings',
    'Reference Canvas',
    '70% Paper / 20% Ink / 7% Coral / 3% Sage',
  ]) {
    assert.match(`${doc}\n${surface}`, new RegExp(escapeRegExp(marker)), `Warm Editorial Board visual master missing ${marker}`);
  }

  assert.doesNotMatch(surface, /Linear \/ Raycast|Lunar Precision|Cinema Studio|Atelier Gallery|Velvet Suite|Warm Craft/, 'Visual Stage implementation should not mix competing direction labels after D is selected');
});

test('visual stage applies semantic Warm Editorial Board VI tokens instead of random high-saturation colors', () => {
  const docPath = join(process.cwd(), '..', '..', 'docs', 'ui', 'visual-stage-creative-board-master.md');
  assert.ok(existsSync(docPath), 'Visual Stage should document Warm Editorial Board color hierarchy rules');
  const doc = readFileSync(docPath, 'utf8');
  const surface = readPage('visual-stage/VisualStageClient.tsx');

  for (const marker of [
    'VI color system',
    'Paper 0',
    'Ink 900',
    'Coral 600',
    'Sage 600',
    'no pure black UI surfaces',
    'UI is the frame, not the artwork',
  ]) {
    assert.match(`${doc}\n${surface}`, new RegExp(escapeRegExp(marker)), `Warm Editorial Board VI system missing ${marker}`);
  }

  assert.match(surface, /const\s+vi\s*=/, 'Visual Stage should centralize palette tokens instead of scattering colors');
  assert.match(surface, /data-vi="warm-editorial-board-v1"/, 'Visual Stage shell should expose the applied VI version for audits');
  assert.match(surface, /paper:\s*\{[\s\S]*?#fffaf2[\s\S]*?#fff1de[\s\S]*?#e9d8c4/i, 'Visual Stage should define paper tokens for the warm surface system');
  assert.match(surface, /ink:\s*\{[\s\S]*?#253048[\s\S]*?#45506a[\s\S]*?#6b7488/i, 'Visual Stage should define ink tokens for titles and readable copy');
  assert.match(surface, /coral:\s*\{[\s\S]*?#b96a5c[\s\S]*?#f8e3dd/i, 'Visual Stage should define coral tokens for restrained creative accents');
  assert.match(surface, /sage:\s*\{[\s\S]*?#5b8277[\s\S]*?#e7f1ec/i, 'Visual Stage should define sage tokens for reference/confirmation');
  assert.doesNotMatch(surface, /\b(?:bg|text|border|hover:bg)-black\b|rgba\(0,\s*0,\s*0|#000(?:000)?\b/i, 'Visual Stage should avoid pure-black surfaces/text and black-on-black readability traps');
  assert.doesNotMatch(surface, /#(?:00d084|ffd02f|ff75c3|8b5cf6|8e7cc3|e3b65f)\b/i, 'Visual Stage should not reuse the previous loose high-saturation sticker palette');
});

test('visual direction board presents divergent art directions for review', () => {
  const surface = readPage('visual-directions/page.tsx');

  for (const marker of [
    'Visual Direction Board',
    'Lunar Precision',
    'Cinema Studio',
    'Atelier Gallery',
    'Creative Board',
    'Velvet Suite',
    'Warm Craft',
    '先选艺术方向',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `visual direction board missing ${marker}`);
  }

  assert.match(surface, /@\/components\/ui\/(badge|card)/, 'Visual direction board should use design-system primitives');
  assert.doesNotMatch(surface, /JSON\.stringify\([^)]*,\s*null,\s*2\)/, 'Visual direction board must not expose raw JSON diagnostics');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json/i, 'Visual direction board must not expose provider/storage diagnostics');
});

test('creation board demo is an isolated static aesthetic preview route', () => {
  const surface = readPage('visual-stage/creation-board-demo/page.tsx');

  for (const marker of [
    'data-preview-route="creation-board-demo"',
    '创作案板',
    '静态界面演示',
    '不调用 AI',
    'Warm Editorial Board',
    '当前主图',
    '参考图',
    '候选比较',
    '继续微调',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `creation board demo missing ${marker}`);
  }

  assert.match(surface, /@\/components\/ui\/(badge|button|card)/, 'Creation Board demo should compose shadcn-style primitives');
  assert.doesNotMatch(surface, /apiPost|apiFormPost|subscribeTaskEvents|pollTaskUntilTerminal|fetch\(/, 'Static Creation Board demo must not call runtime APIs or providers');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json|JSON\.stringify\([^)]*,\s*null,\s*2\)/i, 'Creation Board demo must not expose diagnostics or raw provider data');
});

test('canvas board demo is a canvas-first WYSIWYG creation board preview', () => {
  const surface = readPage('visual-stage/canvas-board-demo/page.tsx');

  for (const marker of [
    'data-preview-route="canvas-board-demo"',
    '创作案板',
    'WYSIWYG',
    '静态画布演示',
    '不调用 AI',
    'Warm Editorial Board',
    '文本对象',
    '标题文本对象',
    '参考语义对象',
    '品牌色板对象',
    '交付画板对象',
    'Lineage / Flow',
    'MiniMap',
    '冠军路径',
    '废弃分支',
    '右侧 Inspector',
    '设计层',
    '关系层',
    '智能层',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `canvas board demo missing ${marker}`);
  }

  assert.match(surface, /@\/components\/ui\/(badge|button|card)/, 'Canvas Board demo should compose shadcn-style primitives');
  assert.match(surface, /const\s+canvasObjects\s*=\s*\[/, 'Canvas Board demo should model visible canvas objects');
  assert.match(surface, /const\s+lineageEdges\s*=\s*\[/, 'Canvas Board demo should model visible flow relationships');
  assert.match(surface, /kind:\s*['"]text['"][\s\S]*selected:\s*true/, 'Canvas Board demo should include one selected visible text object');
  assert.doesNotMatch(surface, /apiPost|apiFormPost|subscribeTaskEvents|pollTaskUntilTerminal|fetch\(/, 'Static Canvas Board demo must not call runtime APIs or providers');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json|task id|provider route|JSON\.stringify\([^)]*,\s*null,\s*2\)/i, 'Canvas Board demo must not expose diagnostics or raw provider data');
});

test('mobile canvas demo uses compact mobile-native layout instead of shrinking desktop panels', () => {
  const surface = readPage('visual-stage/mobile-canvas-demo/page.tsx');

  for (const marker of [
    'data-preview-route="mobile-canvas-demo"',
    '移动端不是简化版',
    '无限画布',
    '寸土寸金',
    '信息块',
    '淡粉色参考图',
    '桃粉色生成图',
    '灰色系文字',
    '废弃 flow 透明度',
    '底部对象面板',
    '选择具体模块后展开详情',
    'Focus Lens',
    'Object Stack',
    'Relationship Peek',
    'Bottom Inspector',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `mobile canvas demo missing ${marker}`);
  }

  assert.match(surface, /const\s+mobileCanvasObjects\s*=\s*\[/, 'Mobile Canvas demo should model compact canvas objects');
  assert.match(surface, /const\s+mobileLayerLegend\s*=\s*\[/, 'Mobile Canvas demo should define a compact color-role legend');
  assert.match(surface, /kind:\s*['"]reference['"][\s\S]*tone:\s*['"]reference['"]/, 'Reference objects should use the light-pink reference tone');
  assert.match(surface, /kind:\s*['"]generated['"][\s\S]*tone:\s*['"]generated['"]/, 'Generated objects should use the peach-pink generated tone');
  assert.match(surface, /kind:\s*['"]text['"][\s\S]*tone:\s*['"]text['"]/, 'Text objects should use the grey text tone');
  assert.match(surface, /discarded:\s*true[\s\S]*opacity-35/, 'Discarded flow should be visually de-emphasized');
  assert.match(surface, /@\/components\/ui\/(badge|button|card)/, 'Mobile Canvas demo should compose shadcn-style primitives');
  assert.doesNotMatch(surface, /复杂编排桌面优先|做简单判断/, 'Mobile Canvas demo must not describe mobile as reduced-capability review mode');
  assert.doesNotMatch(surface, /apiPost|apiFormPost|subscribeTaskEvents|pollTaskUntilTerminal|fetch\(/, 'Static Mobile Canvas demo must not call runtime APIs or providers');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json|task id|provider route|JSON\.stringify\([^)]*,\s*null,\s*2\)/i, 'Mobile Canvas demo must not expose diagnostics or raw provider data');
});

test('visual stage embeds the real Creation Board object model and WYSIWYG shell', () => {
  const files = [
    'visual-stage/VisualStageClient.tsx',
    'visual-stage/creation-board/types.ts',
    'visual-stage/creation-board/creation-board-fixtures.ts',
    'visual-stage/creation-board/CreationBoard.tsx',
    'visual-stage/creation-board/CreationBoardCanvas.tsx',
    'visual-stage/creation-board/CreationObjectNode.tsx',
    'visual-stage/creation-board/ObjectInspector.tsx',
    'visual-stage/creation-board/MobileObjectStack.tsx',
    'visual-stage/creation-board/RelationshipPeek.tsx',
  ];
  const surface = files.map((relative) => `\n/* ${relative} */\n${readPage(relative)}`).join('\n');

  for (const marker of [
    'Creation Board',
    '创作案板',
    'WYSIWYG',
    '文本对象',
    '图片对象',
    '品牌对象',
    '交付画板',
    '创作助手上下文',
    '单击对象',
    '双击或长按',
    'Focus Lens',
    'Object Stack',
    'Relationship Peek',
    'Bottom Inspector',
    '技术诊断细节不外露',
  ]) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `Creation Board shell missing ${marker}`);
  }

  assert.match(surface, /export type CreationObjectKind/, 'Creation Board should define object kinds as a business model');
  assert.match(surface, /export type CreationRelationType/, 'Creation Board should define lineage relation types');
  assert.match(surface, /brief[\s\S]*reference\.image[\s\S]*generated\.image[\s\S]*text[\s\S]*brand\.palette[\s\S]*artboard[\s\S]*deliverable/, 'Creation Board kinds should cover brief/reference/generated/text/brand/artboard/deliverable objects');
  assert.match(surface, /const\s+creationBoardObjects\s*:/, 'Creation Board fixtures should seed visible creative objects');
  assert.match(surface, /const\s+creationBoardRelations\s*:/, 'Creation Board fixtures should seed visible lineage relations');
  assert.match(surface, /data-testid="creation-board-shell"/, 'Visual Stage should render the Creation Board shell');
  assert.match(surface, /data-testid="creation-board-canvas"/, 'Creation Board should expose a canvas audit hook');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json|raw task payload|provider route|JSON\.stringify\([^)]*,\s*null,\s*2\)/i, 'Creation Board surface must not expose provider/storage/task diagnostics');
});

test('visual stage creation board is a real pannable infinite canvas and renders generated images as visual objects', () => {
  const surface = [
    'visual-stage/creation-board/types.ts',
    'visual-stage/creation-board/CreationBoard.tsx',
    'visual-stage/creation-board/CreationBoardCanvas.tsx',
    'visual-stage/creation-board/CreationObjectNode.tsx',
    'visual-stage/VisualStageClient.tsx',
  ].map((relative) => `\n/* ${relative} */\n${readPage(relative)}`).join('\n');

  for (const marker of ['ReactFlow', 'Background', 'MiniMap', 'Controls', '@xyflow/react']) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `Creation Board should use real infinite-canvas affordance: ${marker}`);
  }

  assert.match(surface, /fitView/, 'Creation Board should fit canvas objects on entry');
  assert.match(surface, /nodes=\{/, 'Creation Board should render objects as canvas nodes');
  assert.match(surface, /edges=\{/, 'Creation Board should render lineage as canvas edges');
  assert.match(surface, /object\.asset[\s\S]*<img|<img[\s\S]*object\.asset/, 'image objects must render their actual asset thumbnail/url, not a text placeholder');
  assert.match(surface, /imageUrl\(item\.image\)|imageUrl\(champion\)/, 'session generated images should be converted to browser-visible URLs before entering the board or chat');
  assert.doesNotMatch(surface, /phase-1-static-wysiwyg|静态真实画布壳|当前不调用 AI/, 'reviewable Visual Stage must not present the deployed surface as a static shell');
});

test('public web pages do not expose debug diagnostics or engineering readiness copy', () => {
  const files = [
    'page.tsx',
    'gallery/page.tsx',
    'gallery/gallery-batch-actions.tsx',
    'edit/page.tsx',
    'canvas/page.tsx',
    'prompts/prompt-actions.tsx',
    'settings/page.tsx',
    'settings/settings-actions.tsx',
    'layout.tsx',
  ];
  const forbidden = /ImageActionToolbar ready|SSE(?:\s|\/| 实时| ready| unavailable)|fallback ready|Diagnostics|diagnostics|debug-json|原始任务响应|Provider readiness|Storage Key|Reference Storage Key|Mask ready|One-time secret|JSON\.stringify\([^)]*,\s*null,\s*2\)/i;

  for (const relative of files) {
    const text = readPage(relative);
    assert.doesNotMatch(text, forbidden, `${relative} should not expose debug or engineering status copy`);
    assert.doesNotMatch(text, /<details\b/, `${relative} should not render public diagnostics details`);
  }
});

test('create studio keeps advanced generation options collapsed and replaces reference key input with upload UX', () => {
  const generate = readCreateStudioSurface();

  assert.match(generate, /高级设置/, 'create form should group model, size, quality and format in an advanced settings accordion');
  assert.match(generate, /advancedOpen/, 'advanced settings should be controlled and default closed');
  assert.doesNotMatch(generate, /<Label htmlFor="reference-key">Reference Storage Key<\/Label>/, 'raw reference storage key input must not be user-facing');
  assert.doesNotMatch(generate, /id="reference-key"/, 'reference key field should not be exposed as a normal text input');
  assert.match(generate, /上传参考图|拖拽|Drop/, 'reference image should be selected through an upload/drop affordance');
  assert.match(generate, /apiFormPost<Uploaded>\('\/assets\/upload'/, 'create studio should upload reference files through the assets API');
});

test('create studio preserves product language and composes the create workflow from product modules', () => {
  const generate = readCreateStudioSurface();

  for (const marker of ['Create Studio', '创作工作台', '预览画布', '上传参考图', '高级设置', 'What shall we create together?', '你想创作什么']) {
    assert.match(generate, new RegExp(escapeRegExp(marker)), `create studio missing product language: ${marker}`);
  }
  for (const marker of ['<CreateHero', '<PromptComposer', '<ReferenceDropzone', '<AdvancedSettingsPanel', '<PromptVariants', '<PreviewStage', '<SupportGrid']) {
    assert.match(generate, new RegExp(escapeRegExp(marker)), `create studio should compose ${marker}`);
  }
  assert.match(generate, /@\/components\/product\//, 'create studio should use shared product visual components');
});

test('create studio visual-master files use product components instead of legacy handcrafted visual classes', () => {
  const productImport = /@\/components\/product\//;
  const legacyVisualClass = /\b(?:lovart-|studio-|composer-card|command-composer|composer-input-wrap|reference-dropzone|preview-stage|preview-frame|preview-empty|compare-stage|support-grid|metric-grid|metric|image-action-toolbar|version-strip|variant-card)\b/;
  const files = readCreateStudioFiles();

  assert.match(readCreateStudioSurface(), productImport, 'Create Studio surface should import/use @/components/product/ shared visual components');
  for (const { relative, text } of files) {
    assert.doesNotMatch(text, legacyVisualClass, `${relative} should not use legacy handcrafted Create Studio visual classes`);
  }
});

test('create studio visual-master CSS removes obsolete one-off selectors after Tailwind component migration', () => {
  const css = `${readPage('styles/product-surfaces.css')}\n${readPage('styles/responsive.css')}`;
  const obsoleteCreateSelectors = /\.(?:lovart-shell|lovart-hero|lovart-workbench|composer-card|command-composer|composer-input-wrap|reference-dropzone|support-grid|compare-stage|version-strip|variant-card)\b/;

  assert.doesNotMatch(css, obsoleteCreateSelectors, 'Create Studio-only CSS selectors should be deleted after moving visuals to @/components/product/studio');
  assert.match(css, /\.reference-file-input\b/, 'reference upload input clipping remains as the one scoped CSS exception');
});

test('create and edit surfaces keep raw JSON out of the public interface', () => {
  for (const relative of ['page.tsx', 'edit/page.tsx', 'canvas/page.tsx']) {
    const text = readPage(relative);
    assert.doesNotMatch(text, /<pre>\{JSON\.stringify/, `${relative} must not render raw JSON as the main interface`);
    assert.doesNotMatch(text, /JSON\.stringify\([^)]*,\s*null,\s*2\)/, `${relative} must not render raw JSON diagnostics`);
  }
});

test('shared visual language includes premium dark app shell and image-first components', () => {
  const css = readPage('globals.css');
  const layout = readPage('layout.tsx');

  for (const marker of ['--surface-canvas', '--accent', '.studio-hero', '.preview-stage', '.image-card', '.canvas-dock', '.diagnostics']) {
    assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `globals.css missing ${marker}`);
  }
  assert.match(layout, /import\s+['"]\.\/globals\.css['"]/, 'root layout must import globals.css so App Router pages ship the compiled stylesheet');
  assert.match(layout, /Studio|Gallery|Canvas|Ops/, 'navigation should use concise product sections');
});

test('responsive layout guards prevent hidden inputs and canvas panels from widening pages', () => {
  const referenceDropzone = readPage('ReferenceDropzone.tsx');
  const productSurfaces = readPage('styles/product-surfaces.css');
  const opsCanvas = readPage('styles/ops-canvas.css');
  const card = readWeb('components/ui/card.tsx');
  const textarea = readWeb('components/ui/textarea.tsx');

  assert.match(referenceDropzone, /reference-file-input\s+sr-only|sr-only\s+reference-file-input/, 'reference upload input needs a dedicated clipped class in addition to sr-only');
  for (const marker of ['.reference-file-input', 'position: absolute !important', 'overflow: hidden !important', 'clip-path: inset(50%) !important', 'white-space: nowrap !important']) {
    assert.match(productSurfaces, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `reference upload CSS missing ${marker}`);
  }
  assert.match(opsCanvas, /\.canvas-secondary-panels > \* \{ min-width: 0; \}/, 'canvas secondary grid children must be allowed to shrink');
  assert.match(opsCanvas, /grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'mobile canvas grid should use minmax(0, 1fr) instead of bare 1fr');
  assert.match(card, /flex min-w-0 flex-col/, 'Card root should not force flex/grid overflow');
  assert.match(card, /min-w-0 px-6/, 'Card content should shrink inside narrow grids');
  assert.match(textarea, /w-full min-w-0 rounded-md/, 'Textarea should shrink inside cards and panels');
});

test('mobile app shell uses a collapsed top-left menu instead of fixed bottom navigation', () => {
  const navFrame = readPage('ui/NavFrame.tsx');
  const responsive = readPage('styles/responsive.css');
  const layoutCss = readPage('styles/layout.css');

  assert.match(navFrame, /mobile-menu-toggle/, 'mobile navigation should expose a top-left collapsed menu button');
  assert.match(navFrame, /mobile-menu-panel/, 'mobile navigation should render an expandable menu panel');
  assert.doesNotMatch(navFrame, /mobile-bottom-nav/, 'mobile shell should not render a bottom navigation bar that blocks the operation area');
  assert.doesNotMatch(navFrame, /\['More',\s*'\/settings'\]/, 'mobile navigation must not collapse every extra route into a More link that jumps to settings');
  for (const href of ['/', '/gallery', '/canvas', '/prompts', '/tasks', '/agent', '/providers', '/ops', '/settings']) {
    assert.match(navFrame, new RegExp(`['"]${href.replace('/', '\\/')}['"]`), `mobile menu should include ${href}`);
  }
  assert.doesNotMatch(responsive, /\.mobile-bottom-nav/, 'responsive CSS should not position a fixed mobile bottom navigation');
  assert.doesNotMatch(layoutCss, /mobile-bottom-nav/, 'base layout CSS should not keep the old bottom nav surface');
});

test('canvas workflow toolbar lives outside the React Flow surface on mobile', () => {
  const canvasArea = readPage('canvas/CanvasArea.tsx');
  const opsCanvas = readPage('styles/ops-canvas.css');

  assert.match(canvasArea, /canvas-area-stack/, 'canvas area should stack toolbar and canvas as separate surfaces');
  assert.match(canvasArea, /<CanvasDock[^>]*\/>\s*<div className="canvas-surface"/, 'canvas toolbar should render before and outside the canvas surface');
  assert.doesNotMatch(canvasArea, /<div className="canvas-surface"[\s\S]*<CanvasDock/, 'canvas dock must not be nested inside the React Flow surface');
  assert.match(opsCanvas, /\.canvas-dock[\s\S]*position:\s*static/, 'canvas dock should be a normal toolbar, not an absolute overlay');
  assert.doesNotMatch(opsCanvas, /\.canvas-dock[\s\S]*position:\s*absolute/, 'canvas dock must not be absolutely positioned over controls or minimap');
});

test('ops dashboard matches the metrics API response contract', () => {
  const ops = readPage('ops/page.tsx');
  for (const marker of ['byStatus', 'byModel', 'images', 'sizeBytes']) {
    assert.match(ops, new RegExp(marker), `ops dashboard should read metrics.${marker}`);
  }
});

test('mask editor exports natural-size masks instead of fixed preview-size canvases', () => {
  const maskEditor = readPage('edit/mask-editor.tsx');
  const editPage = readPage('edit/page.tsx');
  assert.match(maskEditor, /naturalWidth/, 'mask editor should load the reference natural width');
  assert.match(maskEditor, /naturalHeight/, 'mask editor should load the reference natural height');
  assert.match(maskEditor, /padding:\s*0/, 'mask editor overlay must not inherit padded thumb layout that offsets the stage from the image');
  assert.match(editPage, /maskMode:\s*mask\s*\?\s*'painted-area'/, 'edit tasks should label browser-painted masks so the API can normalize provider polarity');
  assert.doesNotMatch(maskEditor, /width=\{360\}\s+height=\{260\}/, 'mask editor must not export the fixed preview canvas size as the provider mask');
});

test('tailwind and shadcn foundation is configured before UI refactor', () => {
  const pkg = readWeb('package.json');
  const postcss = readWeb('postcss.config.mjs');
  const components = readWeb('components.json');
  const globals = readPage('globals.css');
  const button = readWeb('components/ui/button.tsx');
  const input = readWeb('components/ui/input.tsx');

  for (const marker of ['tailwindcss', '@tailwindcss/postcss', 'class-variance-authority', 'tailwind-merge', 'lucide-react']) {
    assert.match(pkg, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `package.json missing ${marker}`);
  }
  assert.match(postcss, /@tailwindcss\/postcss/, 'Next should process Tailwind through PostCSS');
  assert.match(components, /"style":\s*"new-york"/, 'shadcn components.json should pin the standard style');
  assert.match(components, /"ui":\s*"@\/components\/ui"/, 'shadcn ui alias should be configured');
  assert.match(globals, /@import\s+"tailwindcss"/, 'globals.css should import Tailwind');
  assert.match(button, /buttonVariants/, 'button should use the canonical shadcn variant pattern');
  assert.match(input, /data-slot="input"/, 'input should use the shadcn data-slot component pattern');
});

test('first refactor batch uses shadcn primitives instead of legacy button form card classes', () => {
  const files = [
    'providers/page.tsx',
    'edit/page.tsx',
    'edit/mask-editor.tsx',
    'prompts/prompt-enhancer.tsx',
    'prompts/prompt-actions.tsx',
  ];

  for (const relative of files) {
    const text = readPage(relative);
    assert.match(text, /@\/components\/ui\/(button|input|textarea|card|label|badge|select)/, `${relative} should import shadcn ui primitives`);
    assert.doesNotMatch(text, /className="(?:btn|pill|card|task-card|studio-panel|notice|status)(?:\s|"|$)/, `${relative} should not use legacy visual component classes`);
    assert.doesNotMatch(text, /<button(?![^>]*asChild)/, `${relative} should use Button instead of naked button tags`);
  }
});

test('generate and gallery refactor batch uses shadcn primitives for actions forms and cards', () => {
  const surfaces = [
    ['page.tsx', readCreateStudioSurface()],
    ['gallery/page.tsx', readPage('gallery/page.tsx')],
    ['gallery/gallery-batch-actions.tsx', readPage('gallery/gallery-batch-actions.tsx')],
  ];

  for (const [relative, text] of surfaces) {
    assert.match(text, /@\/components\/ui\/(button|input|textarea|card|label|badge|select|native-select)/, `${relative} should import shadcn ui primitives`);
    assert.doesNotMatch(text, /className="(?:btn|pill|card|task-card|studio-panel|notice|status)(?:\s|"|$)/, `${relative} should not use legacy visual component classes`);
    assert.doesNotMatch(text, /<(button|input|textarea|select|label)\b(?![^>]*data-slot)/, `${relative} should use design-system form/action primitives instead of naked controls`);
  }
});

test('canvas and app shell refactor batch uses shadcn primitives for workflow controls', () => {
  const files = ['canvas/page.tsx', 'layout.tsx'];

  for (const relative of files) {
    const text = readPage(relative);
    assert.match(text, /@\/components\/ui\/(button|input|textarea|card|label|badge|native-select)/, `${relative} should import shadcn ui primitives`);
    assert.doesNotMatch(text, /className="(?:btn|pill|card|task-card|studio-panel|notice|status)(?:\s|"|$)/, `${relative} should not use legacy visual component classes`);
    assert.doesNotMatch(text, /<(button|input|textarea|select|label)\b(?![^>]*data-slot)/, `${relative} should use design-system form/action primitives instead of naked controls`);
  }
});

test('final app surfaces use shadcn primitives instead of legacy controls and cards', () => {
  const files = [
    'agent/page.tsx',
    'prompts/page.tsx',
    'tasks/page.tsx',
    'tasks/[id]/page.tsx',
    'ops/page.tsx',
    'settings/page.tsx',
    'settings/settings-actions.tsx',
  ];

  for (const relative of files) {
    const text = readPage(relative);
    assert.match(text, /@\/components\/ui\/(button|input|textarea|card|label|badge|native-select)/, `${relative} should import shadcn ui primitives`);
    assert.doesNotMatch(text, /className="(?:btn|pill|card|task-card|studio-panel|notice|status)(?:\s|"|$)/, `${relative} should not use legacy visual component classes`);
    assert.doesNotMatch(text, /<(button|input|textarea|select|label)\b(?![^>]*data-slot)/, `${relative} should use design-system form/action primitives instead of naked controls`);
  }
});
