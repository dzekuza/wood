# Landing Page Scroll Animations — Design

## Goal

Add reveal / slide-in / stagger animations to sections, cards, divs, and headings across the landing page (`app/routes/_index.tsx`), giving it a "subtle & premium" motion feel consistent with the CWF walnut/oak furniture brand.

## Scope

Whole landing page (`app/routes/_index.tsx`): HeroSection, SaleShowcaseSection, WorkshopStepsSection, SaleSpotlightSection, CraftLightSection, GallerySection, ArticlesSection, NewsletterSection.

## Library choice

**Motion only** (`motion/react`, already installed as `motion@^12.42.2`). The codebase already has a Motion-based foundation:
- `app/hooks/use-is-in-view.tsx` — wraps Motion's `useInView`
- `app/components/animate-ui/primitives/animate/slot.tsx` — Motion-based `asChild` slot primitive

GSAP (`gsap`, `@gsap/react`) is installed but unused; we are explicitly not introducing it for this pass to avoid running two animation systems side by side. Revisit GSAP/ScrollTrigger only if a future need arises that Motion can't handle well (e.g. scroll-scrubbed/pinned sections).

## Motion tokens

New file `app/lib/motion.ts`:

```ts
export const EASE_OUT = [0.23, 1, 0.32, 1]; // strong custom ease-out, not the weak built-in
export const DURATION = 0.5; // 500ms — acceptable for marketing/explanatory-tier reveals
export const DISTANCE = 20; // px slide distance
export const STAGGER = 0.07; // 70ms/item, within the 30-80ms guidance
```

Rationale (per Emil Kowalski's design-engineering framework, `emil-design-eng` skill):
- Entering elements use `ease-out` (starts fast, feels responsive); never `ease-in`.
- Built-in CSS/Motion easing curves are too weak — use a custom cubic-bezier for intentional-feeling motion.
- This is a marketing/explanatory context (landing page scroll reveal), not a frequently-repeated UI control, so durations above the strict <300ms UI rule (up to ~500-600ms) are acceptable.
- Scale-based reveals start from `scale(0.96)`, not `scale(0)` — nothing in the real world pops from fully collapsed.
- Only animate `transform` and `opacity` (GPU-accelerated, skips layout/paint).
- Where a component renders during heavy page load (hero, first viewport), use the full `transform: 'translateY(...)'` string instead of Motion's `x`/`y` shorthand, since the shorthand isn't hardware-accelerated.

## Components

### `app/components/animate-ui/Reveal.tsx`
Wraps a single element. Uses `useIsInView` + `motion.div`. Fades and slides up (`opacity 0→1`, `transform: translateY(20px)→translateY(0)`) when scrolled into view. Props: `delay?`, `y?` (default `DISTANCE`), `once?` (default `true`).

### `app/components/animate-ui/StaggerGroup.tsx`
Wraps a list of children (cards, nav items, grid items) using Motion `variants` with `staggerChildren: STAGGER`. Reveals children in cascade as the group enters view, using the same `Reveal`-style child transition.

Both respect `prefers-reduced-motion` via Motion's built-in `useReducedMotion` — verified explicitly during testing (not assumed).

## Section-by-section treatment

- **HeroSection** — headline/subhead/CTA fade+slide in on mount (above the fold, not scroll-triggered), staggered ~80ms apart. Hero showcase cards get a slightly delayed entrance.
- **SaleShowcaseSection / SaleSpotlightSection** — `.shead` heading reveals on scroll; carousel cards use `StaggerGroup` to cascade in as the row enters view.
- **WorkshopStepsSection** — step cards/icons stagger left-to-right, pairing with the existing `animateOnHover` animate-ui icons.
- **CraftLightSection** — text block slides in from the left, image carousel from the right (opposite-side editorial reveal), both at `DISTANCE` (20px).
- **GallerySection** — grid images stagger in with fade + scale(0.96→1), no slide.
- **ArticlesSection / NewsletterSection** — heading + content `Reveal`, no stagger (single content blocks).

## Testing

1. `npx shopify hydrogen dev --port 3001 --disable-version-check`, scroll through the full landing page and visually verify each section's reveal timing/direction.
2. Verify `prefers-reduced-motion: reduce` (via browser/OS emulation) suppresses slide/scale movement while content still appears (opacity-only fallback).
3. Confirm no `transition: all`; only `transform`/`opacity` are animated.
4. Confirm stagger never blocks interaction — cards/buttons remain clickable mid-stagger.
5. `npm run typecheck` — no new TS errors beyond the 4 pre-existing ones noted in `CLAUDE.md`.

## Out of scope

- GSAP/ScrollTrigger.
- Animating other routes (PDP, collections) — landing page only for this pass.
- Non-scroll interactions (hover states, button press feedback) — separate concern from this reveal-animation pass.
