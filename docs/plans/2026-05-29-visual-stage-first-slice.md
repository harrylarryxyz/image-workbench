# Visual Stage First Slice Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Enforce test-driven-development: write each focused failing test first, run it to observe RED, implement the minimum code, then rerun focused and broad verification.

**Goal:** Build a route-isolated first Visual Stage slice that proves Creation Case draft, first-response routing, PC/mobile choreography, judgment-first feedback, comparison, and commit/export without replacing the deployed Create Studio entry.

**Architecture:** Add a new `/visual-stage` route under the web app as a controlled product prototype. Keep the first slice local/UI-only: no database schema, no provider changes, no production route replacement. Model a minimal Creation Case in frontend code, route it through Reference-first / Generate-first / Ask-first states, and reuse existing Tailwind/Shadcn/product primitives while adding focused contract and Playwright coverage.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind v4, Shadcn-style primitives, Node `node:test` static product contract tests, Playwright E2E.

**Source Docs:**

- `docs/product/visual-stage-product-philosophy-prd.md`
- `docs/adr/0002-unified-visual-stage-creation-case-routing.md`
- `docs/product/visual-stage-interaction-visual-spec.md`
- `docs/ui/create-studio-visual-master.md`

---

## 1. Boundary decision

Use a **route-isolated prototype** first:

- Route: `/visual-stage`
- Do not replace `/` yet.
- Do not add provider calls in the first slice.
- Do not add persistence yet.
- Do not expose private provider/model route details.
- Do not deploy or restart production unless explicitly authorized.

Why:

- ADR 0002 may invalidate current Create Studio structure.
- The first slice must prove product behavior before main-entry replacement.
- Existing deployed Create Studio remains safe while review happens.

## 2. Current baseline

Relevant existing files:

- `apps/web/app/page.tsx` — current Create Studio client page.
- `apps/web/app/PromptComposer.tsx` — current prompt-first composer.
- `apps/web/app/PreviewStage.tsx` — current preview/result stage.
- `apps/web/app/create-types.ts` — task/result types.
- `apps/web/components/product/studio.tsx` — reusable premium dark product primitives.
- `apps/web/product-ui-contract.test.js` — static product/UI regression contract.
- `apps/web/e2e/smoke.spec.ts` — existing Playwright smoke tests.
- `apps/web/package.json` — `test`, `typecheck`, `build`, `test:e2e` commands.

Existing Create Studio can be borrowed visually but must not dictate the new product model.

## 3. Files to create/modify

Create:

- `apps/web/app/visual-stage/page.tsx`
- `apps/web/app/visual-stage/VisualStageClient.tsx`
- `apps/web/app/visual-stage/creation-case.ts`
- `apps/web/app/visual-stage/visual-stage-fixtures.ts`
- `apps/web/e2e/visual-stage.spec.ts`

Modify:

- `apps/web/product-ui-contract.test.js`
- optionally `apps/web/app/ui/NavFrame.tsx` only after review decides `/visual-stage` should be discoverable in navigation.

Do not modify in the first slice:

- `apps/api/**`
- Prisma schema
- provider adapters
- worker/task processors
- deployment scripts
- production env files

## 4. Minimal Creation Case model

Implement only the minimum state needed to prove the first loop.

Required TypeScript shape in `apps/web/app/visual-stage/creation-case.ts`:

```ts
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
```

Required helper:

```ts
export function deriveCreationCase(intent: string): CreationCase;
```

The helper can use deterministic local rules for this slice. It is a UI/product prototype, not final intelligence.

## 5. Routing heuristics for the first slice

The local deterministic router must cover these prompts:

### Sparse taste prompt

Input:

```text
做一张高级一点的头像
```

Expected route:

- `reference-first`
- subject/source missing and hard blocker if user identity is implied but no source exists;
- use context assumed as social avatar;
- audience assumed as general public;
- visual direction missing or underdetermined;
- 3–5 reference territories;
- one unblocker attached to subject/source.

### Clear generation prompt

Input:

```text
为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。
```

Expected route:

- `generate-first`
- at least 3 known anchors;
- no hard blocker;
- visible assumptions only for soft inferred defaults;
- one mocked first draft/champion.

### Hard blocker prompt

Input:

```text
用我照片做一张像某明星风格的头像
```

Expected route:

- `ask-first`
- real-person/source and likeness/IP risk marked;
- unsafe generation blocked;
- one unblocker card with safe alternatives.

## 6. Task 1 — Add RED product contract for Visual Stage slice

**Objective:** Create static guardrails before adding route code.

**Files:**

- Modify: `apps/web/product-ui-contract.test.js`

**Step 1: Write failing test**

Add tests that read the future route/component files and assert the accepted product language exists.

Required markers:

- `Visual Stage`
- `Creation Case`
- `Reference-first`
- `Generate-first`
- `Ask-first`
- `Champion`
- `Comparison Set`
- `Unblocker Card`
- `专业不降级，兴趣不劝退`

Also assert that first-surface code does not contain:

- `JSON.stringify(..., null, 2)`
- `Storage Key`
- `Provider readiness`
- `debug-json`
- raw `<button>` / `<textarea>` in the new route components when primitives should be used.

Suggested test shape:

```js
test('visual stage route encodes creation-case router product contract', () => {
  const files = [
    'visual-stage/page.tsx',
    'visual-stage/VisualStageClient.tsx',
    'visual-stage/creation-case.ts',
    'visual-stage/visual-stage-fixtures.ts',
  ];
  const surface = files.map((relative) => readPage(relative)).join('\n');

  for (const marker of ['Visual Stage', 'Creation Case', 'Reference-first', 'Generate-first', 'Ask-first', 'Champion', 'Comparison Set', 'Unblocker Card', '专业不降级，兴趣不劝退']) {
    assert.match(surface, new RegExp(escapeRegExp(marker)), `visual stage missing ${marker}`);
  }
  assert.doesNotMatch(surface, /JSON\.stringify\([^)]*,\s*null,\s*2\)/, 'Visual Stage must not expose raw JSON diagnostics');
  assert.doesNotMatch(surface, /Storage Key|Provider readiness|debug-json/i, 'Visual Stage first surface must not expose provider/storage diagnostics');
});
```

**Step 2: Verify RED**

Run:

```bash
pnpm --filter @image-workbench/web test -- product-ui-contract.test.js
```

Expected:

- FAIL because `app/visual-stage/*` files do not exist yet.

**Step 3: Stop**

Do not implement in this task. Commit only after the next task makes the focused test green.

## 7. Task 2 — Create route skeleton and static product language

**Objective:** Make the static product contract green with a minimal route-isolated Visual Stage skeleton.

**Files:**

- Create: `apps/web/app/visual-stage/page.tsx`
- Create: `apps/web/app/visual-stage/VisualStageClient.tsx`
- Create: `apps/web/app/visual-stage/creation-case.ts`
- Create: `apps/web/app/visual-stage/visual-stage-fixtures.ts`

**Step 1: Implement minimum skeleton**

`page.tsx`:

```tsx
import { VisualStageClient } from './VisualStageClient';

export default function VisualStagePage() {
  return <VisualStageClient />;
}
```

`VisualStageClient.tsx` must be a client component and must include the canonical product words in visible or structural text.

Use existing primitives:

- `Button`
- `Textarea`
- `Badge`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- product/studio primitives where they help.

Initial skeleton requirements:

- hero/stage copy includes `Visual Stage` and `专业不降级，兴趣不劝退`;
- one plain-language composer;
- a compact Creation Case placeholder;
- placeholder route labels for `Reference-first`, `Generate-first`, `Ask-first`;
- champion/comparison placeholder language;
- no real API calls.

**Step 2: Verify GREEN**

Run:

```bash
pnpm --filter @image-workbench/web test -- product-ui-contract.test.js
pnpm --filter @image-workbench/web typecheck
```

Expected:

- product contract test passes;
- typecheck passes.

**Step 3: Commit**

```bash
git add apps/web/product-ui-contract.test.js apps/web/app/visual-stage
git commit -m "feat(web): add visual stage route skeleton"
```


## 8. Task 3 — Add RED E2E for sparse prompt → Reference-first + unblocker

**Objective:** Prove vague taste prompts produce a Creation Case draft, Reference Territories, and one unblocker instead of silent person invention.

**Files:**

- Create/modify: `apps/web/e2e/visual-stage.spec.ts`

**Step 1: Write failing Playwright test**

```ts
import { test, expect } from '@playwright/test';

test('Visual Stage routes sparse avatar taste prompt to Reference-first with one unblocker', async ({ page }) => {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('做一张高级一点的头像');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();

  await expect(page.getByText(/Creation Case|创作案/)).toBeVisible();
  await expect(page.getByText(/Reference-first/i)).toBeVisible();
  await expect(page.getByText(/主体|素材|subject/i)).toContainText(/缺失|Missing/i);
  await expect(page.getByText(/社交头像|social avatar/i)).toBeVisible();
  await expect(page.getByText(/Unblocker Card|补齐主体|上传照片|抽象头像/i)).toBeVisible();
  await expect(page.getByTestId('reference-territories')).toContainText(/高级|克制|商业|真实|设计/);
});
```

**Step 2: Verify RED**

Run:

```bash
pnpm --filter @image-workbench/web test:e2e -- e2e/visual-stage.spec.ts --project=chromium
```

Expected:

- FAIL because the skeleton does not yet derive/render route state.

## 9. Task 4 — Implement minimal Creation Case derivation and Reference-first UI

**Objective:** Make the sparse prompt E2E pass with deterministic local routing.

**Files:**

- Modify: `apps/web/app/visual-stage/creation-case.ts`
- Modify: `apps/web/app/visual-stage/visual-stage-fixtures.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`

**Step 1: Implement route derivation**

Minimum rules:

- If intent contains `头像` and lacks source/photo/upload indicator, route to `reference-first` with subject missing.
- Assume use context `社交头像 / social avatar`.
- Provide 3–5 reference territories from fixtures.
- Attach one blocker action set: `上传照片`, `使用抽象头像`, `使用虚构角色`, `选择品牌符号`.

**Step 2: Render required UI**

Required visible pieces:

- Creation Case card;
- anchor chips with state;
- route reason;
- reference territory board with `data-testid="reference-territories"`;
- unblocker card;
- one primary next action.

**Step 3: Verify GREEN**

Run:

```bash
pnpm --filter @image-workbench/web test:e2e -- e2e/visual-stage.spec.ts --project=chromium
pnpm --filter @image-workbench/web test -- product-ui-contract.test.js
pnpm --filter @image-workbench/web typecheck
```

Expected:

- sparse prompt E2E passes;
- contract test passes;
- typecheck passes.

**Step 4: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): route sparse visual intent to reference-first"
```


## 10. Task 5 — Add RED/GREEN for clear prompt → Generate-first

**Objective:** Prove sufficiently clear prompts route to Generate-first with a mocked local draft/champion and visible assumptions.

**Files:**

- Modify: `apps/web/e2e/visual-stage.spec.ts`
- Modify: `apps/web/app/visual-stage/creation-case.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`

**Step 1: Write failing E2E test**

```ts
test('Visual Stage routes clear poster prompt to Generate-first with a champion draft', async ({ page }) => {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();

  await expect(page.getByText(/Generate-first/i)).toBeVisible();
  await expect(page.getByText(/年轻咖啡爱好者/)).toBeVisible();
  await expect(page.getByText(/黑金|极简|瓶身|冰块/)).toBeVisible();
  await expect(page.getByText(/Champion|当前最佳|首稿/)).toBeVisible();
  await expect(page.getByText(/Assumed|假设/)).toBeVisible();
});
```

**Step 2: Verify RED**

Run the focused E2E command and confirm failure.

**Step 3: Implement minimal route and UI**

Rules:

- Detect clear prompt if it contains use context words such as `海报`, audience words such as `面向`, subject words, and visual direction words.
- Route `generate-first`.
- Render a non-provider local mock draft card, not a generated image from API.
- Show assumption chips, e.g. `Assumed format: square` if `1:1` present.

**Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @image-workbench/web test:e2e -- e2e/visual-stage.spec.ts --project=chromium
pnpm --filter @image-workbench/web test -- product-ui-contract.test.js
pnpm --filter @image-workbench/web typecheck
```

**Step 5: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): route clear prompts to generate-first visual drafts"
```

## 11. Task 6 — Add RED/GREEN for hard blocker → Ask-first

**Objective:** Prove unsafe real-person/celebrity-likeness requests block generation while keeping the stage alive.

**Files:**

- Modify: `apps/web/e2e/visual-stage.spec.ts`
- Modify: `apps/web/app/visual-stage/creation-case.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`

**Step 1: Write failing E2E test**

```ts
test('Visual Stage routes real-person celebrity likeness prompt to Ask-first blocker', async ({ page }) => {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('用我照片做一张像某明星风格的头像');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();

  await expect(page.getByText(/Ask-first/i)).toBeVisible();
  await expect(page.getByText(/真人|肖像|likeness|IP|明星/)).toBeVisible();
  await expect(page.getByText(/Unblocker Card|安全替代|抽象头像|非侵权/)).toBeVisible();
  await expect(page.getByText(/Visual Stage/)).toBeVisible();
  await expect(page.getByRole('button', { name: /开始生成|Generate/i })).toBeDisabled();
});
```

**Step 2: Verify RED**

Run focused E2E and confirm failure.

**Step 3: Implement Ask-first route**

Rules:

- Detect `我照片`, `某明星`, `像某明星`, `明星风格`, real-person likeness language.
- Route `ask-first`.
- Render the stage and safe direction options.
- Disable unsafe generate action.
- Render one Unblocker Card with safe alternatives.

**Step 4: Verify GREEN**

Run focused E2E, product contract, and typecheck.

**Step 5: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): block unsafe likeness prompts in visual stage"
```

## 12. Task 7 — Add RED/GREEN for judgment-first feedback and comparison

**Objective:** Prove feedback starts from judgment and updates champion/comparison state without prompt rewriting.

**Files:**

- Modify: `apps/web/e2e/visual-stage.spec.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`
- Modify: `apps/web/app/visual-stage/creation-case.ts`

**Step 1: Write failing E2E test**

```ts
test('Visual Stage feedback updates champion and comparison set', async ({ page }) => {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();

  await expect(page.getByText(/Champion|当前最佳/)).toBeVisible();
  await expect(page.getByText(/Comparison Set|对比/)).toBeVisible();
  await page.getByRole('button', { name: /更克制/ }).click();
  await expect(page.getByText(/更克制版/)).toBeVisible();
  await expect(page.getByText(/反馈已记录|Case updated|创作案已更新/)).toBeVisible();
});
```

**Step 2: Verify RED**

Run focused E2E and confirm failure.

**Step 3: Implement local feedback state**

Minimum implementation:

- Keep champion in component state.
- Keep 2–4 comparison candidates.
- Buttons: `选这个`, `不要这个`, `更像这个`, `更克制`, `更大胆`.
- On `更克制`, add/update candidate label `更克制版` and show case update message.
- Do not expose prompt text as the feedback input.

**Step 4: Verify GREEN**

Run focused E2E, product contract, and typecheck.

**Step 5: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): add judgment-first visual stage feedback"
```

## 13. Task 8 — Add RED/GREEN for mobile comparison availability

**Objective:** Prove mobile preserves champion + comparison set instead of hiding alternatives in deep history.

**Files:**

- Modify: `apps/web/e2e/visual-stage.spec.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`

**Step 1: Write failing E2E test**

```ts
test('Visual Stage keeps comparison available on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();

  await expect(page.getByTestId('visual-stage-champion')).toBeVisible();
  await expect(page.getByTestId('visual-stage-comparison')).toBeVisible();
  await expect(page.getByTestId('visual-stage-comparison')).toContainText(/更克制|商业|真实|方向|备选/);
});
```

**Step 2: Verify RED**

Run:

```bash
pnpm --filter @image-workbench/web test:e2e -- e2e/visual-stage.spec.ts --project=chromium
```

**Step 3: Implement mobile-safe layout**

Requirements:

- Use responsive Tailwind utilities, not a separate mobile-only product.
- Add stable `data-testid="visual-stage-champion"` and `data-testid="visual-stage-comparison"`.
- Ensure comparison is visible below/near champion at 390px width.
- Avoid horizontal page overflow.

**Step 4: Verify GREEN**

Run E2E and typecheck.

**Step 5: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): preserve visual stage comparison on mobile"
```

## 14. Task 9 — Add RED/GREEN for commit/export package

**Objective:** Prove completion happens when the user commits a champion for a use context.

**Files:**

- Modify: `apps/web/e2e/visual-stage.spec.ts`
- Modify: `apps/web/app/visual-stage/VisualStageClient.tsx`
- Modify: `apps/web/app/visual-stage/creation-case.ts`

**Step 1: Write failing E2E test**

```ts
test('Visual Stage commits champion into a delivery package', async ({ page }) => {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill('为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();
  await page.getByRole('button', { name: /用这个|Commit champion/i }).click();

  await expect(page.getByText(/Delivery Package|交付包/)).toBeVisible();
  await expect(page.getByText(/社媒|海报|use context|用途/)).toBeVisible();
  await expect(page.getByText(/Assumptions|假设/)).toBeVisible();
  await expect(page.getByRole('button', { name: /导出/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /继续做变体/ })).toBeVisible();
});
```

**Step 2: Verify RED**

Run focused E2E and confirm failure.

**Step 3: Implement commit state**

Minimum implementation:

- `用这个` sets `committed=true`.
- Render Delivery Package panel.
- Include selected champion, use context, assumptions, rights/source note placeholder, and actions.
- Do not build a real asset manager or download backend.

**Step 4: Verify GREEN**

Run focused E2E, product contract, typecheck.

**Step 5: Commit**

```bash
git add apps/web/app/visual-stage apps/web/e2e/visual-stage.spec.ts
git commit -m "feat(web): add visual stage champion commit package"
```

## 15. Task 10 — Final verification and docs handoff

**Objective:** Ensure the first slice is safe to review and not accidentally promoted to production entry.

**Files:**

- Modify: `docs/product/visual-stage-interaction-visual-spec.md` only if implementation discoveries require clarification.
- Modify: `docs/roadmap.md` only if the slice is accepted as a completed product milestone.

**Step 1: Run focused and broad verification**

Run:

```bash
pnpm --filter @image-workbench/web test -- product-ui-contract.test.js
pnpm --filter @image-workbench/web typecheck
pnpm --filter @image-workbench/web test:e2e -- e2e/visual-stage.spec.ts --project=chromium
pnpm --filter @image-workbench/web build
git diff --check
git status --short
```

Expected:

- all focused tests pass;
- typecheck passes;
- build passes;
- no whitespace errors;
- only intended files changed.

**Step 2: Review against spec**

Check:

- `/` still works and is not replaced.
- `/visual-stage` shows Visual Stage empty state.
- sparse prompt routes Reference-first.
- clear prompt routes Generate-first.
- hard blocker routes Ask-first.
- judgment-first feedback updates case/comparison.
- mobile comparison remains visible.
- commit/export package exists.
- no provider/storage/debug details appear on first surface.

**Step 3: Final commit if any verification/doc fixes were needed**

```bash
git add apps/web docs
git commit -m "docs: update visual stage implementation handoff"
```


## 16. Acceptance gate before replacing Create Studio

Do not replace `/` until all are true:

- The `/visual-stage` route passes the above tests.
- Visual review confirms the stage feels mature, not MVP/beta.
- Mobile review confirms creation entry, aesthetic proof, case legibility, feedback, and comparison remain usable.
- The user accepts route behavior for all three first-response states.
- A follow-up ADR/spec amendment explicitly authorizes replacing or reshaping the current Create Studio entry.

## 17. Known future work after first slice

Out of scope for this first implementation plan:

- persisted Creation Case schema;
- real reference search/source integration;
- real provider generation from route states;
- Gallery/Canvas/Flow migration into Creation Case;
- advanced lineage tree;
- export package file generation;
- production deploy;
- replacing current Create Studio.
