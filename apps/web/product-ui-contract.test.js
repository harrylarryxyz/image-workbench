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

  assert.match(generate, /Create Studio|创作工作台|PreviewStage|ImageActionToolbar/, 'generate home should present a productized create studio');
  assert.match(gallery, /Asset Library|素材库|Lightbox|masonry|image-card/, 'gallery should present an asset library, not a basic list');
  assert.match(canvas, /Canvas Dock|bottom dock|画布工具栏|canvas-dock/, 'canvas should expose a canvas-style dock workflow');
});

test('create and edit surfaces hide raw JSON behind diagnostics details', () => {
  for (const relative of ['page.tsx', 'edit/page.tsx', 'canvas/page.tsx']) {
    const text = readPage(relative);
    assert.doesNotMatch(text, /<pre>\{JSON\.stringify/, `${relative} must not render raw JSON as the main interface`);
    assert.match(text, /diagnostics|诊断|debug-details/i, `${relative} should keep technical output in a diagnostics details panel`);
  }
});

test('shared visual language includes premium dark app shell and image-first components', () => {
  const css = readPage('globals.css');
  const layout = readPage('layout.tsx');

  for (const marker of ['--surface-canvas', '--accent', '.studio-shell', '.preview-stage', '.image-card', '.canvas-dock', '.diagnostics']) {
    assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `globals.css missing ${marker}`);
  }
  assert.match(layout, /Studio|Gallery|Canvas|Ops/, 'navigation should use concise product sections');
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
