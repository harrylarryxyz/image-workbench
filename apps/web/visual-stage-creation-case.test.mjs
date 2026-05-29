import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveCreationCase } from './app/visual-stage/creation-case.ts';

test('deriveCreationCase routes sparse avatar prompts to Reference-first with an unblocker', () => {
  const creationCase = deriveCreationCase('做一张高级一点的头像');

  assert.equal(creationCase.route, 'reference-first');
  assert.match(creationCase.intentSummary, /头像|高级|social avatar|社交头像/);
  assert.equal(creationCase.anchors.find((anchor) => anchor.key === 'subject')?.state, 'missing');
  assert.equal(creationCase.anchors.find((anchor) => anchor.key === 'subject')?.hardBlocker, true);
  assert.match(creationCase.anchors.find((anchor) => anchor.key === 'useContext')?.value ?? '', /社交头像|social avatar/i);
  assert.ok(creationCase.referenceTerritories.length >= 3 && creationCase.referenceTerritories.length <= 5);
  assert.match(creationCase.blocker?.title ?? '', /Unblocker Card|补齐主体|上传照片|抽象头像/);
});

test('deriveCreationCase routes clear poster prompts to Generate-first with a mocked champion', () => {
  const creationCase = deriveCreationCase('为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。');

  assert.equal(creationCase.route, 'generate-first');
  assert.ok(creationCase.anchors.filter((anchor) => anchor.state === 'known').length >= 3);
  assert.equal(creationCase.anchors.some((anchor) => anchor.hardBlocker), false);
  assert.match(creationCase.intentSummary, /年轻咖啡爱好者|黑金|瓶身|冰块/);
  assert.match(creationCase.champion?.label ?? '', /Champion|当前最佳|首稿/);
  assert.match(creationCase.assumptions.join(' '), /1:1|square|方图|社媒/);
});

test('deriveCreationCase routes real-person likeness risk to Ask-first without killing the stage', () => {
  const creationCase = deriveCreationCase('用我照片做一张像某明星风格的头像');

  assert.equal(creationCase.route, 'ask-first');
  assert.equal(creationCase.anchors.find((anchor) => anchor.key === 'subject')?.hardBlocker, true);
  assert.match(creationCase.routeReason, /真人|肖像|likeness|IP|明星/);
  assert.match(creationCase.blocker?.title ?? '', /Unblocker Card|安全替代|抽象头像|非侵权/);
  assert.equal(creationCase.nextAction, 'Resolve blocker before generation');
});
