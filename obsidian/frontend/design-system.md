---
tags: [frontend, wip]
updated: 2026-08-25
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
| | | | |

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
- **Mark Bold** (`/fonts/mark-bold.ttf`) — still used, but only for prices,
  stat numbers, pull-quotes, and repeated card names (product/category card
  titles) — anything "spoken" that isn't a structural heading.
- **Plus Jakarta Sans** — unchanged: body, nav, buttons, eyebrows, labels.

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

## Related

[[component-conventions]] · [[components/ui]]
