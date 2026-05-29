# Visual Stage Creative Board Master

## Source of truth

- Selected direction: **D · Creative Board**.
- Approved art system: **Warm Editorial Board / 温润编辑式创作板**.
- Product posture: **Board-first Visual Stage**.
- Durable rule: **温润纸面创作板** — professional order first, gentle creative warmth second.
- Color ratio: **70% Paper / 20% Ink / 7% Coral / 3% Sage**.

## Why this refinement

D was selected because Visual Stage must solve prompt paralysis through visible intent, references, alternatives, and judgment. The first colorful Creative Board pass still felt messy because color acted as decoration. The approved refinement changes the metaphor from a loose multicolor sticky wall to a designer's morning worktable: warm paper, clear ink, restrained coral action, and sage reference confidence.

The chosen feeling:

- **Mood before settings**: users judge direction before professional controls become important.
- **Reference Canvas**: references are clustered territories, not a template gallery or one-image imitation target.
- **Champion visible**: the current best option is pinned clearly and visually calmer than the surrounding exploration.
- **Comparison stays nearby**: alternatives remain recoverable on desktop and mobile without becoming a rainbow of cards.
- **Professional not downgraded**: playfulness comes from paper material, layout rhythm, and one restrained accent family.

## VI color system

The Warm Editorial Board palette has semantic ownership. Do not add new families unless this document is revised first.

### Paper — surface and atmosphere

- **Paper 0** `#fffaf2`: primary card and content surface.
- **Paper 1** `#fff1de`: page wash, input background, soft separators.
- **Paper 2** `#e9d8c4`: borders, dividers, board pins.
- **Paper 3** `#d9c2a7`: subdued structural marks and texture dots.

Rules:

- Paper carries most of the page; it is the visible material of the product.
- Background is a warm paper gradient plus low-opacity dot texture.
- Ambient light may use coral/sage at low opacity only; it must not become the content hierarchy.

### Ink — structure and trust

- **Ink 900** `#253048`: H1, primary CTA, Champion container, strongest labels.
- **Ink 800** `#303b55`: active hover and secondary title depth.
- **Ink 700** `#45506a`: strong body headings and selected state text.
- **Ink 500** `#6b7488`: readable body copy.
- **Ink 300** `#9ba4b3`: placeholder and quiet metadata.

Rules:

- Ink replaces pure black. Use **no pure black UI surfaces**.
- Ink establishes order; it is not decorative.
- Text contrast must be readable on Paper surfaces and Sage/Coral pale surfaces.

### Coral — creative action and feedback

- **Coral 600** `#b96a5c`: title keyword, action accent, selected feedback.
- **Coral 700** `#9e574c`: readable coral text.
- **Coral 150** `#f2d6cf`: soft border and underline.
- **Coral 100** `#f8e3dd`: blocker/action pale background.

Rules:

- Coral is the only warm creative accent.
- Use it for action, missing anchors, and title point-work, not broad decoration.
- Never turn every card into coral; Coral should stay under roughly 7% of the first screen.

### Sage — reference and confirmation

- **Sage 600** `#5b8277`: reference/confirmation accent.
- **Sage 700** `#486e64`: readable sage text.
- **Sage 150** `#d6e7df`: soft border.
- **Sage 100** `#e7f1ec`: Reference Canvas pale background.

Rules:

- Sage belongs to Reference Canvas, known anchors, and aligned/ready status.
- Sage should signal calm confirmation, not generic success-green.
- Do not mix Sage with multiple extra color families.

## Page application rules

1. **UI is the frame, not the artwork**. The interface must not compete with generated images or visual drafts.
2. Use depth to communicate hierarchy:
   - deep = title/action/Champion;
   - mid = body copy, route labels, selected states;
   - pale = page background, card surface, ambient board texture.
3. Use Coral for title keywords and action feedback; use Sage for references and confirmation.
4. Keep cards primarily Paper. Different cards should not each receive a unique saturated background.
5. Use rounded cards, soft Ink shadows, warm borders, and subtle dots as the tactile system.
6. Avoid provider route, storage key, raw task payload, debug labels, and other internal language.
7. Preserve Visual Stage product hierarchy:
   - stage and visual proof first;
   - composer immediately reachable;
   - Creation Case compact;
   - Reference Canvas and Champion + Comparison Set visible;
   - Inspection/debug hidden.

## Forbidden color and material patterns

- Pure black: `#000`, `#000000`, `bg-black`, `text-black`, or black-heavy shadows.
- Random high-saturation sticker colors, including prior loose purple/yellow/neon families.
- A card-per-color layout.
- High-saturation gradients as ordinary section backgrounds.
- Low-contrast foreground/background pairs.
- Debug/admin status-light visuals.
- UI decoration that visually overpowers the Champion or Comparison Set.

## Mobile invariants

Mobile must not become a crude stacked desktop:

- the Warm Editorial Board identity remains visible before deep details;
- composer remains reachable near the first screen;
- Creation Case remains legible in compact cards;
- Reference Canvas and Comparison Set remain available without a separate history page;
- horizontal overflow must stay at zero.
- `/visual-stage` can use an immersive route-isolated shell: old project title, sidebar, and mobile menu must not appear on the review surface.
- Image references support two entry paths: `＋` is biased toward local new-image upload; `@` is the advanced path for referencing asset-library images or conversation-history images.
- Reference images appear as `@图片1`, `@图片2` tokens inside the composer text, so the user can write instructions around them.
- Default send is ordinary conversation. Generation only happens after an explicit 出图 switch; generated drafts stay in the chat thread until the user confirms adding them to the canvas.
- MVP implementation should reuse existing Workbench upload/task APIs: local image → `/assets/upload`; generation with references → `/tasks/edit`; text-only generation → `/tasks/generate`; task updates through SSE with polling fallback.
- Public UI must show human Chinese statuses such as 生成中、生成完成、加入画布; it must not expose raw HTTP response bodies, provider routes, storage keys, or task JSON.

## Regression hooks

`apps/web/product-ui-contract.test.js` locks these markers:

- `D · Creative Board`
- `Warm Editorial Board`
- `温润编辑式创作板`
- `Board-first Visual Stage`
- `Mood before settings`
- `Reference Canvas`
- `70% Paper / 20% Ink / 7% Coral / 3% Sage`
- `Paper 0`
- `Ink 900`
- `Coral 600`
- `Sage 600`
- `UI is the frame, not the artwork`

The contract also rejects pure-black surfaces, the previous loose high-saturation sticker palette, and competing direction labels in `/visual-stage` after D selection.
