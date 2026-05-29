# Create Studio Visual Master P0 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Establish Create Studio as the reusable visual master for Image Workbench before more feature complexity is added.

**Architecture:** Keep the app's existing Next.js App Router and Shadcn/Tailwind foundation. Migrate the Create Studio surface away from page-specific semantic CSS classes into Tailwind tokens, Shadcn primitives, and reusable product components. Add scoped contract tests so future migrated surfaces cannot reintroduce bespoke CSS families.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, Shadcn-style primitives, Node test runner, Playwright smoke tests.

**Decision source:** `docs/adr/0001-create-studio-as-visual-master.md`

---

## Baseline

Current verified state:

- `apps/web/app/page.tsx` is the Create Studio route.
- Create Studio is split into `CreateHero`, `PromptComposer`, `ReferenceDropzone`, `AdvancedSettingsPanel`, `PromptVariants`, `PreviewStage`, and `SupportGrid`.
- Shadcn primitives already exist under `apps/web/components/ui/`.
- Product state components exist under `apps/web/components/product/state.tsx`.
- Global CSS is imported from `apps/web/app/globals.css`, which currently imports `app/styles/*.css`.
- Create Studio still relies on handcrafted class names such as `lovart-shell`, `studio-shell`, `lovart-workbench`, `composer-card`, `command-composer`, `reference-dropzone`, `preview-stage`, `support-grid`, `metric-grid`, `image-action-toolbar`, and `version-strip`.
- The existing `apps/web/product-ui-contract.test.js` already checks some product UI rules, but some assertions still preserve the legacy class names as expected markers.

## P0 Scope

Implement only the visual-master loop:

1. Create Studio real page becomes the visual master.
2. Product components needed by the master are extracted under `components/product/`.
3. Tailwind/Shadcn remain the source of truth.
4. Create-specific semantic CSS debt is removed from the migrated surface.
5. Contract tests enforce no new bespoke semantic CSS on the migrated Create Studio surface.
6. Gallery and Canvas receive only light validation, not a redesign.

## Non-goals

Do not implement in this slice:

- New image generation/editing capabilities.
- Canvas interaction redesign.
- Full Gallery redesign.
- Agent workflow changes.
- Full deletion of legacy global CSS.
- A replacement handcrafted naming system such as `new-studio-*`.
- Production deploy or service restart.

---

## Acceptance Gates

The P0 slice is complete only when all gates pass:

- Create Studio renders with no `lovart-*`, `studio-*`, `composer-card`, `reference-dropzone`, `preview-stage`, `support-grid`, `metric-grid`, `image-action-toolbar`, or similar bespoke global CSS classes in migrated Create files.
- New Create Studio styling comes from Tailwind utilities, existing tokens, Shadcn primitives, or reusable `components/product/*` components.
- `apps/web/product-ui-contract.test.js` fails on reintroduction of bespoke semantic CSS in Create Studio files.
- `docs/ui/create-studio-visual-master.md` documents the visual rules and future migration checklist.
- Gallery and Canvas are not redesigned, but their future migration path is documented and contract-test scoping does not block their current legacy state.
- Verification passes:
  - `pnpm --filter @image-workbench/web test`
  - `pnpm --filter @image-workbench/web typecheck`
  - `pnpm --filter @image-workbench/web build`
  - `git diff --check`

Optional if a browser environment is available:

- `pnpm --filter @image-workbench/web test:e2e`

---

## Task 1: Add the failing Create Studio visual-master contract

**Objective:** Make the desired migration enforceable before changing the UI.

**Files:**

- Modify: `apps/web/product-ui-contract.test.js`

**Step 1: Aggregate Create Studio files in the contract test**

Add a helper that reads the route plus extracted Create Studio components:

```js
const readCreateStudioSurface = () => [
  'page.tsx',
  'CreateHero.tsx',
  'PromptComposer.tsx',
  'ReferenceDropzone.tsx',
  'AdvancedSettingsPanel.tsx',
  'PromptVariants.tsx',
  'PreviewStage.tsx',
  'SupportGrid.tsx',
].map((relative) => readPage(relative)).join('\n');
```

**Step 2: Add a failing test for legacy Create Studio class families**

Add a scoped test similar to:

```js
test('create studio visual master uses product components instead of bespoke semantic CSS families', () => {
  const createStudio = readCreateStudioSurface();

  assert.match(
    createStudio,
    /@\/components\/product\//,
    'Create Studio should compose reusable product components, not page-local CSS families',
  );

  const forbiddenCreateClasses = /className="[^"]*(?:lovart-|studio-|composer-card|command-composer|composer-input-wrap|reference-dropzone|preview-stage|preview-frame|preview-empty|compare-stage|support-grid|metric-grid|metric\b|image-action-toolbar|version-strip|variant-card)[^"]*"/;

  assert.doesNotMatch(
    createStudio,
    forbiddenCreateClasses,
    'Create Studio migrated files must not use legacy handcrafted visual class families',
  );
});
```

**Step 3: Update old marker tests**

Change the old `lovart-style hierarchy` test so it checks product language and component composition instead of requiring legacy markers such as `lovart-shell`, `composer-card`, and `preview-stage`.

Example replacement markers:

```js
for (const marker of ['Create Studio', '预览画布', '上传参考图', '高级设置']) {
  assert.match(createStudio, new RegExp(marker), `Create Studio missing ${marker}`);
}
assert.match(createStudio, /@\/components\/product\//, 'Create Studio should import product components');
```

**Step 4: Run the focused test and verify failure**

Run:

```bash
pnpm --filter @image-workbench/web test
```

Expected: FAIL. The current Create Studio still uses legacy class names.

---

## Task 2: Create reusable product studio primitives

**Objective:** Provide reusable visual building blocks so the page does not need global semantic CSS classes.

**Files:**

- Create: `apps/web/components/product/studio.tsx`
- May modify: `apps/web/components/product/state.tsx` only if existing empty/error states need tiny composition helpers.

**Step 1: Create `components/product/studio.tsx`**

Add product components that compose Shadcn primitives and Tailwind utilities. Use `data-slot` attributes for stable contract/debug selectors, not global class names.

Required exports:

```tsx
export function StudioHero(...)
export function StudioWorkbenchGrid(...)
export function StudioPanel(...)
export function StudioPreviewStage(...)
export function StudioPreviewFrame(...)
export function StudioCompareFrame(...)
export function StudioMetricGrid(...)
export function StudioActionToolbar(...)
export function StudioSupportGrid(...)
```

Implementation rules:

- Import `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` from `@/components/ui/card` where panel semantics are needed.
- Import `cn` from `@/lib/utils`.
- Use Tailwind utilities directly in component `className` defaults.
- Accept `className?: string` for composition.
- Do not define global CSS selectors.
- Do not introduce classes named `studio-*`, `lovart-*`, `image-card`, or `canvas-*`.

Target component shape:

```tsx
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StudioWorkbenchGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="studio-workbench-grid" className={cn('grid gap-5 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]', className)} {...props} />;
}

export function StudioActionToolbar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="studio-action-toolbar" className={cn('flex flex-wrap gap-2', className)} {...props} />;
}
```

Use the same pattern for the remaining components.

**Step 2: Verify TypeScript imports**

Run:

```bash
pnpm --filter @image-workbench/web typecheck
```

Expected after only this task: PASS if the file compiles and exports are valid.

---

## Task 3: Migrate Create Studio components to product primitives

**Objective:** Make the actual Create Studio route the visual master while preserving behavior.

**Files:**

- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/CreateHero.tsx`
- Modify: `apps/web/app/PromptComposer.tsx`
- Modify: `apps/web/app/ReferenceDropzone.tsx`
- Modify: `apps/web/app/PromptVariants.tsx`
- Modify: `apps/web/app/PreviewStage.tsx`
- Modify: `apps/web/app/SupportGrid.tsx`

**Step 1: Replace route-level wrapper classes**

In `apps/web/app/page.tsx`, replace:

```tsx
<section className="lovart-shell">
<div className="studio-shell lovart-workbench">
```

with product primitives:

```tsx
<section className="grid gap-5">
  <CreateHero />
  <StudioWorkbenchGrid>
    ...
  </StudioWorkbenchGrid>
  <SupportGrid ... />
</section>
```

Import:

```tsx
import { StudioWorkbenchGrid } from '@/components/product/studio';
```

Remove the legacy contract-marker comment once the tests no longer need it.

**Step 2: Migrate `CreateHero`**

Replace `studio-hero lovart-hero` with `StudioHero`.

Keep copy:

- Eyebrow: `YOUR AI IMAGE PARTNER`
- Title: `你想创作什么？`
- Description: existing Create Studio positioning copy.

**Step 3: Migrate `PromptComposer`**

Replace `composer-card`, `command-composer`, and `composer-input-wrap` with `StudioPanel` plus Tailwind utility classes.

Preserve behavior:

- Prompt textarea state.
- Upload/drop reference flow.
- Prompt variants action.
- Link to Prompt Library.
- Link to Gallery.
- Advanced settings default collapsed.
- Submit button mode change between text generation and reference-image edit.

**Step 4: Migrate `ReferenceDropzone`**

Use Tailwind utilities and Shadcn `Button` only. Keep the existing hidden file-input accessibility behavior, including `sr-only` and the `reference-file-input` CSS only if browser layout requires the extra clipping class.

If `reference-file-input` is still needed for mobile overflow prevention, keep it as an accessibility utility exception and document it in `docs/ui/create-studio-visual-master.md`.

**Step 5: Migrate `PromptVariants`**

Remove `variant-card`. Use `Button` or `Card` composition with Tailwind utilities.

**Step 6: Migrate `PreviewStage`**

Replace these classes with product primitives:

- `preview-stage`
- `preview-frame`
- `preview-empty`
- `compare-stage`
- `metric-grid`
- `metric`
- `image-action-toolbar`
- `version-strip`

Preserve behavior:

- Status badge.
- Before/after comparison.
- Empty state.
- Download original.
- Continue edit.
- Send Canvas.
- Task detail link.
- Version chain strip.
- Error state.

**Step 7: Migrate `SupportGrid`**

Replace `support-grid` with `StudioSupportGrid` or Tailwind grid utilities.

Keep the three support cards:

- Touch Edit.
- Asset Flow.
- Workflow.

**Step 8: Run focused verification**

Run:

```bash
pnpm --filter @image-workbench/web test
pnpm --filter @image-workbench/web typecheck
```

Expected: PASS after all migrated Create components compile and the new contract test is satisfied.

---

## Task 4: Remove only unused Create-specific CSS debt

**Objective:** Reduce legacy global CSS without destabilizing Gallery, Canvas, or responsive behavior.

**Files:**

- Modify: `apps/web/app/styles/product-surfaces.css`
- Modify: `apps/web/app/styles/layout.css`
- Modify: `apps/web/app/globals.css` if contract marker comments become stale.
- Do not broadly delete: `apps/web/app/styles/ops-canvas.css`, `components.css`, `responsive.css`, or token definitions.

**Step 1: Search before deletion**

Run searches for each selector candidate:

```bash
rg "lovart-shell|lovart-hero|lovart-workbench|composer-card|command-composer|composer-input-wrap|reference-dropzone|support-grid|preview-stage|preview-frame|preview-empty|compare-stage|metric-grid|image-action-toolbar|version-strip|variant-card" apps/web/app apps/web/components
```

Expected: after Task 3, no migrated Create files should use those selectors.

**Step 2: Delete only selectors that have no remaining use**

Remove unused Create-specific selectors from:

- `apps/web/app/styles/product-surfaces.css`
- `apps/web/app/styles/layout.css`

Keep selectors still used by unmigrated surfaces, for example Gallery `image-card` debt, until their own migration slice.

**Step 3: Update stale contract marker comments**

If `apps/web/app/globals.css` still lists removed selectors in comments, update the comment so it no longer preserves deleted Create-specific markers.

**Step 4: Verify CSS and contract tests**

Run:

```bash
pnpm --filter @image-workbench/web test
git diff --check
```

Expected: PASS.

---

## Task 5: Document the visual-master rules

**Objective:** Make the visual system repeatable for future Gallery, Canvas, Agent, Settings, and Ops work.

**Files:**

- Create: `docs/ui/create-studio-visual-master.md`
- May modify: `docs/roadmap.md` only if a short pointer is needed.

**Step 1: Create the visual rules doc**

Include these sections:

```markdown
# Create Studio Visual Master

## Source of truth

- ADR: ../adr/0001-create-studio-as-visual-master.md
- Tailwind tokens + Shadcn primitives are the visual source of truth.
- Create Studio is the master surface; other pages inherit from it.

## Visual direction

Dark premium creative workbench: calm, image-first, precise, high-contrast enough for production use.

## Allowed building blocks

- `components/ui/*` primitives.
- `components/product/*` composed components.
- Tailwind utilities.
- Existing CSS tokens and reset styles.

## Disallowed in migrated product surfaces

- New `studio-*`, `lovart-*`, `image-card`, `canvas-*`, or equivalent global semantic CSS families.
- Page-local design systems.
- Raw debug payloads in the main creative flow.

## Create Studio hierarchy

1. Intent / hero.
2. Prompt composer.
3. Reference input.
4. Advanced settings collapsed by default.
5. Preview stage.
6. Result actions.
7. Supporting routes.

## Migration checklist for other pages

- Import Shadcn/product primitives.
- Remove page-specific global visual classes.
- Add the surface to contract-test coverage after migration.
- Preserve behavior and E2E semantics.
```

**Step 2: Link the ADR**

Make sure the doc links back to `docs/adr/0001-create-studio-as-visual-master.md`.

**Step 3: Verify markdown diff**

Run:

```bash
git diff --check -- docs/ui/create-studio-visual-master.md
```

Expected: PASS.

---

## Task 6: Light Gallery and Canvas validation only

**Objective:** Confirm the new master can guide future migration without starting a full redesign.

**Files:**

- Read: `apps/web/app/gallery/page.tsx`
- Read: `apps/web/app/gallery/GalleryCard.tsx`
- Read: `apps/web/app/canvas/page.tsx`
- Read: `apps/web/app/canvas/CanvasArea.tsx`
- May modify: `docs/ui/create-studio-visual-master.md`
- May modify: `apps/web/product-ui-contract.test.js` only for scoped future markers.

**Step 1: Inspect Gallery and Canvas for inheritance blockers**

Check whether current Gallery/Canvas can later adopt:

- Product panels.
- Product action toolbar.
- Preview/image frame primitives.
- Metric/status strip primitives.
- Empty/error state components.

**Step 2: Do not redesign these pages in P0**

Only document follow-up notes such as:

- Gallery should migrate `image-card` after Create Studio is stable.
- Canvas should migrate `canvas-*` only in a Canvas-specific slice because React Flow/layout constraints are different.

**Step 3: Keep tests scoped**

Do not add a global ban that fails existing unmigrated Gallery/Canvas CSS. The contract test should only ban legacy semantic classes inside the migrated Create Studio file group.

---

## Task 7: Final verification and handoff

**Objective:** Prove the P0 slice is stable and ready for review.

**Files:**

- Verify all changed files.
- Update `CHANGELOG.md` only if the implementation changes shipped product behavior; for documentation-only plan/ADR changes, this is optional.

**Step 1: Run the full web verification set**

Run:

```bash
pnpm --filter @image-workbench/web test
pnpm --filter @image-workbench/web typecheck
pnpm --filter @image-workbench/web build
git diff --check
```

Expected: all pass.

**Step 2: Optional browser smoke**

If dependencies and browser runtime are available:

```bash
pnpm --filter @image-workbench/web test:e2e
```

Expected: core Create Studio, Gallery, and Canvas smoke tests pass.

**Step 3: Review diff for scope creep**

Confirm no files changed outside the P0 surface except tests/docs/product primitives.

Allowed change areas:

- `apps/web/app/page.tsx`
- `apps/web/app/CreateHero.tsx`
- `apps/web/app/PromptComposer.tsx`
- `apps/web/app/ReferenceDropzone.tsx`
- `apps/web/app/PromptVariants.tsx`
- `apps/web/app/PreviewStage.tsx`
- `apps/web/app/SupportGrid.tsx`
- `apps/web/components/product/studio.tsx`
- `apps/web/app/styles/product-surfaces.css`
- `apps/web/app/styles/layout.css`
- `apps/web/app/globals.css`
- `apps/web/product-ui-contract.test.js`
- `docs/adr/0001-create-studio-as-visual-master.md`
- `docs/ui/create-studio-visual-master.md`
- `docs/plans/2026-05-29-create-studio-visual-master-p0.md`

If other app behavior files changed, revert or justify them before handoff.

**Step 4: Handoff message**

Report:

- What changed.
- Which visual rules are now enforced.
- Which commands passed.
- Which Gallery/Canvas migration notes remain deferred.
- Whether anything was not run and why.

Do not deploy or restart production services in this P0 slice unless explicitly authorized.
