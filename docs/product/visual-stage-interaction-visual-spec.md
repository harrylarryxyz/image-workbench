# Visual Stage PC/Mobile Interaction and Visual Spec

> Interaction and visual spec for implementing the Visual Stage direction from the product-philosophy PRD and ADR 0002. This document defines product states, cross-device choreography, visible objects, and acceptance criteria before code tasks are written.

**Created:** 2026-05-29
**Status:** Draft for implementation planning
**Sources:**

- `docs/product/visual-stage-product-philosophy-prd.md`
- `docs/adr/0002-unified-visual-stage-creation-case-routing.md`
- `docs/adr/0001-create-studio-as-visual-master.md`
- `docs/ui/create-studio-visual-master.md`

## 1. Purpose

This spec translates the accepted product philosophy into concrete PC/mobile interaction and visual requirements.

It answers:

- What should the user see before typing?
- What should happen after rough intent?
- How do Reference-first, Generate-first, and Ask-first appear?
- How does judgment-first feedback work?
- How are champion, alternatives, branch recovery, and export presented?
- What must remain invariant across desktop and mobile?

It intentionally does not define exact React components, database schema, final routes, provider internals, or implementation sequence.

## 2. Product contract

The product must preserve this contract:

> A user enters a user-owned Visual Stage, gives rough intent, sees a lightweight Creation Case draft, receives the fastest useful first visual feedback, judges and steers through visible comparisons, progressively opens depth when needed, and commits a champion for a real use context.

The interface must not force users into:

- prompt craft as the main job;
- setup wizards before any useful visual feedback;
- template browsing as the default start;
- beginner/professional self-classification;
- raw task/debug payloads in the primary flow;
- a downgraded mobile experience.

## 3. Canonical naming for this spec

These names are canonical for the next implementation plan unless later renamed deliberately.

- **Visual Stage:** the central visual surface where the case becomes visible.
- **Creation Case:** the durable creative object that carries intent, anchors, assumptions, references, outputs, feedback, branches, provenance, and commit summary.
- **Anchor:** one of the four first-loop clarity dimensions: subject/source, use context, audience/recipient, visual direction/reference.
- **Reference Territory:** a clustered visual direction option, not a single image to copy.
- **Draft:** a first generated or non-generated visual artifact that can be judged.
- **Champion:** the current best candidate or selected direction.
- **Comparison Set:** 2–4 nearby meaningful alternatives.
- **Unblocker Card:** a targeted, attached action that resolves one hard blocker without turning the whole flow into a questionnaire.
- **Inspection:** advanced prompt, parameter, lineage, rights/source, and diagnostics view.
- **Commit:** user confirmation that a champion is suitable for a specific use context.

## 4. Global experience invariants

Every responsive layout must preserve these invariants:

1. **Aesthetic proof remains visible.** The product must feel capable of visual work before the user trusts it with visual work.
2. **Creative entry remains reachable.** The user can start or revise intent without hunting through panels.
3. **Creation Case remains legible.** The system's understanding, assumptions, missing anchors, and next action are visible in compact form.
4. **The current champion remains clear.** The user always knows what is currently best/active.
5. **Comparison remains available.** Mobile may change interaction shape, but must not bury alternatives behind deep menus.
6. **Depth is progressive.** Professional controls are reachable when needed, not sprayed across the first surface.
7. **Diagnostics are secondary.** Raw JSON, storage keys, provider details, and stack-like payloads live behind Inspection/Diagnostics.
8. **Rights/source risk is visible at the decision point.** Risk cannot be hidden until export.

## 5. Information architecture inside the Visual Stage

The Visual Stage is not a three-column layout requirement. It is a priority model that can map differently on PC and mobile.

### 5.1 Priority layers

1. **Stage focus:** empty stage, reference territories, generated draft, blocker-safe state, champion, or delivery package.
2. **Creation entry:** plain-language intent input plus lightweight scaffolds.
3. **Case strip/card:** intent summary, anchor chips, assumptions, missing anchors, route reason, next action.
4. **Feedback rail:** judgment-first actions grounded in the current stage.
5. **Comparison set:** 2–4 meaningful alternatives or branches.
6. **Inspection entry:** prompt/parameters/lineage/rights/diagnostics, hidden by default.

### 5.2 Surfaces that may exist

These are product roles, not fixed component names:

- Stage Frame
- Intent Composer
- Creation Case Card
- Anchor Chip Row
- Route Reason Label
- Reference Territory Board
- Draft Viewer
- Champion Header
- Comparison Strip / Comparison Deck
- Feedback Controls
- Unblocker Card
- Inspection Drawer / Sheet
- Delivery Package Panel

## 6. Visual language requirements

The Visual Stage should inherit the dark premium creative workbench direction from ADR 0001, but ADR 0002 has product-model priority.

### 6.1 Tone

- Calm, image-first, precise, premium.
- A creative tool, not a SaaS admin console.
- Serious enough for professionals, approachable enough for vague first intent.

### 6.2 Visual hierarchy

Use contrast and space to create this order:

1. current visual artifact or empty stage invitation;
2. creation entry / next action;
3. case understanding and anchor state;
4. feedback and comparison;
5. advanced inspection and diagnostics.

### 6.3 Color and material

Use existing token direction rather than inventing a new palette:

- near-black background;
- slightly lifted card surfaces;
- restrained primary/accent usage;
- subtle borders at low opacity;
- success/ready states for known anchors or confirmed champion;
- warning/blocker treatment for hard blockers without turning the page into an error screen.

### 6.4 Motion and affordance

Motion should clarify stage transitions:

- empty stage → case draft;
- case draft → reference territories / generated draft / unblocker-safe state;
- selected territory → draft generation;
- feedback action → branch creation or champion update;
- champion → delivery package.

Motion should not feel like a marketing animation layered over an unhelpful form.

## 7. Desktop choreography

Desktop may use more simultaneous surfaces, but must not expose professional complexity by default.

### 7.1 Desktop empty state

Required first impression:

- large Visual Stage owns the page center;
- one plain-language composer is immediately available;
- 3–5 lightweight intent scaffolds may be shown as starting lenses, not templates;
- optional examples are secondary and visually weaker than the user's own stage;
- no raw API/provider/debug concepts appear;
- advanced settings are collapsed.

Suggested desktop composition:

- center: Visual Stage empty invitation;
- lower or overlay: Intent Composer;
- side or compact band: optional scaffolds such as `头像`, `海报`, `产品图`, `封面`, `参考图改造`;
- secondary link: `不知道怎么开始？看一个案例`.

Do not show a default gallery of sample images as the hero.

### 7.2 Desktop after intent submission

After submit, the desktop view should reveal:

- Stage focus changes to the selected route state;
- Creation Case Card appears near the stage, not as a long form;
- anchor chips show `Known`, `Assumed`, or `Missing`;
- route reason is stated in one sentence;
- exactly one primary next action is visually dominant;
- Inspection remains available but collapsed.

### 7.3 Desktop comparison behavior

Desktop should keep current champion and comparison set simultaneously visible when useful:

- champion/draft centered or largest;
- 2–4 alternatives in a nearby strip or side deck;
- branch labels are user-language labels, e.g. `更克制版`, `商业感增强`, `不要霓虹`;
- selecting an alternative previews it without losing the previous champion;
- promoting an alternative to champion is explicit.

### 7.4 Desktop advanced depth

Professional depth appears through progressive entry points:

- local edit controls after user points to an image/area;
- prompt/parameter inspection after user asks for repeatability or trust;
- lineage/branch tree after user asks to compare or recover;
- model/provider diagnostics only under Diagnostics/Inspection.

The first surface must not become a node graph or raw parameter editor.

## 8. Mobile choreography

Mobile is not a collapsed desktop sidebar. It must preserve the same decision structure with mobile-native interaction.

### 8.1 Mobile empty state

Required first impression:

- Visual Stage remains the first meaningful object;
- composer is reachable without scrolling past examples;
- optional scaffolds fit as compact chips or cards;
- examples are secondary and not the first-scroll owner;
- advanced controls are hidden behind a sheet/action.

Suggested mobile focus order:

1. Stage invitation / aesthetic proof;
2. composer;
3. lightweight scaffolds;
4. optional example link;
5. secondary product navigation.

### 8.2 Mobile after intent submission

Mobile should use a stacked or sheet-based rhythm:

- Stage remains top/primary;
- Creation Case Card appears as a compact expandable card below or as a bottom sheet peeking state;
- anchor chips remain visible without requiring deep navigation;
- the primary next action is sticky or otherwise easy to reach;
- route reason is one sentence, not a long panel.

### 8.3 Mobile comparison behavior

Mobile must preserve comparison, not hide it.

Acceptable patterns:

- swipeable comparison deck with champion pinned;
- horizontal alternative strip beneath the champion;
- split compare mode for two candidates;
- bottom sheet listing 2–4 alternatives with thumbnails and labels.

Unacceptable patterns:

- alternatives only in a full history page;
- previous good direction unrecoverable after swiping;
- comparison hidden behind three or more taps;
- mobile showing only the latest generated image.

### 8.4 Mobile advanced depth

Professional depth should open as sheets:

- `检查创作案` for case details;
- `高级控制` for prompt/parameters;
- `来源与权利` for references/rights;
- `版本与分支` for lineage;
- `诊断` for raw task/provider data.

Sheets must return cleanly to the stage without losing scroll position or current champion.

## 9. Creation Case Card spec

The first visible Creation Case Card is compact and fixed in skeleton.

### 9.1 Required fields

- **Intent summary:** one sentence in user language.
- **Anchor chips:** subject/source, use context, audience/recipient, visual direction/reference.
- **Anchor state:** known / assumed / missing.
- **Route reason:** why this route is being used.
- **Next action:** one primary action.

### 9.2 Anchor chip states

Use three stable states:

- **Known:** user supplied or confirmed.
- **Assumed:** system inferred and must show correction affordance.
- **Missing:** unresolved and may be soft or hard.

Hard missing anchors can attach an Unblocker Card. Soft missing anchors can show assumption chips.

### 9.3 Do not show by default

- full prompt text;
- raw model parameters;
- provider route;
- storage key;
- JSON payload;
- node graph;
- long questionnaire.

Those belong in Inspection.

## 10. Route state specs

### 10.1 Reference-first state

Use when intent is vague, taste-heavy, or visually underdetermined.

Stage content:

- 3–5 Reference Territories;
- each territory contains a small image cluster or representative visual cluster;
- each has a human-readable label;
- each explains why it matches;
- each exposes `选择这个方向`, `更像这个`, `不喜欢`, or equivalent judgment actions.

Case Card:

- marks vague anchors as assumed/missing;
- explains that references are being shown to clarify visual direction before generation;
- primary action is usually `选择方向` or `跳过参考直接生成` if safe.

Rights/source behavior:

- references are direction clusters, not copying targets;
- source/rights awareness is available;
- single-image imitation should be discouraged.

Desktop layout expectation:

- territories can appear as a grid/board around the stage;
- case and feedback stay near the active territory.

Mobile layout expectation:

- territories appear as swipeable cards or a compact stacked board;
- labels and reasons remain readable;
- selecting a territory should not require entering a separate gallery page.

### 10.2 Generate-first state

Use when at least 3 of 4 anchors are present and no hard blocker exists.

Stage content:

- generation progress in human terms;
- first draft when ready;
- assumptions visible as chips;
- next actions: `保留`, `再做几个方向`, `更克制`, `更大胆`, `局部修改`, `检查创作案`.

Case Card:

- shows known/assumed anchors;
- states why generation was safe;
- shows visible assumptions for any soft missing anchor.

Progress behavior:

- present task progress as creative status, not raw worker state;
- raw task id/provider payload is hidden in Diagnostics.

Desktop layout expectation:

- draft appears centered/largest;
- comparison set appears as soon as meaningful alternatives exist.

Mobile layout expectation:

- draft appears first;
- feedback chips and alternatives remain reachable without leaving the stage.

### 10.3 Ask-first state

Use only when missing information would force invention of hard facts or unsafe generation.

Stage content:

- Visual Stage stays alive;
- Creation Case Card stays visible;
- safe references may be shown when useful;
- unsafe generation action is blocked;
- one Unblocker Card attaches to the missing hard anchor.

Unblocker Card examples:

- upload your photo;
- choose a generic fictional subject;
- confirm brand/IP rights;
- use abstract avatar;
- replace celebrity similarity with a non-infringing style direction.

Required behavior:

- no full-screen blocking modal;
- no multi-question setup wizard;
- no hidden invention of identity/brand/IP facts;
- continue generation immediately after unblocker is resolved.

Desktop layout expectation:

- blocker appears attached to the missing anchor or generation action;
- safe stage content remains visible.

Mobile layout expectation:

- blocker appears as a focused card or bottom sheet, but the stage is still visible before/after the action;
- resolving action is one tap plus required input/upload when needed.

## 11. Feedback interaction spec

Feedback starts with judgment.

### 11.1 First-level feedback actions

Use short, user-language actions:

- `选这个`
- `不要这个`
- `更像这个`
- `少一点这个`
- `更克制`
- `更大胆`
- `更真实`
- `更商业`
- `更有设计感`
- `换一个方向`

These actions must update the Creation Case.

### 11.2 Feedback persistence

Every meaningful feedback action must record:

- target draft/territory/branch;
- user judgment in human language;
- whether it changed champion, created a branch, or adjusted constraints;
- visible summary in the case history or inspection.

### 11.3 Escalation to precision

Only after user behavior creates a need, reveal:

- local edit controls;
- prompt text;
- model/size/quality/seed-like parameters;
- reference weights or source controls;
- branch tree and lineage;
- diagnostics.

## 12. Branch, champion, and recovery spec

### 12.1 Default visible model

Use:

> champion + 2–4 comparison alternatives.

The champion is the current best working candidate, not necessarily final.

### 12.2 Branch labels

Labels must be user-language summaries:

- `更克制版`
- `商业感增强`
- `去掉霓虹`
- `更真实光影`
- `冷感科技方向`

Avoid technical labels as the primary branch identity:

- `seed 12489`
- `prompt v7`
- `task 01H...`
- `branch node 3`

Technical labels may appear in Inspection.

### 12.3 Recovery behavior

The user must be able to:

- recover a previous good direction;
- compare current champion against a prior meaningful branch;
- promote an alternative to champion;
- reopen lineage from Inspection.

Mobile must support this without deep menus.

## 13. Commit/export spec

The user commits when they choose a champion for a specific use context.

### 13.1 Commit trigger

Primary action:

- `用这个`

If use context is missing, ask one focused confirmation before export:

- `用于头像？`
- `用于社媒首发海报？`
- `用于客户预览？`

### 13.2 Delivery package

Show a compact delivery package:

- selected asset;
- optional 2–3 useful variants;
- use context;
- visible assumptions;
- rights/source notes where relevant;
- constraints;
- creation-case summary;
- actions: `导出`, `继续做变体`, `重新打开创作案`.

### 13.3 Reopen behavior

Committed cases remain reopenable with:

- champion;
- comparison set or branch highlights;
- case summary;
- assumptions/rights/source notes;
- inspection path to full lineage.

The delivery package is not a full asset-management system.

## 14. State-by-state acceptance scenarios

### 14.1 Sparse taste prompt

Input:

> 做一张高级一点的头像

Expected:

- Creation Case draft appears;
- subject/source is missing;
- use context may be assumed as social avatar;
- visual direction routes Reference-first;
- 3–5 Reference Territories appear;
- one Unblocker Card asks for subject/source;
- generation does not invent a person silently;
- mobile shows stage, case, references, and unblocker without turning into a questionnaire.

### 14.2 Clear generation prompt

Input:

> 为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。

Expected:

- at least 3 anchors are known;
- no hard blocker unless brand/IP/source material is required and missing;
- Generate-first is allowed;
- assumption chips appear for inferred defaults;
- first draft is generated with visible route reason;
- raw task/provider payload stays hidden.

### 14.3 Hard blocker prompt

Input:

> 用我照片做一张像某明星风格的头像

Expected:

- Creation Case draft appears;
- real-person/source and likeness/IP risks are marked;
- unsafe generation is blocked;
- one Unblocker Card offers safe alternatives;
- safe visual directions may remain visible;
- no celebrity-likeness generation is silently attempted.

### 14.4 First feedback

When the user sees a draft or reference territory:

Expected:

- primary actions are judgment-first;
- prompt rewriting is not required;
- selected feedback updates the Creation Case;
- materially different steering creates or updates a branch;
- local/pro controls appear only after precision need.

### 14.5 Branch recovery

When the user explores variants:

Expected:

- current champion remains clear;
- 2–4 meaningful alternatives remain comparable;
- previous good direction can be recovered;
- branch labels are human-language judgments;
- mobile provides comparison without hiding it behind a separate history page.

### 14.6 Commit/export

When the user chooses `用这个`:

Expected:

- champion is tied to a use context;
- export is available;
- assumptions/rights/source notes remain visible;
- optional variants do not overwhelm delivery;
- case can be reopened with summary and branch context intact.

## 15. Testing and regression scope for implementation plan

Later implementation tasks should create tests that verify behavior, not only snapshots.

### 15.1 Product contract tests

Add or extend contract tests to assert:

- no raw diagnostics in first surface;
- Creation Case language exists in the intended surface;
- Reference-first, Generate-first, and Ask-first route states are represented;
- mobile affordances for comparison exist;
- migrated UI does not introduce new handcrafted semantic CSS families in scoped files.

### 15.2 E2E smoke scenarios

Add Playwright coverage for:

- empty stage start;
- sparse taste prompt route;
- clear generation route with mocked or test-safe provider behavior;
- hard blocker route;
- feedback creating/promoting alternatives;
- mobile comparison path;
- commit/export path.

### 15.3 Visual regression targets

Capture key states:

- desktop empty state;
- mobile empty state;
- desktop Reference-first;
- mobile Reference-first;
- desktop Generate-first draft;
- mobile Generate-first draft;
- Ask-first blocker;
- champion + comparison set;
- delivery package.

## 16. Non-goals

This spec does not authorize:

- immediate runtime implementation;
- production deployment or restart;
- preserving current Studio/Gallery/Canvas/Flow names by default;
- deleting current modules before an implementation plan exists;
- adding provider-specific behavior;
- exposing private provider route details;
- turning examples into default content;
- building a full asset manager inside commit/export.

## 17. Implementation-plan handoff

The next document should be an implementation plan with bite-sized tasks.

It should decide:

- which current route or new route hosts the first Visual Stage slice;
- what minimal Creation Case state is local/UI-only versus persisted;
- how to test router states without real provider calls;
- which current components can be reused or must be replaced;
- what compatibility bridge is needed for existing task/gallery/canvas data;
- which visual contract tests gate the first slice;
- whether the first implementation slice is prototype-only, feature-flagged, or replaces the current Create Studio entry.

No implementation should begin until that plan explicitly maps files, tests, and verification commands.
