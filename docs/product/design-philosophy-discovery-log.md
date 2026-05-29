# Image Workbench Design Philosophy Discovery Log

> Working document for the P0.5 visual/product-philosophy reset. This records the conversation and emerging decisions before any redesign implementation.

**Created:** 2026-05-29T03:52:41Z
**Status:** Philosophy accepted; ADR and interaction/visual spec created; implementation plan not started.
**Current scope:** Product philosophy is accepted for handoff. Existing names such as Create Studio, Gallery, Canvas, or any current module boundaries remain provisional implementation artifacts until the implementation plan deliberately maps or replaces them.

## Why this document exists

The previous P0 established technical visual-governance foundations: Tailwind/Shadcn source of truth, reusable product primitives, scoped contract tests, ADR, and deployment. The user rejected the result as an acceptable visual master because it still feels like a beta/MVP/internal tool rather than a mature, refined, design-led product.

This document preserves both outcomes and conversation context so future planning does not collapse back into superficial layout tweaking.

## Confirmed corrections from the user

1. **The current visual master is not good enough.**
   - It may be technically cleaner, but it does not yet meet the bar of a mature, premium, beautifully designed site.
   - A design product must itself demonstrate design credibility.

2. **The next phase must be a first-principles redesign, not a patch.**
   - The redesign must not be constrained by the current page structure, current left/right layout, or current component arrangement.
   - Subpages and submodules should also be free to be rethought later, rather than forced into the current design skeleton.

3. **Desktop and mobile must be designed together.**
   - A desktop layout cannot be treated as the master and mobile as a collapsed afterthought.
   - Example risk: a desktop left/middle/right structure may collapse to mobile top/middle/bottom, causing branding/title copy to consume half the mobile screen and hide the actual creative entry point.
   - The invariant across devices is more important than preserving a literal layout.

4. **The cross-device invariant is currently confirmed as:**
   - Aesthetic proof and creative entry must both remain present.
   - Mobile must not sacrifice either one.

5. **The core problem is not yet layout; it is product/design philosophy.**
   - The project must answer why users use this type of image-generation tool and how they actually use it.
   - Without that answer, visual options such as “hero”, “main visual”, “process preview”, or “lightweight entry” are premature and unclear.

6. **Prompt paralysis is a central product problem.**
   - Many users may find the site beautiful but freeze when asked to write a prompt.
   - Natural-language prompting is easier than old prompt engineering, but users still often do not know what to ask for.

7. **The tool must avoid becoming a prompt lottery / card-draw site.**
   - Simply listing many prompts for users to choose from may create novelty, but it risks shallow “抽卡” behavior with poor long-term retention.

8. **The tool must not overfit beginners.**
   - If the product becomes full of low-end tutorials, beginner scaffolding, or hand-holding, professional designers may lose interest.
   - The product must support users who need guidance without making expert users feel constrained or patronized.

9. **The desired design-philosophy discovery should be analogous to the PPT example.**
   - In the PPT example, the breakthrough logic is not “choose a template”, but whether the deck is “for the client to read” or “for the presenter to speak with”.
   - Image Workbench needs a comparable underlying distinction that guides product behavior, not just a beautiful interface.

10. **The questioning process must be serious and cumulative.**
    - The user wants the grilling process to surface the answer, because they do not yet have the answer fully formed.
    - Both final decisions and the conversation itself should be recorded for later review and context recovery.

11. **Do not anchor the philosophy search on the current architecture.**
    - The assistant incorrectly used existing labels such as Studio, Gallery, and Canvas while claiming to search for first principles.
    - This is backwards: once the product philosophy is found, those labels, modules, routes, and boundaries may all change.
    - During discovery, all current IA and page names must be treated as disposable.

## Process decision under consideration

The user asked whether the next phase should follow:

```text
PRD → ADR → Spec → TDD
```

Working interpretation:

- This process is appropriate, but only if the phases are used correctly.
- PRD should not be a feature list; it should first capture product philosophy, user situations, usage model, and experience principles.
- ADR should record only hard-to-reverse product/design decisions after the philosophy crystallizes.
- Spec should translate the accepted philosophy into information architecture, interaction model, visual system, responsive behavior, states, and acceptance criteria. It must not inherit the current module structure unless that structure survives the philosophy work.
- TDD should start after the spec exists; for UI/product work it should include contract tests, visual/state coverage, responsive/mobile checks, and regression guards. It cannot replace human visual review.

## Current working thesis

Image Workbench should not be defined as “a prompt box that generates images”. That framing causes either prompt paralysis or prompt-lottery behavior.

The product likely needs to frame image generation around a higher-level creative intention. The key unresolved task is to discover the equivalent of the PPT tool’s “for reading vs for presenting” distinction **without assuming the current architecture survives**.

Possible early hypothesis, not yet confirmed:

> Users do not come to an image tool only to “write prompts”. They come with a creative job that changes their state from some kind of visual uncertainty or production need into something usable, judgeable, or communicable. The exact jobs, modules, and product surface are not yet decided.

## Open core question

What is the project’s central usage philosophy — the distinction that explains why a user should use this product instead of a generic prompt box, image playground, template gallery, or professional design suite?

## Conversation update: closer hypothesis

The user said the zero-architecture hypothesis is getting closer to the desired design philosophy:

> This product's core may not be “help users generate images”, but “help users turn vague visual intent into a visual result that can be judged, communicated, and extended.”

This is still not a final decision. The next step is to sharpen which part of that transformation is the product's deepest responsibility: helping the user decide for themselves, helping the user communicate to others, or helping the user execute an already-decided visual task.

## Conversation update: judgment vs direction

The user said both “visual judgment” and “visual direction” make sense, but they imply different audiences:

- Visual judgment feels closer to users who are new to AI image tools or design work.
- Visual direction feels closer to designers or users with some existing visual foundation.

Working correction: do not reduce this to a beginner-vs-designer audience split too early. It may be more accurate to model this as **maturity of visual intent**:

- Low-maturity intent: the user cannot yet judge what they want or what is good.
- Higher-maturity intent: the user already has taste/constraints and needs to form, refine, or extend a direction.

This keeps the philosophy from becoming either a beginner tutorial product or a professional-only tool.

## Conversation update: maze method

The user is not sure whether “help users mature vague visual intent” is correct, but wants to proceed with a maze method:

- Temporarily accept this hypothesis as the current route.
- Walk several logical steps forward from it.
- If the downstream implications become wrong, shallow, or constraining, backtrack and try another route.

Current provisional route:

> The product does not primarily replace design work or merely generate images. It helps users move from vague aesthetic feeling to mature visual intent — something they can judge, express, and continue.

Backtracking signals to watch for:

- If the route turns into beginner tutorials, it is wrong.
- If the route becomes professional-only tooling, it is wrong.
- If the route collapses back into prompt templates or prompt lottery, it is wrong.
- If the route requires preserving current IA/module names, it is wrong.
- If the route cannot explain both desktop and mobile as the same product experience, it is incomplete.

## Conversation update: pre-intent users

Walking the maze exposed a likely problem with the “mature visual intent” route: it still assumes users arrive with a purpose, a task, or at least a visual intention.

The user challenged that in a real environment, many people may arrive in a **pre-intent state**:

- They do not know what this tool can do.
- They do not know what they might want to use it for.
- They are curious about AI image capability, but have not yet translated that curiosity into a concrete purpose.

This means “help users mature visual intent” may be too late in the journey. The product may first need to help users move from:

> “I don’t know what this tool can do for me”

into:

> “I recognize a possible use for myself and can start trying without already knowing a prompt, workflow, or design goal.”

Important correction:

- Do not assume purposeful users.
- Do not assume the user already has a creative job.
- Do not assume prompt paralysis only happens after intent exists; the deeper paralysis may be that the user has not yet formed a reason to prompt at all.

New provisional route to explore:

> The product’s first responsibility may be to convert curiosity into situated intent: show users what AI image work can become in their own context, without reducing the experience to templates, tutorials, or prompt lottery.

Backtracking signals for this new route:

- If it becomes a generic capability showcase, it is too shallow.
- If it becomes “pick a use case card”, it risks prompt lottery under another name.
- If it only serves beginners, it is too narrow.
- If it cannot later support mature visual work, it is a dead end.

## Conversation update: simple vs professional surfaces

The user returned to the earlier pair of “visual judgment” and “visual direction” and proposed a practical split:

1. Users who do not understand design should get a simple page/basic capability surface. They may only want simple image generation or editing, but the product should not stop at literal commands such as “change apple to strawberry”. Through proactive guidance and requirement collection, it should help them produce work that meets or exceeds expectations — effectively processing fuzzy needs into a strong prompt or generation plan.
2. Users who understand design should get professional tools. The user asked whether the currently more professional forms are canvas and flow.

Working refinement:

- Treat this less as fixed user identities (“beginner” vs “designer”) and more as two **interaction contracts**:
  - **Guided outcome contract**: the user delegates visual judgment/translation to the product. The product actively asks, clarifies, interprets, and produces a strong result.
  - **Controlled direction contract**: the user keeps authorship/control and needs professional surfaces for structure, iteration, constraints, references, relationships, and repeatability.
- This may be closer to the product’s design philosophy than the earlier “mature visual intent” framing, because it explains both pre-intent/casual users and professional users without forcing one group to use the other group’s interface.
- Canvas and flow are likely strong candidates for the professional contract, but they are not the philosophy itself. Professional means controllability, composability, inspectability, consistency, and repeatability; canvas/flow are only possible embodiments.

Candidate philosophical phrasing to test:

> The product has two modes of authorship: for people who cannot yet direct the image, it acts as an active visual interpreter; for people who can direct the image, it becomes a controllable visual operating surface.

## Conversation update: one surface vs two surfaces

The user originally imagined two pages, similar to the current studio/canvas split. They would prefer one form with different depth, but only if a more accurate form can cover both needs without internal fracture. If a single page merely splices two needs together, it is worse than separating them.

Working refinement:

- “One product” does not necessarily mean “one page”.
- The real requirement is not unified routing, but unified conceptual object and progression.
- A single page is only justified if the user can naturally move from guided outcome to controlled direction without feeling that two unrelated products have been glued together.
- Two surfaces are acceptable if they share the same underlying creation object, state, provenance, and continuation path.

Candidate test:

> The split should not be “simple page vs professional page” as two products. It should be “same creative object, two manipulation depths”: guided mode interprets needs into an editable creation object; professional mode exposes the object’s structure, dependencies, references, variants, and controls.

Backtracking signals:

- If one surface has to hide too much professional structure, it becomes a toy.
- If one surface exposes too much structure too early, it overwhelms casual users.
- If two surfaces cannot pass work between them losslessly, the product is internally split.
- If a guided result cannot become a professional object, beginners hit a ceiling.
- If a professional workflow cannot start from guided interpretation, experts lose acceleration.

## Conversation update: creation object accepted as current route

The user accepted the “creation object / 创作案” route as the next maze path.

Working definition:

> The durable object of the product is not merely an image, a prompt, or a parameter set. It is a creation object that can hold the user’s request, clarified brief, generation/editing intent, references, outputs, variants, choices, constraints, and continuation structure.

Implication:

- Guided mode should create and refine this object without exposing all structure.
- Professional mode should open the same object for direct control.
- The bridge between simple and professional experiences is not page layout; it is lossless continuation of the same creation object.

Next risk to test:

- If the creation object becomes too heavy, it will make simple generation feel bureaucratic.
- If it is too thin, it cannot support professional continuation.
- The object needs a progressive shape: invisible/lightweight at first, structured when needed.

## Conversation update: lightweight exposure accepted

The user accepted the recommended route that a new user's first creation should **lightly expose** the creation object, rather than hiding it completely or exposing the full professional structure immediately.

Working principle:

> The product should not present a blank prompt box. It should show that the system is helping the user form a creation object through a small number of understandable modules — e.g. purpose, subject, style/tone, usage context, references, and constraints — while keeping advanced structure optional.

Implications:

- The beginner-facing experience is not a low-end mode; it is the front door into the same creation object.
- The product should make users feel “the system is understanding and organizing my intent,” not “I am filling a form.”
- Professional depth should be available by expanding/opening the object, not by starting from a separate unrelated workspace.
- The visible structure must stay small enough to avoid bureaucracy and rich enough to prove the product has intelligence and depth.

Next risk to test:

- If the lightweight modules become a template form, the experience becomes rigid.
- If the modules are too invisible, users fall back into prompt paralysis.
- If the modules do not map to professional controls later, the bridge breaks.

## Conversation update: fixed skeleton + dynamic guidance accepted

The user accepted option C:

> The creation object should have a fixed underlying skeleton, but the visible beginner-facing experience should use dynamic guidance rather than a static field form.

Working principle:

- The skeleton must be stable enough to support professional control, persistence, provenance, and later expansion.
- The frontstage must be adaptive enough to feel like active interpretation, not form-filling.
- The product should decide which questions, chips, previews, and confirmations matter based on the user's current input and creation state.

Provisional skeleton dimensions to test later:

- Goal / use context: what the image is for and who will see it.
- Subject / content: what should exist in the image.
- Aesthetic direction: mood, style, taste, references, visual language.
- Constraints: size, brand, platform, forbidden elements, consistency needs.
- Source material: uploaded images, examples, previous outputs.
- Outputs and variants: generated results, selections, rejected directions.
- Continuation structure: edits, branches, dependencies, reusable style rules.

Backtracking signals:

- If the skeleton becomes visible as a rigid questionnaire, it is wrong.
- If dynamic guidance cannot populate the skeleton reliably, it is too magical.
- If professional controls do not map back to the same skeleton, the unified-object idea fails.

## Conversation update: draft-first guidance accepted

The user accepted option C for vague user requests:

> The product should not force the user to fully specify requirements before creating. It should turn a vague request into a visible draft or direction first, then use that draft to help the user judge, clarify, and continue.

Working principle:

- The product should be **draft-first, not questionnaire-first**.
- Generation is not just final output; it is also a discovery instrument.
- The system can produce an initial direction while simultaneously exposing missing decisions as lightweight suggestions or next-step questions.
- The core loop becomes: vague request → interpreted creation object → visible draft/directions → user reacts → object becomes sharper → continue or open deeper controls.

Implications:

- For beginners, the product lowers the cost of intent formation: they can react to something visible instead of inventing a full prompt.
- For professionals, the first draft can become a starting node/object rather than a throwaway result.
- Prompt construction becomes internal craft; the user-facing experience is judging and steering a creation object.

Backtracking signals:

- If draft-first produces random low-quality guesses, it becomes prompt lottery.
- If the system asks too many questions before showing anything, it becomes a form.
- If user reactions cannot update the creation object, the loop becomes shallow.

## Conversation update: one draft + controlled branches accepted

The user accepted the recommended first-round pattern:

> For a vague request, the product should present one strong default draft/direction plus a small number of controlled branch options, rather than only one opaque result or many random choices.

Working principle:

- The first draft proves competence and gives the user something concrete to react to.
- Branches preserve direction-setting without turning the product into prompt lottery.
- Branches should be meaningful steering choices, not decorative variants.
- The product should explain the draft and branches in user-level creative language, not raw prompt/parameter language.

Example pattern:

> “I made a premium minimalist product direction. You can keep this, or push it toward: colder tech, warmer lifestyle, or more dramatic luxury.”

Implications:

- The system initially owns enough visual judgment to avoid blank-page paralysis.
- The user regains control by reacting to visible work and choosing branch pressure.
- Professional controls can later expose these branches as editable alternatives, nodes, variants, or constraints inside the same creation object.

Backtracking signals:

- If branches feel like random style cards, it is prompt lottery.
- If the default draft is weak, the whole experience loses trust.
- If branch choices cannot be applied structurally to the creation object, they are just UI decoration.

## Conversation update: progressive feedback depth accepted

The user accepted that feedback should support multiple depths, but should expose them progressively:

> Default feedback should be natural language plus a small number of direction-pressure controls. Local edits and professional controls should be available as deeper actions, not as first-screen burden.

Working principle:

- First-level feedback: natural-language steering such as “more premium”, “less cold”, “closer to Apple-like restraint”.
- Second-level feedback: lightweight direction controls/chips/sliders that express visual pressure, not raw parameters.
- Third-level feedback: local image edits, reference constraints, branch editing, node/flow/canvas-style professional control.
- All feedback updates the same creation object instead of creating disconnected revisions.

Implications:

- Beginners can continue by reacting in plain language.
- Intermediate users can steer without learning prompt grammar.
- Professional users can open the structure when they need precision.
- The product can unify simple and professional modes through progressive disclosure rather than separate mental models.

Backtracking signals:

- If direction controls feel generic or decorative, they do not add real control.
- If natural-language feedback is not reflected in visible object changes, trust fails.
- If local/pro controls are not connected to the same object state, the product fractures.

## Conversation update: canvas-first professional depth accepted

The user agreed with the recommended professional-control direction:

> Professional depth should be canvas-first, with flow/generation logic available behind or beneath the visual surface rather than as the default mental model.

Working principle:

- Image creation is primarily visual judgment and visual manipulation, not process engineering.
- Canvas is the natural professional surface for seeing, comparing, arranging, annotating, editing, and extending visual objects.
- Flow is still important, but should represent provenance, dependencies, repeatability, and automation behind the visual work.
- A designer-facing professional mode should feel like a creative desk or visual operating surface, not an engineering node editor.

Implications:

- The professional surface should foreground visual objects, relationships, variants, references, and local edits.
- Flow should be accessible as trace/history/advanced structure, or revealed when the user needs repeatability and automation.
- The same creation object should be readable in both ways: as a visual canvas and as an underlying generation graph.

Backtracking signals:

- If canvas becomes only a moodboard without process control, it is too shallow.
- If flow becomes the primary UI, the product may feel engineering-first rather than design-first.
- If canvas and flow do not share the same object/provenance model, the system fractures.

## Conversation update: unified creative space chosen

After several rounds of grilling, the user chose the product-shape route:

> A unified creative space.

Rationale:

- Asking users upfront to choose between “help me do it” and “I want control” is unnecessary and exposes internal product logic.
- Beginners may not understand what those choices mean.
- Professional designers would be forced to make an extra routing decision before working.
- A single entry that later splits into two modes and then tries to reunify may be harder and more awkward than pursuing unity from the start.

Working principle:

> The product should not ask users to self-classify as beginner/professional or guided/controlled. It should provide one creative space whose depth changes progressively based on the user's actions, object state, and need for control.

Implications:

- The first screen/entry must feel immediately usable without asking the user to pick a mode.
- Guided interpretation and professional control must coexist as progressive layers of the same space, not as separate products or front-door choices.
- The system should infer when to guide, when to expose structure, and when to offer deeper control.
- Professional depth should be reachable without forcing a mode switch that feels like leaving the current work.
- The unified space must avoid becoming a crude collage of simple chat/input plus complex canvas tools.

Backtracking signals:

- If the unified space feels like two products glued together, split surfaces may be better.
- If beginners see too much structure too early, unity has failed.
- If professionals cannot access control quickly, unity has failed.
- If the page needs a “simple/pro” mode toggle to make sense, the conceptual unity is not strong enough.

## Conversation update: visual stage accepted

The user accepted the recommended first-screen/product-surface mindshare:

> The unified creative space should be organized as a Visual Stage / generation stage: not a chat bot, not a pure canvas, but a visually centered creation stage where input, guidance, branches, feedback, and deep controls orbit the emerging result.

Working principle:

- The visual result/draft is the center of gravity.
- Human-language input is a starting and feedback mechanism, not the whole product identity.
- System guidance appears around the work as interpretation, missing decisions, branch pressure, and next moves.
- Professional controls progressively unfold from the stage into canvas-like manipulation and flow/provenance when needed.
- The first screen must communicate immediate action, aesthetic credibility, and future controllability at the same time.

Backtracking signals:

- If it feels like a chat UI with image attachments, it is wrong.
- If it feels like a blank professional canvas before the user has work, it is too intimidating.
- If it feels like a passive preview/result page, it is too shallow.
- If controls compete with the visual result instead of orbiting it, the stage metaphor fails.

## Conversation update: live example creation case accepted

The user accepted the recommended empty-state answer:

> When there is no generated work yet, the Visual Stage should not be blank, a marketing showcase, or a bare prompt box. It should show a live example creation case: an aesthetic, editable, takeover-ready creation object that demonstrates what the product does while letting the user replace or modify it immediately.

Working principle:

- The empty state is not an empty canvas; it is a rehearsable stage.
- The example is not a static gallery piece; it is an active creation case with visible intent, system interpretation, branch hints, and next actions.
- The user should feel: “I can take over this structure without knowing prompt craft.”
- The first screen should make the product self-explanatory by showing the workflow in miniature, not by explaining it in copy.

Backtracking signals:

- If it reads as a template gallery, it is too passive.
- If it reads as a homepage hero/showcase, it is too external to the work.
- If it reads as a prompt form with decoration, it has regressed to prompt-first.
- If users cannot tell how to replace the example with their own case, the live example failed.

## Conversation update: first-five-second proof accepted

The user accepted the recommended first-five-second priority:

> The live example creation case should first prove: “I can take over a high-quality creative process without knowing how to write prompts.”

Priority order:

1. Takeover confidence: the user sees how to make the example become their own case.
2. Aesthetic quality: the result must look premium enough to earn attention.
3. Interpretation trust: the system shows it can translate fuzzy needs into visual direction.
4. Professional depth: deeper control is hinted as future capability, not foregrounded.

Working principle:

- Aesthetic quality attracts attention, but takeover confidence creates action.
- The product must not merely impress users with output; it must lower the cost of entering the creative process.
- “No prompt craft required” is not a slogan; the visible interaction must prove it.

Backtracking signals:

- If users admire the example but do not know how to begin, the screen has failed.
- If the first action still feels like writing a prompt from scratch, the screen has failed.
- If professional controls dominate before takeover, the screen has failed.

## Conversation update: optional examples instead of default live example

The user accepted the correction to the prior empty-state hypothesis:

> The first screen should not preload a full live example as the center of attention. Default should be the user's own Visual Stage, with lightweight scaffolding. Examples may exist, but only as optional, low-weight learning aids.

Working principle:

- Default state: a user-owned Visual Stage with a clear creation starting point and lightweight scaffolding.
- Examples: opt-in, low-weight, selected only when the user wants to learn by trying.
- Example set: only worthwhile if each case demonstrates a genuinely different capability or workflow, not just different aesthetics.
- Teaching role: examples support exploration, but are not the main dish.
- The default stage should feel like the user's project waiting to happen, not a lesson waiting to be taken.

Backtracking signals:

- If users get pulled into browsing examples instead of creating, examples are too strong.
- If the default state feels empty/intimidating without examples, scaffolding is too weak.
- If examples repeat the same workflow with different visuals, they become decoration.
- If the product cannot communicate value without examples, the core stage concept is underpowered.

## Conversation update: professionals and curiosity principle accepted

The user introduced and accepted a project-level philosophy direction. The initial draft was:

> “把专业交给专业，将兴趣育成兴趣。”

Clarified meaning:

- “专业交给专业”: professional designers should get serious professional tools rather than a toy interface.
- “兴趣育成兴趣”: curious users should be guided and assisted without having their curiosity killed by dry process, intimidating terminology, blank-canvas anxiety, or forced professionalization.

Accepted working interpretation:

> Professionals should not be downgraded. Curious users should not be discouraged. Interest should grow primarily into creative confidence and visual judgment, not mandatory professional skill.

Sharper internal principle, not final marketing copy:

> 专业不降级，兴趣不劝退。

Possible public-facing direction, still draft:

> 给专业以深度，给兴趣以通路。

Working principle:

- Professionals should not be patronized by beginner-only simplification.
- Curious users should not be punished by jargon, blank-canvas anxiety, or tedious setup.
- Guidance should feel like assistance in the flow of making, not a course, wizard, or checklist.
- The product should let interest survive first, then let creative confidence and visual judgment grow from use.
- Professional skill can be an optional path, but the main promise is that users keep wanting to create and gradually know how to judge, revise, and express visual intent.

Backtracking signals:

- If the product makes professionals feel constrained, “专业交给专业” failed.
- If the product makes curious users feel they must learn design vocabulary before playing, “兴趣” was killed.
- If guidance feels like homework, the product has confused nurturing interest with teaching a curriculum.
- If curiosity never develops into better judgment or control, the product is only entertainment.

## Conversation update: visual judgment through comparison accepted

The user accepted the mechanism for growing visual judgment:

> Visual judgment should grow mainly through meaningful result comparison, with free exploration underneath. The system should not teach abstract terminology first and should not score the user like homework.

Working principle:

- Use real outputs and near-output drafts as the learning surface.
- Show meaningful visual alternatives, not random variants.
- Explain differences in plain language: calmer, more commercial, more cinematic, more suitable for avatar/poster/product image, etc.
- Let users make small judgments repeatedly: “I prefer this because…”
- Keep free experimentation available so judgment grows from play, not compliance.

Backtracking signals:

- If comparison becomes a quiz or grading system, it kills curiosity.
- If alternatives differ only superficially, users do not learn judgment.
- If the system uses design jargon before the user needs it, it becomes a lesson.
- If exploration is too constrained, interest turns into form-filling.

## Direction correction: return to creation-space refactor

The user flagged that the conversation drifted too far into brand philosophy/copy and should return to the creation-space refactor.

Working rule:

- Keep “专业不降级，兴趣不劝退” as a background product principle, not the active discussion branch.
- Do not continue polishing slogans or brand copy now.
- Resume the creation-space decision tree needed for the project refactor.
- The next decisions must reduce ambiguity for the actual first-screen / creative-space rebuild.

## Conversation update: default creative-space minimum accepted

The user accepted the default first-screen minimum structure for the creation-space refactor:

> When examples are not loaded by default, the first screen should be a user-owned empty-but-actionable Visual Stage: one plain-language creation entry, lightweight intent scaffolds, and a visible but secondary path to optional examples.

Working principle:

- The stage should feel ready for the user's work, not ready to teach a lesson.
- The primary action belongs to the user’s own creation, not to a sample case.
- Lightweight scaffolds may clarify use, reference, or style, but must remain optional.
- The optional example path exists for users who want to learn by trying, but it must not compete with the main creation flow.

Backtracking signals:

- If the first screen feels like a blank canvas, the scaffolding is too weak.
- If it feels like a tutorial, example gallery, or showcase, examples are too strong.
- If the user must fill a form before starting, the scaffolding has become friction.
- If the main entry still feels like a raw prompt box, the creation-case framing is not strong enough.

## Open challenge: under-specified first intent

The user accepted the draft-first direction but challenged a concrete edge case:

> If the user only says “做一张高级一点的头像”, the information is extremely sparse. How can the system immediately generate a useful image?

Evaluation:

> This does not overturn draft-first. It refines it: the system should immediately create a creation-case draft, but image generation is conditional on whether the missing information is safe to assume or truly blocks generation.

Working principle:

- The system may assume reversible aesthetic defaults: square format, premium/clean direction, neutral background, social avatar use.
- The system should not silently invent identity-critical content: whose avatar, based on which photo, real likeness vs fictional character, personal vs brand.
- If a missing choice blocks meaningful generation, ask exactly one unblocker, not a questionnaire.
- The first response should still feel like progress: show the interpreted creation case and the single missing decision.
- “Start first visual draft” means start when enough information exists or after one critical unblocker, not hallucinate arbitrary content.

Example for “做一张高级一点的头像”:

> 我理解你要：1:1 高级头像、社交平台可用、克制质感、主体清晰。还差一个关键决定：头像主体是谁？上传照片 / 虚构角色 / 品牌字母或符号 / 抽象头像。

Backtracking signals:

- If the system invents a person when the user likely wanted their own avatar, trust breaks.
- If the system asks five setup questions, curiosity dies.
- If the system refuses to proceed because input is sparse, prompt paralysis returns.
- If assumptions are hidden, users cannot correct the direction.

## Open challenge: sparse intents may need reference-first, not image-generation-first

The user proposed a different resolution for sparse or ambiguous first intents:

> Many users know what looks good when they see it, but cannot express it precisely. Instead of randomly generating drafts, the system could quickly search and show many relevant reference images, helping users point to directions. Designers often use existing cases, moodboards, or reference boards to help clients speak concretely. The line between borrowing and copying must be clear.

Evaluation:

> This is a strong correction. It does not overturn the creation-case draft. It changes what the first visible output can be: sometimes the first draft should be a reference/moodboard draft rather than a generated image draft.

Professional grounding:

- Moodboards/reference boards are a common design communication tool for aligning visual direction before expensive execution.
- They are useful because clients often cannot translate words like “modern”, “premium”, or “sleek” into shared visual meaning.
- They reduce revision cost because visual direction can be changed before finished work is produced.
- They must be used for direction extraction, not copying finished work.

Working principle:

- Creation-case draft always happens first.
- Generated image draft is not always the first visual artifact.
- For sparse, taste-heavy, or latency-sensitive prompts, the first visual artifact can be a reference board: searched images clustered by direction, with plain-language labels and source/rights awareness.
- Reference board is not a gallery; it is a decision surface for “which direction feels right?”
- After the user picks or rejects references, generation becomes better grounded and less random.

Possible flow:

1. User says: “做一张高级一点的头像.”
2. System drafts the creation case and detects missing subject/source.
3. System immediately shows reference directions for “高级头像” while asking the single unblocker: subject/source.
4. User picks visual direction and provides/chooses subject.
5. System generates the first image draft.

Backtracking signals:

- If reference search becomes browsing Pinterest instead of progressing the user’s creation, it is too distracting.
- If references encourage copying composition/style too directly, it is ethically and legally risky.
- If the system shows dozens of unclustered images, it creates visual noise instead of judgment.
- If reference-first delays generation even when the user has provided enough information, it becomes friction.

## Conversation update: first-visual-artifact router accepted

The user accepted the routing rule for the first visual artifact:

> After a rough intent, the system should not always generate an image. It should route between reference board, generated draft, and one unblocker question.

Accepted routing rule:

- Reference-first when the prompt is sparse, taste-heavy, or full of vague adjectives like 高级/好看/有质感.
- Generate-first when subject, purpose, and visual direction are sufficiently specified.
- Ask-first only when missing information would force the system to invent identity, brand, likeness, IP, or legally sensitive material.
- Creation-case draft still happens first or in parallel so the user sees how the system understood the request.

Working principle:

- First visual feedback should reduce uncertainty fastest, not blindly produce pixels.
- Reference-first is a speed and alignment tool, not a browsing feature.
- Generate-first is right only when the system has enough intent to avoid random output.
- Ask-first should be rare and limited to one critical unblocker.

Backtracking signals:

- If every prompt goes to references, creation feels delayed.
- If every prompt goes to generation, sparse prompts become random抽卡.
- If ask-first becomes a setup wizard, prompt paralysis returns.
- If the router is invisible, users may not understand why the product chose reference/search vs generation.

## Conversation update: reference board shape accepted

The user accepted the reference-board shape:

> Reference-first should show 3–5 curated visual territories, each with a small image cluster, plain-language label, and “why this matches your intent.” The user chooses a direction or marks likes/dislikes; the product should not encourage copying a single image. Keep “skip references, generate now” visible.

Accepted reference-board structure:

- 3–5 visual territories, not a waterfall gallery.
- Each territory contains a small cluster of images, not one canonical image to copy.
- Each territory has a plain-language label and a short reason why it matches the user's intent.
- First action is choosing or rejecting a direction, not writing a better prompt.
- Keep a visible escape hatch: skip references and generate now.

Working principles:

- The reference board is a decision surface, not a browsing feed.
- It turns vague taste words into visual constraints the system can generate from.
- It should grow user judgment by comparison, not by teaching design jargon.
- It should preserve creation momentum: reference-first must feel like progress toward a draft.
- Professional depth can exist behind each territory through source, constraint, and style inspection, but it should not dominate the first interaction.

Backtracking signals:

- If users browse many images without advancing the creation case, the board is too much like a gallery.
- If users try to copy one image, the board is too single-image-centered.
- If labels require design vocabulary, it violates “兴趣不劝退.”
- If professionals cannot inspect or override the derived constraints, it violates “专业不降级.”
- If the board hides the generate path, it reintroduces prompt paralysis in another form.

## Conversation update: generate-first threshold accepted

The user accepted the generate-first threshold:

> Generate-first requires at least 3 of 4 anchors: subject/source, use context, audience or recipient, visual direction/reference. It must also have no hard blocker: identity, brand, IP, 真人肖像/相似度, or required user-owned material. If only vague taste adjectives are present, route to reference-first. If exactly one soft anchor is missing but inferable, generate with visible assumption chips and one-click correction.

Accepted generate-first rule:

- Direct generation needs at least 3 of these 4 anchors:
  1. subject/source;
  2. use context;
  3. audience/recipient;
  4. visual direction/reference.
- Direct generation is forbidden when a hard blocker is present: identity, brand, IP, real-person likeness, required user-owned material, or legally sensitive missing fact.
- Taste-only prompts route to reference-first.
- One missing soft anchor can be inferred only if the assumption is visible and easy to correct.

Working principles:

- Generation should feel decisive, not random.
- The threshold protects users from抽卡 while preserving speed for clear intents.
- Assumption chips are part of the creation case, not hidden prompt engineering.
- Hard blockers are about facts the system must not invent; soft gaps are about defaults the user can override.

Backtracking signals:

- If users frequently say “这不是我要的” because hidden assumptions were wrong, assumption visibility is insufficient.
- If clear prompts still route to references, the 3/4 threshold is too conservative.
- If vague prompts still route to generation, the router is too eager.
- If hard blockers are treated as soft assumptions, the product risks identity/IP/brand misuse.
- If assumption chips become a long form, the product recreates prompt paralysis.

## Conversation update: ask-first shape accepted

The user accepted the ask-first shape:

> Ask-first is not a modal or questionnaire. Keep the Visual Stage alive: show the creation-case draft and, when safe, reference territories; block only the unsafe generation action. The question appears as one unblocker card attached to the missing anchor, with concrete actions such as upload素材 / choose主体 / confirm brand-right / use generic placeholder. Once resolved, generation continues immediately.

Accepted ask-first rule:

- Ask-first does not blank or pause the Visual Stage.
- It does not become a modal, form, or setup wizard.
- The creation-case draft remains visible.
- Safe reference directions may still be shown.
- Only the unsafe generation action is blocked.
- The question is one unblocker card attached to the missing anchor.
- The card offers concrete actions, not an open-ended writing task.
- Once resolved, generation continues immediately.

Working principles:

- Ask-first exists only to prevent the system from inventing hard facts.
- The user should still feel inside the creation flow, not ejected into setup.
- A blocker should narrow action, not increase cognitive load.
- Reference-first and ask-first can coexist when references are safe but generation is unsafe.
- The product should preserve momentum even when it must ask.

Backtracking signals:

- If ask-first feels like a form or wizard, prompt paralysis has returned.
- If the stage becomes blank while waiting for an answer, creation momentum is broken.
- If the question asks for prose when a choice/upload/confirmation would do, the interaction is too heavy.
- If unsafe generation remains available, the blocker is not doing its job.
- If safe reference work is blocked unnecessarily, ask-first is too conservative.

## Conversation update: creation-case draft minimal structure accepted

The user accepted the lightweight creation-case draft structure:

> Keep the first creation-case draft compact: 1-line intent summary, 4 anchor chips with known/assumed/missing states, router explanation (“先看参考方向 / 直接生成 / 需要一个关键信息”), and the next primary action. Hide long prompt, parameters, and professional controls behind inspection. The draft should make the system legible without becoming a document editor.

Accepted minimal structure:

- One-line intent summary: what the system thinks the user wants.
- Four anchor chips: subject/source, use context, audience/recipient, visual direction/reference.
- Each anchor has a visible state: known, assumed, or missing.
- Current router explanation: reference-first, generate-first, or ask-first.
- One next primary action: choose direction, generate, upload material, confirm right/identity, or correct an assumption.
- Long prompt, parameters, model controls, and professional details are inspectable but not first-surface defaults.

Working principles:

- The creation-case draft makes the system legible without turning creation into documentation.
- It exposes assumptions before they become wrong pixels.
- It keeps the user in judgment/action mode, not prompt-writing mode.
- It is the bridge between rough intent and visual feedback.
- Professional users can inspect or override deeper structure, but the first surface stays light.

Backtracking signals:

- If users feel they are editing a brief instead of creating, the draft is too heavy.
- If users cannot see why the product chose reference/generate/ask, the router is too opaque.
- If assumptions are hidden, wrong generations will feel arbitrary.
- If professionals cannot inspect derived prompt/constraints, depth is missing.
- If anchor chips become a long checklist, prompt paralysis returns.

## Conversation update: first feedback loop accepted

The user accepted the first feedback loop:

> Feedback should start from judgment, not prompt rewriting. First-level actions are choose/keep/reject direction, “more like this / less like this,” and a few plain-language steering chips such as 更克制/更大胆/更真实/更商业/更有设计感. Local edits and professional controls appear progressively after the user points at a result or asks for precision. Every feedback action updates the creation case and creates a traceable branch, instead of becoming an invisible prompt mutation.

Accepted first-feedback rule:

- The first feedback layer is judgment, not prompt rewriting.
- Primary actions are choose, keep, reject, more like this, and less like this.
- Plain-language steering chips are allowed: 更克制, 更大胆, 更真实, 更商业, 更有设计感.
- Local edits appear after the user points at a result or area.
- Professional controls appear after the user asks for precision or expands inspection.
- Every feedback action updates the creation case.
- Every significant feedback action creates a traceable branch rather than hidden prompt mutation.

Working principles:

- The product helps users form visual judgment before demanding prompt craft.
- Feedback should feel like steering a creative direction, not editing model internals.
- Prompt text is an inspectable artifact, not the primary interaction.
- Branches preserve learning and reversibility.
- Progressive control lets professionals go deep without forcing beginners into jargon.

Backtracking signals:

- If users keep rewriting prompts as the main path, the feedback surface failed.
- If steering chips feel generic or decorative, they are not grounded enough in the creation case.
- If feedback mutates prompts invisibly, users lose trust and cannot learn.
- If local/pro controls show too early, the first loop becomes intimidating.
- If local/pro controls are too hidden, professional depth is missing.

## Conversation update: branch exposure accepted

The user accepted the branch exposure rule:

> Use “current champion + small comparison set” as the invariant. The stage centers one active draft/direction; nearby are 2–4 pinned alternatives or recent meaningful branches labeled by user intent, e.g. 更克制版 / 商业感增强 / 不要霓虹. Full branch history, prompt diffs, and parameter lineage are inspectable in advanced view, not first surface. Mobile keeps the same invariant as a swipeable compare set, not a downgraded hidden history.

Accepted branch exposure rule:

- The first surface shows one current champion draft/direction.
- It also keeps a small comparison set: 2–4 pinned alternatives or recent meaningful branches.
- Branches are labeled by user intent, not technical diff language.
- Full tree history, prompt diffs, and parameter lineage live in advanced inspection.
- Mobile preserves the same invariant through swipeable comparison rather than hiding history.

Working principles:

- Users need comparison and reversibility, not a visible Git tree.
- A branch exists to preserve judgment, not to expose model mechanics.
- The active draft gives focus; the comparison set protects against tunnel vision.
- Cross-device unity means mobile keeps the same decision structure, even if the layout changes.
- Professional lineage remains available without burdening the first surface.

Backtracking signals:

- If users cannot recover a previous good direction, branch visibility is too weak.
- If users spend time managing branches instead of creating, branch visibility is too strong.
- If labels are technical rather than intention-based, the history will not help judgment.
- If mobile hides comparisons behind menus, mobile becomes a downgraded experience.
- If professionals cannot inspect lineage, the system lacks trustworthy depth.

## Conversation update: completion/commit moment accepted

The user accepted the completion rule:

> Completion is not “the model produced an image.” A creation case becomes ready when the user commits a champion for a specific use context. The product should package: selected visual asset, 2–3 optional variants if useful, visible assumptions/rights/source notes, and the creation-case summary that explains why this direction was chosen. Primary actions become 用这个 / 导出 / 继续做变体. The case stays reopenable for future iteration, but the first delivery surface should not become asset management.

Accepted completion rule:

- A generated image is not automatically a completed creation case.
- Completion happens when the user commits a current champion for a specific use context.
- The delivery package contains the selected visual asset.
- It may include 2–3 useful variants, but not a full asset-management surface.
- It keeps assumptions, source/rights notes, and relevant constraints visible.
- It includes a compact creation-case summary explaining why the direction was chosen.
- Primary actions are 用这个, 导出, or 继续做变体.
- The case remains reopenable for future iteration.

Working principles:

- The product guides toward usable creative commitment, not endless generation.
- A result becomes meaningful through its use context.
- Completion should preserve enough reasoning to support trust, reuse, and future iteration.
- Delivery should stay lightweight; asset management is not the first-surface goal.
- “Continue variants” remains available, but it should not undermine the sense of completion.

Backtracking signals:

- If users think every generated image is equally “done,” the product has not guided commitment.
- If delivery hides assumptions/rights/source notes, risk is transferred to the user silently.
- If export becomes asset management, the first delivery surface is too heavy.
- If reopening a case loses reasoning and branches, the creation case is not durable enough.
- If users keep generating because there is no clear commit action, completion is too weak.

## Conversation update: product-philosophy PRD authorized

The user confirmed the transition from discovery grilling into a product-philosophy PRD.

> Stop expanding abstract philosophy now and write a product-philosophy PRD that is still architecture-light: define the user-state transformation, creation-case lifecycle, first-screen invariants, first-visual-feedback router, progressive control model, branch/commit loop, and explicit non-goals. Do not specify final layout, current route names, or implementation modules yet.

Created document:

- `docs/product/visual-stage-product-philosophy-prd.md`

Working principles:

- The PRD freezes product philosophy enough to guide the next redesign/refactor stage.
- It remains architecture-light and does not preserve current module boundaries by default.
- It translates the maze decisions into an actionable product contract without jumping into layout, ADR, spec, or TDD prematurely.

Backtracking signals:

- If the PRD starts specifying final layout, route names, or current modules, it is too implementation-heavy.
- If the PRD is too abstract to guide first-screen and routing decisions, it has not done its job.
- If the PRD reopens already accepted maze branches without new evidence, it is delaying delivery.
- If future spec cannot derive acceptance criteria from the PRD, the PRD needs tightening.

## Conversation update: ADR and interaction/visual spec created

After the PRD was accepted for handoff, the user confirmed the recommended ADR path and then asked to continue into spec.

Created documents:

- `docs/adr/0002-unified-visual-stage-creation-case-routing.md`
- `docs/product/visual-stage-interaction-visual-spec.md`

Decisions now frozen for implementation planning:

- Unified creative space has priority over current module boundaries.
- Visual Stage is the first-screen product model.
- Creation Case is the durable creative object.
- Reference-first, Generate-first, and Ask-first are explicit first-response route states.
- Judgment-first feedback and champion + comparison set are required interaction models.
- PC and mobile must preserve the same decision structure rather than treating mobile as a collapsed desktop layout.

Backtracking signals for the next phase:

- If the implementation plan simply renovates the current Create Studio layout, it is ignoring ADR 0002.
- If it starts coding before mapping route states, case state, tests, and compatibility bridges, it is premature.
- If mobile hides comparison/history behind deep navigation, the spec has been violated.
- If prompt text or raw task/provider diagnostics return to the primary surface, the product has regressed.

## Next implementation-planning direction

Write an implementation plan before runtime changes. The plan should map the accepted product model to concrete files, tests, feature flags/prototype boundaries, and verification commands.

Candidate next question:

> 第一实现切片应该是 feature-flagged Visual Stage prototype，还是直接替换现有 Create Studio entry？

Recommended default to challenge:

> Start with a feature-flagged or route-isolated Visual Stage slice that proves Creation Case draft, router states, PC/mobile choreography, judgment-first feedback, and comparison behavior without breaking the deployed Create Studio path. Replace the main entry only after product and visual review.

## Non-goals until implementation plan is accepted

- Do not implement a new visual layout yet.
- Do not continue any current-module migration yet.
- Do not assume Studio/Gallery/Canvas, route names, or current module boundaries survive.
- Do not choose a hero/preview/card layout as if it were the core answer.
- Do not write a final ADR before the design philosophy is actually decided.
- Do not treat TDD/contract tests as proof that the design is visually excellent.
