# ADR 0001: Use Create Studio as the Visual Master

**Status:** Accepted
**Date:** 2026-05-29

## Context

Image Workbench already has production-oriented foundations: a Next.js web app, API/worker separation, persisted assets, Canvas, Agent, operations surfaces, and a product UI contract test. The product now needs to prevent visual drift before additional feature complexity lands.

The current UI has a Shadcn/Tailwind foundation, but product styling is still spread across handcrafted CSS files and semantic class families such as `studio-*`, `lovart-*`, `image-card`, and `canvas-*`. Those classes helped earlier productization work, but they should not become the long-term design-system source of truth.

The product direction is a dark, premium creative workbench: image-first, calm, precise, and professional. It should not feel like a generic SaaS admin dashboard, a neon cyberpunk demo, or a collection of unrelated feature pages.

## Decision

Create Studio is the single visual master for Image Workbench.

Future Gallery, Canvas, Agent, Settings, and Ops surfaces must inherit the visual language established by Create Studio instead of evolving independent page-specific aesthetics.

The long-term visual source of truth is:

1. Tailwind design tokens.
2. Shadcn-style primitives and variants.
3. Reusable product components composed from those primitives.
4. Contract tests that prevent new legacy styling debt.

Handcrafted semantic CSS families such as `studio-*`, `lovart-*`, `image-card`, and `canvas-*` are migration debt. Existing usage may remain temporarily while surfaces are migrated, but new product UI should not introduce more of this class family pattern.

## P0 Scope

The first implementation slice is intentionally narrow:

- Refine the real Create Studio page into the visual master.
- Extract only the design-system primitives and product components needed to make that master reusable.
- Document the visual rules for future work.
- Add or extend contract tests so new migrated surfaces cannot reintroduce bespoke semantic CSS families.
- Lightly validate that Gallery and Canvas can inherit the direction, without full redesigning them in the same slice.

## Non-goals

This ADR does not authorize:

- A full-site redesign in one pass.
- New generation, editing, Canvas, or Agent capabilities.
- A rewrite of Canvas interactions.
- Deleting all existing global CSS before pages are migrated.
- Introducing a new handcrafted naming system to replace the old handcrafted naming system.

## Alternatives Considered

### Keep styling page-specific

This is fastest for isolated feature work, but it is the main cause of visual drift. As Image Workbench grows, page-local styling would keep producing inconsistent hierarchy, spacing, controls, and empty/error states.

### Make Canvas the visual master

Canvas is strategically important, but it has specialized spatial interactions and React Flow constraints. Using it as the first visual master would overfit the system to a complex workspace before the core creation loop is stable.

### Do a full visual rewrite immediately

A full rewrite could produce consistency quickly, but it carries high regression risk and distracts from the immediate goal: establish a reusable master and guardrails before broad migration.

## Consequences

Positive consequences:

- Create Studio becomes the product's visual benchmark and onboarding impression.
- Future surfaces have a concrete pattern to copy instead of inventing local styling.
- UI polish becomes enforceable through tests, not only prose.
- The team can migrate legacy CSS incrementally without destabilizing the whole app.

Trade-offs:

- Some legacy CSS will remain temporarily.
- Gallery, Canvas, and Agent may look partially transitional until their migration slices happen.
- Contract tests must be scoped carefully so they block new debt without failing on intentionally unmigrated legacy files.

## Implementation Guardrails

- Prefer Tailwind utilities, design tokens, and Shadcn primitives over new global semantic CSS.
- If a product-specific component is needed, create a reusable component that composes primitives instead of adding another global CSS class family.
- Keep diagnostics accessible but visually secondary to the creative workflow.
- Update UI contract tests whenever a surface is migrated.
- Use role/text/test-id selectors in E2E tests rather than legacy class selectors.
- Treat global CSS as a transitional layer for tokens, resets, third-party integration exceptions, and legacy surfaces awaiting migration.

## Follow-up

Create a P0 implementation plan under `docs/plans/` that turns this ADR into small, verifiable tasks: Create Studio master, design-system extraction, visual rules documentation, scoped contract tests, and light Gallery/Canvas validation.
