---
tags: [frontend, wip]
updated: 2026-08-26
---

# Design System

The styling contract. **No hardcoded design values** anywhere in the codebase.

## Token tiers

1. **Primitive** (`--raw-*`) — literal values. Never referenced by components.
2. **Semantic** — role names (`--color-surface`, `--space-section`). What components use.
3. **Binding** — exposed to Tailwind via `@theme` in `globals.css`.

A component references tier 2/3 only. A raw hex or px in a `className` is a bug.

```tsx
// WRONG
<div style={{ padding: 16 }} className="text-[#3e82f1] mt-[20px]">
// RIGHT
<div className="text-primary mt-xl p-4">
```

## Tokens

| Token | Tier | Value | Use for |
|-------|------|-------|---------|
| `--cwf-star` | semantic | `#ffa817` | every rating star, site-wide (cards, PDP, testimonials, review lists). Never `--cwf-accent` — that pale gold washes out on light cards |
| `--cwf-ink-strong` | semantic | `#352f2a` | the strong text/chrome colour: header nav, dropdown, search, account/cart pills, contact panel, demo headings, card prices. Cooler than `--cwf-primary`; take tints via `color-mix(… N%, transparent)`, never a new `rgba()` |
| `--cwf-ink-strong-hover` | semantic | `#241f1a` | hover fill for the header cart pill |
| `--cwf-tile` | semantic | `#f6f6f6` | neutral tile behind product/collection media (`.pcard-img`, and via `--demo-tile-bg` the homepage card tiles). Not `--cwf-card`/`--cwf-sand` — the warm beige competes with the oak in cut-out photos |

## Adding a token

Add the primitive, then the semantic role, then the `@theme` binding — with a
comment recording where the value came from (Figma node, brand guide). Never skip
straight to a semantic token with a literal value.

## Rules

- No `style={{...}}` on JSX. Ever.
- No utility-class dumps on raw `div`s — extract a component past ~5 classes or on
  the second repetition. See [[component-conventions]].
- Mobile (React Native): every colour/spacing/radius comes from `useAppTheme()`;
  no raw hex or numbers in `StyleSheet.create()`.

## Typography

Two display faces now, not one — see `DESIGN.md` §3 for the full rationale:

- **Outfit Medium** (`/fonts/outfit-medium.ttf`) — real headings only: `h1`/`h2`/`h3`
  and section-title classes (`.archive-hero-title`, `.shead .title`,
  `.archive-faq-title`, `.demo-*-head h2`, etc). All of them share one flat
  size — 56px desktop, 36px mobile — regardless of heading level; hierarchy
  comes from weight/color/layout, not size.
> [!warning] The self-hosted faces cover ONE weight each
> `@font-face` in `app.css` declares Outfit at **500** and Mark Bold at **700**
> — nothing else. Any other weight is synthesised by the browser unless that
> weight is in the Google Fonts link in `root.tsx` (currently DM Sans
> 400/500/600/700, Outfit 400/500/600, Plus Jakarta Sans 300-700). Route-level
> `links()` in `_index.tsx`/`landing-oak.tsx` load fonts for those two routes
> only — never rely on them for a rule in `app.css`, which applies site-wide.

- **Mark Bold** (`/fonts/mark-bold.ttf`) — still used, but only for prices,
  stat numbers, pull-quotes, and repeated card names (product/category card
  titles) — anything "spoken" that isn't a structural heading.
- **Plus Jakarta Sans** — unchanged: body, nav, buttons, eyebrows, labels.

### `demo.css` is a separate type system

`app/styles/demo.css` (homepage `_index.tsx` + `landing-oak.tsx`) does not use
the Jakarta body face. It has its own three tokens, defined at the top of that
file — use these, never a literal font name, when touching those routes:

| Token | Face | Use for |
|-------|------|---------|
| `--demo-font-display` | Outfit | `h1`/`h2` and section headings |
| `--demo-font-body` | DM Sans | all body copy and UI text; paragraphs at weight 400 |
| `--demo-font-mark` | Mark Bold | prices, stat numbers |
| `--demo-tile-bg` | `var(--cwf-tile)` | the tile behind card media (category, product, texture); aliases the site token, don't re-literal it |
| `--demo-hero-slide-duration` | `3000ms` | hero autoplay dwell; mirrored by `SLIDE_DURATION_MS` |

### A `<p>` ignores its container's `font-size`

`reset.css` sets `p { font-size: 1rem; line-height: 1.4 }` — a rule on the
element itself, which always beats a value inherited from an ancestor no matter
how specific that ancestor's selector is. With `html { font-size: 17px }`,
every unstyled `<p>` is 17px. **Setting `font-size` on a wrapper does nothing to
the paragraphs inside it** — give the paragraph its own rule. This silently made
the announcement bar 17px where it declared 12px (see
[[../meta/changelog|changelog]] 2026-08-26).

### `.reset` beats your class

`app.css` has `button.reset { background: inherit; font-size: inherit }`. That
selector is (0,1,1) — **higher than any single class** — so a plain
`.my-control { background: … }` on a `<button class="my-control reset">` loses
silently and paints transparent. This hid the hero carousel's dots completely
(see [[../meta/changelog|changelog]] 2026-08-26). Write such rules as
`button.my-control` to win the cascade.

Heading scale there is **not** the site-wide flat 56px. `demo.css` `h2`s are
36px with `line-height: 1.1667` (= 42px at 36px); the hero `h1` is
`clamp(2.25rem, 6vw, 72px)` with `line-height: 1.0833` (= 78px at 72px).
Leading is unitless on purpose in both cases so the fluid/mobile sizes stay
proportional — don't replace it with a px value.

Button sizing on those routes is equally centralised: `.demo-btn` is **16px**,
and the *only* override is `.demo-hero-ctas .demo-btn` at **18px**. Don't add a
per-section button size — if a new button looks wrong at 16px, that's a padding
or weight question, not a size one.

Both faces are loaded from the single Google Fonts link in `root.tsx` — DM Sans
sat in `demo.css` for a while without ever being requested there, so it silently
rendered as the system sans. **If you add a face, add it to that link in the same
change.**

Before styling any new heading-like text, check `DESIGN.md` §3's Roles table
to know which of the three it belongs to — it's easy to reach for Mark Bold
out of habit since it was the sole display face before this split.

## Icons

Tabler Icons via `@tabler/icons-webfont` (CDN link in `root.tsx`), used as
`<i className="ti ti-{name}">`.

- **No `-filled` glyphs exist in this package.** `ti-star-filled`,
  `ti-heart-filled`, `ti-point-filled`, etc. resolve to no glyph at all —
  the class renders, the `i` tag takes up no visible space, and nothing
  errors. This bit the homepage hero rating, product card ratings, and
  testimonial stars until caught (see [[../meta/changelog|changelog]]
  2026-08-25). If you need a *solid* icon, use
  [[components/common|`StarFilledIcon` / `HeartFilledIcon`]] from
  `app/components/Icons.tsx`, or add a new SVG there — don't reach for a
  `ti-*-filled` class.
- Reserved outline set already in use: `armchair`, `hammer`, `tree`,
  `heart`, `shopping-cart`, `star`, `ruler`, `package`, `certificate`,
  `arrow-right`.

## PDP gallery: two presentations, one at a time

The product page ships both gallery layouts in the markup and picks by width:

| Width | Shown | Hidden |
|---|---|---|
| ≥981px | `.pdp-gallery` — 88px thumbnail rail + large main image (`grid-template-columns: 88px 1fr`) | `.pdp-carousel` |
| ≤980px | `.pdp-carousel` — swipeable, scroll-snap, dots + arrows | `.pdp-gallery` |

Both read the same `galleryItems` array and handle 3D model entries. `.pdp-gallery`
tracks its own `activeItem`; `.pdp-carousel` tracks `carouselIndex`.

### Sticky offsets

The sticky `.header` is **133px** at ≥981px (42px announcement bar + 90px topbar
+ hairline). `--cwf-header-h` holds that; anything sticking below the header
offsets from it, e.g. `top: calc(var(--cwf-header-h) + 16px)`.

**Measure it with webfonts loaded.** The same header reads 117px before Outfit
swaps in — that pre-font number is how `.pdp-gallery` ended up at `top: 88px`,
sliding under the header. `.filter-bar` (68px) and `.shop-sidebar` (160px) are
still on hardcoded guesses and have not been re-checked against this token.

### Keeping the gallery sticky

`.pdp-thumbs` is absolutely positioned inside `.pdp-gallery`, and
`.pdp-main-img` is pinned to `grid-column: 2`. Both are load-bearing:

- **Absolute rail** — in flow, a product with 10+ images made the rail ~900px
  taller than the photo, which set the gallery's height and burned its whole
  sticky range within one screen. Out of flow, the main image sets the height and
  the rail scrolls inside it (`overflow-y: auto`, scrollbar hidden).
- **Explicit `grid-column: 2`** — with the rail out of flow the main image is the
  only in-flow item, so it auto-places into the 88px rail column and collapses to
  ~92px tall.

`.pdp-gallery` was previously killed outright by a `display: none !important`
added during unrelated header work, so the carousel ran at every width and the
desktop thumbnail rail — already fully built — never rendered. If the rail
disappears again, look for a blanket rule before rewriting the component.

## Product grid breakpoints

`.pgrid` runs 4-up and steps down with width — but it lives in two contexts that
run out of room at different points, so the steps are not all on `.pgrid` itself.

| Context | ≥1281px | 981–1280px | ≤980px | ≤767px |
|---|---|---|---|---|
| Homepage (full `.wrap` width) | 4 | 4 | 2 | 2, tighter gaps |
| Collection pages (inside `.shop-layout`) | 4 | **3** | 2 | 2, tighter gaps |

Collection pages share the row with the 240px filter sidebar plus a 40px gap, so
the grid gets ~280px less width than the homepage does at the same viewport. At
1024px that put 4 columns at ~150px; the homepage at the same width sits at
218px — exactly the Figma card width (node `250:2911`) — which is why the 3-up
step is scoped to `.shop-layout .pgrid` rather than applied globally.

The rule is bounded as `(min-width: 981px) and (max-width: 1280px)` on purpose:
`.shop-layout .pgrid` outranks `.pgrid` on specificity, so an unbounded
`max-width` would beat the 2-up rule below 980px and never let the grid collapse.

## Related

[[component-conventions]] · [[components/ui]]
