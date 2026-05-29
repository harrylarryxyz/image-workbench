# Create Studio Visual Master

## Source of truth

- ADR: [`../adr/0001-create-studio-as-visual-master.md`](../adr/0001-create-studio-as-visual-master.md)
- Implementation plan: [`../plans/2026-05-29-create-studio-visual-master-p0.md`](../plans/2026-05-29-create-studio-visual-master-p0.md)
- Tailwind tokens and Shadcn-style primitives are the visual source of truth.
- Create Studio is the master surface; Gallery, Canvas, Agent, Settings, and Ops inherit from it in later migration slices.
- Reusable product components live in `apps/web/components/product/*`; Create Studio-specific layout primitives currently live in `apps/web/components/product/studio.tsx`.

## Visual direction

Image Workbench should feel like a dark premium creative workbench:

- Image-first: prompt, reference, preview, and output actions are visually prioritized over diagnostics.
- Calm: dark surfaces, restrained gradients, subtle borders, and limited accent color.
- Precise: clear panel hierarchy, obvious result actions, and compact status/metric strips.
- Production-ready: enough contrast and spacing for real workflows, not a neon demo or generic SaaS admin dashboard.

## Allowed building blocks

Use these in migrated product surfaces:

- `components/ui/*` Shadcn-style primitives such as `Button`, `Input`, `Textarea`, `Card`, `Label`, `Badge`, and native/select wrappers.
- `components/product/*` composed product components such as state cards and studio primitives.
- Tailwind utilities backed by the existing token palette in `app/styles/tokens.css`.
- Existing global CSS only for tokens, reset/base typography, third-party integration exceptions, and legacy surfaces not yet migrated.
- `data-slot` attributes for stable debug or contract selectors when a reusable component needs an identifiable part.

## Disallowed in migrated product surfaces

Do not add a new page-local design system or another global semantic CSS family.

Disallowed examples in migrated surfaces:

- `studio-*` as page-specific class names.
- `lovart-*` class names.
- `image-card`, `canvas-*`, or equivalent feature-family global selectors unless the surface is explicitly still in a legacy migration slice.
- Raw `<button>`, `<input>`, `<textarea>`, `<select>`, or `<label>` in product pages when an existing primitive is available.
- Raw JSON diagnostics in the primary creative flow.
- E2E selectors coupled to removed legacy CSS classes.

## Create Studio hierarchy

Create Studio sets the visual hierarchy for the product:

1. Intent / hero: user understands the creative job first.
2. Prompt composer: primary input uses Shadcn/Tailwind surface treatment, not a page-local CSS card.
3. Reference input: upload is a visible creative affordance, while implementation-only keys stay hidden.
4. Advanced settings: model, size, quality, format, background, API mode, and mask key stay collapsed by default.
5. Preview stage: output area is a first-class creative canvas with empty, reference-only, generated, and before/after states.
6. Result actions: download, continue edit, send Canvas, task details, and version lineage are grouped as compact action toolbars.
7. Supporting routes: Edit, Gallery, and Canvas are presented as follow-on creative flows, not admin links.

## Current P0 implementation boundary

The P0 slice migrates only Create Studio and the minimum reusable product primitives needed by it.

Migrated Create Studio files must remain covered by `apps/web/product-ui-contract.test.js`:

- `app/page.tsx`
- `app/CreateHero.tsx`
- `app/PromptComposer.tsx`
- `app/ReferenceDropzone.tsx`
- `app/AdvancedSettingsPanel.tsx`
- `app/PromptVariants.tsx`
- `app/PreviewStage.tsx`
- `app/SupportGrid.tsx`

The contract test should fail if those files reintroduce bespoke legacy visual classes or stop composing product components.

## Gallery migration boundary

Gallery is intentionally not redesigned in P0.

Observed follow-up work:

- `GalleryCard` still uses `image-card`, `image-card-body`, `image-card-title`, `hover-toolbar`, `thumb-img`, and `thumb` global selectors.
- `MasonryGrid`, `GalleryLightbox`, collection chips, and reference/card thumbnails still depend on global image-surface CSS.
- A future Gallery slice should extract reusable asset primitives such as an asset card, image thumbnail frame, lightbox panel, collection strip, and hover action toolbar.
- Gallery contract coverage should be widened only after that slice migrates the actual Gallery components.

Do not add a global ban on `image-card` yet; that would fail the current intentionally deferred Gallery surface.

## Canvas migration boundary

Canvas is intentionally not redesigned in P0 because React Flow and spatial interactions have different constraints from Create Studio.

Observed follow-up work:

- `CanvasArea`, `CanvasDock`, `CanvasInspector`, and `canvas/page.tsx` still use `canvas-*` layout and surface selectors.
- Canvas output thumbnails currently reuse `reference-strip` and `reference-card` global selectors.
- A future Canvas slice should extract workflow-specific product primitives for the canvas shell, dock toolbar, inspector panel, run output thumbnails, and secondary panels.
- The dock must remain outside the React Flow surface so mobile controls, minimap, and previews are not covered.
- Canvas contract coverage should remain scoped to mobile layout safety until the Canvas-specific migration slice starts.

Do not add a global ban on `canvas-*` yet; that would fail the current intentionally deferred Canvas surface.

## Migration checklist for other pages

When migrating another product surface:

1. Inventory current global CSS selectors and raw controls.
2. Choose or create reusable `components/product/*` components before editing page markup.
3. Replace raw controls with `components/ui/*` primitives.
4. Move page-specific visual rules into Tailwind utilities or product components.
5. Keep behavior, URLs, API calls, and E2E semantics unchanged unless the slice explicitly changes them.
6. Add the migrated files to scoped contract-test coverage.
7. Delete only selectors that have no remaining runtime usage.
8. Run `pnpm --filter @image-workbench/web test`, `typecheck`, `build`, and `git diff --check` before committing.
