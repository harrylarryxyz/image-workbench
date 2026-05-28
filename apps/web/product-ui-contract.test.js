import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const appDir = join(process.cwd(), 'app');
const readPage = (relative) => readFileSync(join(appDir, relative), 'utf8');

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
