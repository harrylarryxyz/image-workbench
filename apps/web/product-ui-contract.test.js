import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const appDir = join(process.cwd(), 'app');
const readPage = (relative) => readFileSync(join(appDir, relative), 'utf8');
const readWeb = (relative) => readFileSync(join(process.cwd(), relative), 'utf8');

test('primary product surfaces use studio/library/canvas language instead of debug-first pages', () => {
  const generate = readPage('page.tsx');
  const gallery = readPage('gallery/page.tsx');
  const canvas = readPage('canvas/page.tsx');

  assert.match(generate, /Create Studio|创作工作台|预览画布|上传参考图/, 'generate home should present a productized create studio');
  assert.match(gallery, /Asset Library|素材库|Lightbox|masonry|image-card/, 'gallery should present an asset library, not a basic list');
  assert.match(canvas, /Canvas Dock|bottom dock|画布工具栏|canvas-dock/, 'canvas should expose a canvas-style dock workflow');
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
  const generate = readPage('page.tsx');

  assert.match(generate, /高级设置/, 'create form should group model, size, quality and format in an advanced settings accordion');
  assert.match(generate, /advancedOpen/, 'advanced settings should be controlled and default closed');
  assert.doesNotMatch(generate, /<Label htmlFor="reference-key">Reference Storage Key<\/Label>/, 'raw reference storage key input must not be user-facing');
  assert.doesNotMatch(generate, /id="reference-key"/, 'reference key field should not be exposed as a normal text input');
  assert.match(generate, /上传参考图|拖拽|Drop/, 'reference image should be selected through an upload/drop affordance');
  assert.match(generate, /apiFormPost<Uploaded>\('\/assets\/upload'/, 'create studio should upload reference files through the assets API');
});

test('create studio follows lovart-style hierarchy with prompt composer first, image stage second, and supporting modules below', () => {
  const generate = readPage('page.tsx');

  for (const marker of ['lovart-shell', 'composer-card', 'reference-dropzone', 'preview-stage', 'support-grid']) {
    assert.match(generate, new RegExp(marker), `generate page missing ${marker}`);
  }
  assert.match(generate, /What shall we create together\?|你想创作什么/, 'composer should ask for the user creative intent first');
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

  for (const marker of ['--surface-canvas', '--accent', '.studio-shell', '.preview-stage', '.image-card', '.canvas-dock', '.diagnostics']) {
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
  const files = [
    'page.tsx',
    'gallery/page.tsx',
    'gallery/gallery-batch-actions.tsx',
  ];

  for (const relative of files) {
    const text = readPage(relative);
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
