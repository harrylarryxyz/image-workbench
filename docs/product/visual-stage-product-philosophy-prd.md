# Visual Stage Product Philosophy PRD

> Product-philosophy PRD for the Image Workbench creative-space refactor. This document intentionally defines the product logic, experience invariants, and decision rules before layout, route names, or implementation modules are chosen.

**Created:** 2026-05-29T09:49:33Z
**Status:** Accepted for ADR/spec handoff
**Source:** `docs/product/design-philosophy-discovery-log.md`
**Scope:** Unified creative space, creation-case lifecycle, first-response loop, feedback/branch/commit model, and PC/mobile invariants.

## 1. Purpose

This PRD freezes the current product-philosophy decisions enough to guide the next redesign/refactor phase.

It is not:

- a final UI layout;
- a component spec;
- an ADR;
- an implementation plan;
- a commitment to preserve current route names, module names, or page boundaries.

Existing names such as Studio, Gallery, Canvas, Flow, dashboard, or workspace are treated as provisional implementation artifacts unless a later spec deliberately keeps them.

## 2. Core thesis

Image Workbench should not be a prompt box that happens to generate images.

It should help users move from vague curiosity, vague visual taste, or under-specified creative need into a **creation case** that can be judged, steered, refined, committed, exported, and reopened.

Internal principle:

> 专业不降级，兴趣不劝退。

Meaning:

- Professional users must be able to reach serious control, inspectability, provenance, and repeatability.
- Curious or non-professional users must not be pushed away by blank canvases, prompt craft, design jargon, setup wizards, or beginner-only tutorials.
- The same product surface should progressively reveal depth based on the creation case and user actions, not ask users to self-classify as beginner/professional at the front door.

## 3. User-state transformation

### 3.1 Before using the product

The user may be in one of these states:

- **Pre-intent curiosity:** “I do not yet know what this tool can do for me.”
- **Prompt paralysis:** “I want something visual, but I do not know what to type.”
- **Vague taste:** “I want it to feel premium / clean / beautiful / more designed.”
- **Under-specified task:** “Make an avatar / poster / product image,” but key context is missing.
- **Professional acceleration:** “I know the direction, but need faster generation, variation, comparison, local edits, provenance, or repeatability.”

### 3.2 After a successful first loop

The user should have:

- a visible creation-case draft showing how the system understood the intent;
- a first visual feedback artifact, which may be a reference board, generated draft, or safe blocker card;
- a way to judge and steer without rewriting a prompt;
- a visible path to deeper control if needed;
- enough confidence to continue, compare, or commit a direction.

### 3.3 After completion

The user should have:

- a committed champion for a specific use context;
- optional useful variants;
- visible assumptions, source/rights notes, and relevant constraints;
- a compact creation-case summary explaining why this direction was chosen;
- a reopenable case for future iteration.

## 4. Core object: Creation Case

The durable product object is not just an image, prompt, parameter set, or output gallery item.

A **Creation Case** holds the creative state across guided and professional depth.

### 4.1 Creation Case skeleton

A creation case should be able to contain:

- **User intent:** original request and refined intent summary.
- **Subject/source:** who or what is being depicted; user-owned material if required.
- **Use context:** avatar, poster, cover, product image, social post, client preview, etc.
- **Audience/recipient:** who will see or use the image.
- **Visual direction/reference:** taste words, selected reference territory, reference images, style constraints.
- **Assumptions:** defaults the system inferred and exposed.
- **Missing anchors:** unresolved information that affects routing or generation.
- **Constraints:** platform, size, brand, forbidden elements, consistency needs, rights/IP constraints.
- **Outputs:** generated drafts, edited results, selected candidates.
- **Branches:** meaningful alternatives created by user judgment or steering.
- **Feedback:** user actions such as keep/reject/more-like-this/less-like-this/local edits.
- **Provenance:** prompt, model, parameters, references, lineage, and transformation history for inspection.
- **Commit summary:** chosen champion, use context, why chosen, and delivery notes.

### 4.2 Visibility rule

The full creation case is not exposed as a form on the first surface.

Default visible structure should stay compact:

- one-line intent summary;
- four anchor chips;
- known / assumed / missing states;
- router explanation;
- one next primary action.

Advanced structure is inspectable when needed.

## 5. Unified Creative Space

The product should not ask users to choose a “simple” or “professional” mode before they begin.

The target product shape is a **unified creative space** whose depth changes progressively.

### 5.1 Why unified

A front-door mode split creates problems:

- beginners may not understand the choices;
- professionals lose momentum to routing decisions;
- guided and controlled experiences can become separate products;
- work may not pass losslessly between surfaces.

### 5.2 Required behavior

The unified creative space must:

- let users start from plain language or lightweight scaffolds;
- generate a creation-case draft immediately;
- reveal guidance when intent is sparse;
- reveal professional depth when the user asks for precision, local control, repeatability, or inspection;
- preserve the same creation case across all depths.

## 6. First-screen invariant: Visual Stage

The first screen should be organized around a **Visual Stage**.

It is not:

- a chat UI with image attachments;
- a blank professional canvas;
- a passive preview page;
- a template gallery;
- a prompt form with decoration.

It is:

> a visually centered creation stage where input, guidance, branches, feedback, and deeper controls orbit the emerging result or direction.

### 6.1 Empty state

Default empty state:

> user-owned, empty-but-actionable Visual Stage.

Required elements:

- one plain-language creation entry;
- lightweight intent scaffolds;
- visible but secondary path to optional examples;
- aesthetic credibility without making examples the main dish;
- a clear sense that the stage is waiting for the user's own work.

Examples may exist only as optional, low-weight learning aids. They should demonstrate genuinely different capabilities or workflows, not simply decorate the product with sample images.

### 6.2 PC/mobile invariant

Desktop and mobile may use different layouts, but they must preserve the same decision structure:

- aesthetic proof remains visible;
- creative entry remains reachable;
- the current creation case remains legible;
- feedback and comparison remain available;
- mobile must not become a downgraded hidden-history or form-first experience.

## 7. First response loop

After the user submits rough intent, the system should respond with:

1. a creation-case draft;
2. a first-visual-feedback route;
3. one next primary action.

The system should be **draft-first, not questionnaire-first**.

However, “draft-first” does not always mean generated pixels first.

## 8. Creation-case draft: minimal first surface

The first visible creation-case draft should include:

- **Intent summary:** one sentence describing what the system thinks the user wants.
- **Anchor chips:**
  - subject/source;
  - use context;
  - audience/recipient;
  - visual direction/reference.
- **Anchor state:** known / assumed / missing.
- **Router explanation:** why the system is showing references, generating, or asking one critical question.
- **Next primary action:** choose direction, generate, upload material, confirm right/identity, or correct an assumption.

Do not show by default:

- full prompt text;
- raw model parameters;
- node/flow mechanics;
- long forms;
- professional controls unrelated to the immediate next decision.

Those details should be available through inspection.

## 9. First-visual-feedback router

The first visual artifact should reduce uncertainty fastest.

The router chooses between:

- **Reference-first**;
- **Generate-first**;
- **Ask-first**.

### 9.1 Reference-first

Use when:

- the prompt is sparse;
- the prompt is taste-heavy;
- the prompt relies on vague adjectives like 高级 / 好看 / 有质感;
- generation would become random because the visual direction is not yet shared.

Reference-first output:

- 3–5 curated visual territories;
- each territory contains a small image cluster;
- each territory has a plain-language label;
- each territory explains why it matches the user's intent;
- the first action is choosing or rejecting a direction;
- the user can mark likes/dislikes;
- “skip references, generate now” stays visible.

Reference-first must not become:

- a waterfall gallery;
- Pinterest-style browsing;
- single-image copying;
- a source of hidden rights risk;
- a delay when the user already gave enough information to generate.

### 9.2 Generate-first

Use when at least 3 of 4 anchors are present:

1. subject/source;
2. use context;
3. audience/recipient;
4. visual direction/reference.

And no hard blocker exists.

Hard blockers:

- identity facts;
- brand rights;
- IP rights;
- real-person likeness or similarity;
- required user-owned material;
- legally or ethically sensitive missing facts.

If exactly one soft anchor is missing but inferable, the system may generate only if the assumption is visible and easy to correct.

Example assumption chips:

- `Assumed use: social avatar`
- `Assumed format: square`
- `Assumed audience: general public`

### 9.3 Ask-first

Use only when missing information would force the system to invent hard facts.

Ask-first must not become a modal, questionnaire, or setup wizard.

Required behavior:

- keep the Visual Stage alive;
- show the creation-case draft;
- when safe, show reference territories;
- block only the unsafe generation action;
- attach one unblocker card to the missing anchor;
- offer concrete actions such as upload material, choose subject, confirm brand/IP/right, or use generic placeholder;
- continue generation immediately after the blocker is resolved.

Example:

User says: “做一张我风格的高级头像” but has not provided a photo.

System should:

- show the creation-case draft;
- show safe “高级头像” reference territories;
- block real-likeness generation;
- ask one unblocker: upload your photo / use generic fictional subject / use brand symbol / use abstract avatar.

## 10. Feedback model

After a reference direction or first generated draft appears, feedback should start from judgment, not prompt rewriting.

### 10.1 First-level feedback

Use actions like:

- choose this direction;
- keep this;
- reject this;
- more like this;
- less like this;
- more restrained;
- bolder;
- more realistic;
- more commercial;
- more designed.

Chinese steering examples:

- 更克制;
- 更大胆;
- 更真实;
- 更商业;
- 更有设计感.

### 10.2 Progressive depth

Deeper controls appear when the user creates a need for precision:

- user points at a result or area → local edits;
- user asks for precision → professional controls;
- user wants trust/repeatability → prompt, parameter, constraint, and lineage inspection;
- user wants automation → underlying flow/provenance view may be exposed.

Prompt text is an inspectable artifact, not the primary interaction.

### 10.3 Feedback persistence

Every significant feedback action must:

- update the creation case;
- preserve the user's judgment in understandable language;
- create a traceable branch when it materially changes direction;
- avoid invisible prompt mutation.

## 11. Branch and comparison model

The first surface should not expose full version-control complexity.

Use this invariant:

> current champion + small comparison set.

Required behavior:

- one active draft/direction is centered;
- 2–4 pinned alternatives or recent meaningful branches remain nearby;
- branches are labeled by user intent, not technical diff language;
- full branch tree, prompt diffs, parameters, and lineage live in advanced inspection;
- mobile preserves the same comparison structure through swipeable comparison or equivalent interaction.

Example branch labels:

- 更克制版;
- 商业感增强;
- 不要霓虹;
- 更真实光影.

## 12. Completion / commit model

A creation case is not complete merely because the model generated an image.

Completion happens when:

> the user commits a champion for a specific use context.

Delivery package should include:

- selected visual asset;
- optional 2–3 useful variants;
- visible assumptions;
- rights/source notes where relevant;
- relevant constraints;
- compact creation-case summary explaining why this direction was chosen.

Primary actions:

- 用这个;
- 导出;
- 继续做变体.

The case must remain reopenable for future iteration, but the first delivery surface should not become asset management.

## 13. Rights, references, and copying boundary

Reference boards are allowed to help users form visual direction, but they must not encourage copying a single source image.

Required behavior:

- cluster references by direction rather than presenting one canonical image to imitate;
- describe what direction or constraint is being extracted;
- preserve source/rights awareness;
- avoid hiding copyright, likeness, brand, or IP risk inside the generation flow;
- let users use references for alignment, not plagiarism.

## 14. Experience acceptance criteria

These are product-level acceptance criteria for later spec and testing.

### 14.1 Sparse taste prompt

Input:

> 做一张高级一点的头像

Expected:

- creation-case draft appears;
- subject/source is marked missing;
- use context may be assumed as social avatar;
- visual direction is routed to reference-first;
- 3–5 reference territories appear;
- one unblocker asks for subject/source;
- generation does not invent a person silently.

### 14.2 Clear generation prompt

Input:

> 为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。

Expected:

- at least 3 anchors are known;
- no hard blocker unless brand/IP/source material is required and missing;
- generate-first is allowed;
- assumption chips appear for any inferred defaults;
- first draft is generated with visible reasoning.

### 14.3 Hard blocker

Input:

> 用我照片做一张像某明星风格的头像

Expected:

- creation-case draft appears;
- real-person/source and likeness/IP risk are marked;
- unsafe generation is blocked;
- one unblocker card offers safe alternatives;
- safe references or generic direction may remain visible if appropriate.

### 14.4 First feedback

When the user sees a draft or reference direction:

Expected:

- primary actions support judgment rather than prompt rewriting;
- steering chips are grounded in the current case;
- local edits appear only after the user points at an object/area;
- professional controls are inspectable but not first-surface clutter;
- every meaningful steering action updates the case and branch history.

### 14.5 Branch recovery

When the user explores variants:

Expected:

- current champion remains clear;
- 2–4 meaningful alternatives remain comparable;
- previous good direction can be recovered;
- mobile provides comparison without hiding it behind deep menus.

### 14.6 Commit/export

When the user chooses `用这个`:

Expected:

- champion is tied to a use context;
- export is available;
- assumptions/rights/source notes remain visible;
- optional variants do not overwhelm delivery;
- the case can be reopened with reasoning and branch context intact.

## 15. Explicit non-goals for this PRD

Do not decide in this PRD:

- final page layout;
- final responsive layout;
- final component hierarchy;
- route names;
- whether current Studio/Gallery/Canvas/Flow modules survive;
- exact data schema;
- exact model/provider behavior;
- exact search/reference source integration;
- final visual style;
- final copywriting or public slogan;
- implementation sequence;
- test file names.

## 16. Open questions for ADR/spec

The next phase should resolve:

- whether the accepted product philosophy requires an ADR before UI spec;
- final canonical naming: Visual Stage, Creative Space, Creation Case, Champion, Branch, Reference Territory;
- concrete PC/mobile interaction choreography;
- exact empty-state scaffolds;
- visual territory generation/search/source policy;
- rights/source notes language;
- branch data model and lineage inspection shape;
- export package formats;
- acceptance tests and visual regression scope;
- migration strategy from current implementation, if current modules are retained at all.

## 17. Summary contract

The refactor should preserve this contract:

> A user enters a user-owned Visual Stage, gives rough intent, sees a lightweight creation-case draft, receives the fastest useful first visual feedback, judges and steers through visible comparisons, progressively opens depth when needed, and commits a champion for a real use context — without being forced into prompt craft, setup wizards, template browsing, or downgraded professional control.
