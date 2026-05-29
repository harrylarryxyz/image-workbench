# ADR 0002: Adopt a Unified Visual Stage and Creation-Case Routing Model

**Status:** Accepted
**Date:** 2026-05-29

## Context

The next Image Workbench refactor must be driven by product philosophy before layout, route names, or existing implementation modules are preserved.

The discovery process identified a core problem in image-generation workbenches: many users do not arrive with a mature prompt or a clear visual intention. They may arrive with curiosity, vague taste, prompt paralysis, or an under-specified task. Professional users, meanwhile, still need control, provenance, repeatability, local editing, comparison, and inspection.

The product should therefore avoid two failure modes:

- a beginner-only prompt helper that becomes a toy;
- a professional-only workspace that pushes uncertain users away with blank canvases, jargon, setup wizards, or exposed engineering mechanics.

The accepted product principle is:

> 专业不降级，兴趣不劝退。

The product-philosophy PRD that grounds this ADR is:

- `docs/product/visual-stage-product-philosophy-prd.md`

This ADR turns that PRD into architectural/product-direction guardrails for later interaction specs and implementation plans.

## Decision

Image Workbench will use a **unified creative space** organized around a **Visual Stage**, powered by a durable **Creation Case** object and a first-response routing model.

The product must not ask users to choose a simple/professional mode before beginning. Instead, users start in one creative space whose depth progressively changes based on the current case and the user's actions.

The durable product object is the **Creation Case**, not a standalone image, prompt, task, parameter set, gallery item, or canvas node.

A Creation Case represents the user's evolving creative state, including:

- original intent and refined intent summary;
- subject/source;
- use context;
- audience/recipient;
- visual direction and references;
- visible assumptions;
- missing anchors;
- constraints and rights/IP/source notes;
- outputs and variants;
- feedback and judgments;
- branches and selected champion;
- inspectable provenance, prompt, parameters, and lineage;
- completion/export summary.

The first screen should be organized around a **Visual Stage**:

> a visually centered creation stage where input, guidance, branches, feedback, and deeper controls orbit the emerging result or direction.

The first loop after rough intent must be:

```text
rough intent → creation-case draft → first visual feedback route → user judgment → sharper case
```

The system is **draft-first, not questionnaire-first**. However, draft-first does not always mean generated pixels first.

## First-response router

After user input, the system chooses the fastest useful first visual feedback route.

### Reference-first

Use when the input is vague, taste-heavy, or visually underdetermined.

Required shape:

- 3–5 reference territories;
- each territory is a small cluster, not a single image to copy;
- each territory has a human-readable label;
- each territory explains why it matches the case;
- user can choose a direction, mark likes/dislikes, or skip references.

Reference-first must not become a waterfall gallery, Pinterest clone, template browser, or hidden copying mechanism.

### Generate-first

Use when at least 3 of 4 anchors are present and no hard blocker exists.

The four anchors are:

1. subject/source;
2. use context;
3. audience/recipient;
4. visual direction/reference.

If one soft anchor is missing but inferable, generation is allowed only when the assumption is visible and easy to correct.

### Ask-first

Use only when missing information would force the system to invent hard facts or unsafe details.

Hard blockers include:

- identity facts;
- brand rights;
- IP rights;
- real-person likeness or similarity;
- required user-owned material;
- legally or ethically sensitive missing facts.

Ask-first must not become a modal, questionnaire, or setup wizard. The Visual Stage remains alive, the creation-case draft remains visible, safe reference territories may still be shown, and only the unsafe generation action is blocked.

## Feedback and branch model

User feedback starts from judgment, not prompt rewriting.

First-level feedback actions should include choices such as:

- keep this;
- reject this;
- more like this;
- less like this;
- more restrained;
- bolder;
- more realistic;
- more commercial;
- more designed.

Prompt text, model parameters, node mechanics, and lineage are inspectable artifacts, not the primary interaction surface.

The visible branch model is:

> current champion + small comparison set.

The first surface should keep one active draft/direction centered, with 2–4 meaningful alternatives nearby. Full branch trees, prompt diffs, parameters, and lineage belong in advanced inspection.

## Completion model

A case is complete only when the user commits a champion for a specific use context.

Completion is not equivalent to model output.

A delivery package should include:

- selected visual asset;
- optional useful variants;
- visible assumptions;
- rights/source notes where relevant;
- relevant constraints;
- compact creation-case summary explaining why this direction was chosen;
- export or continue actions.

The case must remain reopenable for future iteration.

## Relationship to ADR 0001

ADR 0001 established Create Studio as the first visual master and set design-system guardrails against visual drift.

This ADR sits above ADR 0001 in product-model priority.

Implications:

- ADR 0001's design-system discipline remains valid: Tailwind tokens, Shadcn-style primitives, reusable product components, and contract tests still guard visual quality.
- Existing names and modules such as Create Studio, Gallery, Canvas, Flow, Agent, or workspace are provisional implementation artifacts.
- Create Studio may continue as an implementation slice only if it serves the unified Visual Stage and Creation Case model.
- Future specs may rename, reshape, merge, or replace current surfaces if that better preserves the accepted product philosophy.
- No later layout may use ADR 0001 as a reason to preserve the current Create Studio structure if that structure conflicts with this ADR.

## Non-goals

This ADR does not decide:

- final page layout;
- final responsive layout;
- final component hierarchy;
- final route names;
- final data schema;
- exact model/provider behavior;
- exact reference-search/source integration;
- final visual style;
- final copywriting or public slogan;
- implementation sequence;
- migration plan from current modules;
- test file names.

## Alternatives Considered

### Keep separate beginner and professional modes

This looks clean on paper, but it forces users to self-classify before they understand the product. It risks creating two products: a shallow guided toy and a separate professional tool. Work may fail to pass losslessly between surfaces.

Rejected because the accepted philosophy requires one creation object that can move from guided outcome to controlled direction.

### Preserve current Studio/Gallery/Canvas/Flow boundaries

This would reduce implementation uncertainty, but it lets existing architecture dictate product philosophy. The discovery process explicitly rejected assuming current modules survive.

Rejected as a starting rule. Existing modules may survive only if later specs prove they serve the Creation Case and Visual Stage model.

### Make prompt construction the central interface

Prompt-first tools are straightforward to build and familiar to power users, but they fail the prompt-paralysis problem. They also hide judgment, assumptions, references, and branching inside opaque text mutation.

Rejected because prompt text should be inspectable craft, not the user's required control surface.

### Use a template/example gallery as the front door

Examples can teach capability, but making them the default front door turns the product into browsing/copying and weakens user-owned creation.

Rejected as the default. Examples may remain as weak optional aids, not the main empty state.

### Generate pixels immediately for every request

Immediate generation can feel magical, but for vague or rights-sensitive requests it produces randomness, invented identity facts, copying risk, or low-trust output.

Rejected as a universal rule. Generate-first is allowed only when anchor sufficiency and hard-blocker rules are satisfied.

## Consequences

Positive consequences:

- The product has a durable object model for both guided and professional workflows.
- Beginners are not forced into prompt craft or setup wizards.
- Professional users retain a path to control, provenance, repeatability, and lineage.
- PC and mobile can be designed from shared experience invariants rather than collapsed layouts.
- References, assumptions, blockers, generation, feedback, branches, and export become one coherent loop.
- Future specs can challenge current modules without losing the product philosophy.

Trade-offs:

- Implementation will require a more explicit case/routing model than a simple prompt-to-image form.
- Some current page boundaries may be invalidated.
- Reference-first requires rights/source-aware design to avoid copying behavior.
- Ask-first must be carefully designed so it blocks only unsafe generation without turning into a questionnaire.
- Product tests will need to cover experience behavior, not only components and API results.

## Implementation Guardrails

- Treat Creation Case as the product source of truth for the creative loop.
- Do not introduce a front-door beginner/professional mode split.
- Do not expose full prompt, parameters, node mechanics, or raw diagnostics as the default first surface.
- Preserve PC/mobile invariants: aesthetic proof, creative entry, creation-case legibility, feedback, and comparison must remain available on both.
- Keep default empty state user-owned and actionable; examples must remain secondary.
- Use Reference-first, Generate-first, and Ask-first as explicit routing states in specs and tests.
- Make assumptions visible and correctable.
- Block only unsafe or hard-fact invention; keep the Visual Stage alive during blockers.
- Use judgment-first feedback before prompt rewriting.
- Preserve meaningful branch labels in user language, not technical diff language.
- Keep provenance, prompt, parameter, and lineage inspection available for professional depth.
- Do not let any current module name override the Creation Case and Visual Stage model.

## Follow-up

Create the next interaction/visual spec for PC and mobile that defines:

- canonical naming for Visual Stage, Creation Case, Champion, Branch, and Reference Territory;
- empty-state choreography;
- creation-case draft surface;
- first-response router UI;
- Reference-first, Generate-first, and Ask-first states;
- judgment-first feedback interactions;
- champion/comparison/branch recovery model;
- completion/export package;
- advanced inspection entry points;
- acceptance tests and visual regression scope.
