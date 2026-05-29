# Visual Stage Creative Board Master

## Source of truth

- Selected direction: **D · Creative Board**.
- Direction language: **Figma / Miro 式轻快创意板**.
- Product posture: **Board-first Visual Stage**.
- Durable rule: **bright but disciplined** — open, colorful, and exploratory without becoming toy-like or losing professional hierarchy.

## Why this direction

D solves the Visual Stage problem better than a dark control-room theme because the core product job is not parameter control first. It is helping users escape prompt paralysis by making intent, references, alternatives, and judgment visible as a creative board.

The chosen feeling:

- **Mood before settings**: users judge direction before seeing professional depth.
- **Reference Canvas**: references are clustered territories, not a template gallery or single-image imitation target.
- **Champion visible**: the current best option is pinned clearly.
- **Comparison stays nearby**: alternatives remain recoverable on desktop and mobile.
- **Professional not downgraded**: color and playfulness are controlled by hierarchy, spacing, and restrained text density.

## Visual rules

Use these rules for `/visual-stage` and later surfaces that inherit this art direction:

1. Prefer a light, board-like canvas over dark command-center chrome.
2. Treat color as a **VI color system**, not scattered decoration:
   - **deep title tone**: ink blue / plum for titles, primary CTA, selected Champion, and structural emphasis;
   - **mid content tone**: softened teal, amber, lavender, and coral for content blocks and semantic state;
   - **pale ambient tone**: cream, mint wash, blush wash, and lilac wash for page background, hero gradients, and dotted board texture;
   - **controlled contrast accents**: muted cross-color pairings for title/content contrast, never high-saturation neon.
3. Keep hierarchy readable through depth: deep = title/action, mid = content block, pale = background and ambient decoration.
4. Maintain explicit semantic color mapping:
   - teal: reference / ready / growth;
   - amber: assumption / exploration;
   - lavender/plum: champion / depth;
   - coral: blocker / risk / missing anchor.
5. Use **no pure black UI surfaces**. Avoid `bg-black`, `text-black`, black-on-black traps, near-equal foreground/background pairs, and sudden pure-black blocks inside the bright board.
6. Keep surfaces tactile: rounded cards, soft shadows, sticker-like pinned blocks, subtle gradient dots, and enough contrast for mobile reading.
7. Preserve product hierarchy:
   - stage and visual proof first;
   - composer immediately reachable;
   - Creation Case compact;
   - Reference Canvas and Champion + Comparison side-by-side where space allows;
   - Inspection/debug hidden.
8. Keep copy in user language. Avoid provider route, storage key, raw task payload, or debug labels.

## Allowed building blocks

- `components/ui/*` Shadcn-style primitives for buttons, cards, badges, and textareas.
- Tailwind utilities for board material, grid texture, colored pins, and responsive choreography.
- Local Visual Stage helpers only when they encode the selected art direction, e.g. board blobs and pinned note cards.

## Disallowed after D selection

Do not mix competing visual-direction labels into `/visual-stage` implementation:

- Lunar Precision
- Cinema Studio
- Atelier Gallery
- Velvet Suite
- Warm Craft
- Linear / Raycast as a product metaphor

Do not return to:

- dark-only admin dashboard;
- prompt-first form as the hero;
- mode picker before any useful visual feedback;
- template gallery as default start;
- decorative color without information hierarchy.

## Mobile invariants

Mobile must not become a crude stacked desktop:

- the board proof remains visible before deep details;
- composer remains reachable near the first screen;
- Creation Case remains legible in compact cards;
- Reference Canvas and Comparison Set remain available without a separate history page;
- horizontal overflow must stay at zero.

## Regression hooks

`apps/web/product-ui-contract.test.js` locks these markers:

- `D · Creative Board`
- `Figma / Miro 式轻快创意板`
- `Board-first Visual Stage`
- `Mood before settings`
- `Reference Canvas`
- `bright but disciplined`

The contract also rejects competing direction names in `/visual-stage` after the user selected D.
