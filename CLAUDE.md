# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Shopify Hydrogen headless storefront for **CraftWoodFurniture (CWF)** — connected to `wood-123252.myshopify.com`. Built with Hydrogen 2026.4.x, React Router 7.12.0 (pinned), React 19, Vite, and Tailwind CSS.

## Commands

```bash
# Dev server (always use these flags)
npx shopify hydrogen dev --port 3001 --disable-version-check

# Build with codegen
npm run build          # shopify hydrogen build --codegen

# Type check
npm run typecheck      # react-router typegen && tsc --noEmit

# Lint
npm run lint

# Regenerate Storefront API types
npm run codegen        # shopify hydrogen codegen && react-router typegen

# Install (always use legacy-peer-deps)
npm install --legacy-peer-deps
```

## Architecture

### Stack
- **Framework**: `@shopify/hydrogen` + React Router 7.12.0 (file-based routing in `app/routes/`)
- **Runtime**: MiniOxygen (Cloudflare Workers emulation via `@shopify/mini-oxygen`)
- **Styles**: Tailwind + custom CSS in `app/styles/app.css`
- **Path alias**: `~` → `app/` (configured in `vite.config.ts` via `resolve.alias`)

### Key files
- `app/root.tsx` — root loader, `<Analytics>`, font/icon CDN links, `PageLayout` wrapper
- `app/routes/_index.tsx` — homepage (hero, collections, products, craftsmanship sections)
- `app/routes/products.$handle.tsx` — PDP with gallery, info, specs, related products
- `app/routes/collections.$handle.tsx` — collection listing with filter bar
- `app/routes/collections._index.tsx` — all-collections grid
- `app/components/PageLayout.tsx` — wraps every page; contains `Header`, `Footer`, and `Aside` overlay
- `app/styles/app.css` — all brand CSS: design tokens, component classes, resets
- `storefrontapi.generated.d.ts` — auto-generated Storefront API types (do not edit manually)

### Data flow
Loaders in route files fetch data via the Storefront API (GraphQL). Queries are co-located in the route file or in `app/graphql/`. Generated types live in `storefrontapi.generated.d.ts` — run `npm run codegen` after changing any GraphQL queries.

### Storefront access
Products must be published to the **"Wood Headless"** sales channel (publication ID `342742139222`) to appear in the storefront. Publishing to Online Store alone is not sufficient.

---

## CWF Design System

All design decisions follow `DESIGN.md` (source of truth). Key rules for coding:

### CSS tokens (always use these, never raw hex)
```css
--primary: #4A2F1F      /* walnut — headings, CTAs on light */
--accent: #C9A27A       /* oak — icons, borders, hover */
--accent-deep: #7A5A3A  /* darker oak — eyebrows, secondary text */
--surface: #F3EFEA      /* linen — page bg */
--sand: #E8DFD1         /* secondary surfaces */
--dark: #2A2A2A         /* charcoal — dark sections */
--ink: #1C1C1C          /* footer, marquee */
--line: rgba(74,47,31,.12)
--line-dark: rgba(201,162,122,.18)
```

### Typography rules
- **Mark Bold** (`font-family: 'Mark Bold'`): display headlines, H1/H2, prices, stat numbers — anything ≥ 18px and "spoken aloud". Never on buttons, nav, or body text.
- **Plus Jakarta Sans**: everything else — body, nav, buttons, eyebrows, labels.
- Eyebrow class: `.eyebrow` — 11px, Jakarta 600, +18% letter-spacing, uppercase.

### Layout
- Wrap class: `.wrap` — max-width 1320px, `0 auto`, `padding: 0 32px` (20px mobile).
- Every section's content goes inside `.wrap`. Hero is the only full-bleed exception.
- Alternate dark (`--dark`/`--ink`) and light (`--surface`) sections for vertical rhythm. Never two consecutive full-bleed dark sections.

### Components
- `.pcard` — product card with `aspect-ratio:1/1` image, `.pbadge`, `.pheart`, `.ptag`, `.pname`, `.pdesc`, `.padd`
- `.shead` — section header: eyebrow + H2 title (left) + optional "Browse all" link (right)
- `.btn-primary` / `.btn-dark` / `.btn-line` / `.btn-ghost` — four button variants (see DESIGN.md §5)
- `.pdp-*` — PDP layout classes (gallery, info, specs, maker strip, etc.)
- `.page-header` — dark full-width page title bar for collection/inner pages

### Icons
Tabler Icons loaded from CDN (added in `root.tsx` `links()`). Use `<i className="ti ti-{name}">` at 18–24px. Reserved set: `armchair`, `hammer`, `tree`, `heart`, `shopping-cart`, `star`, `ruler`, `package`, `certificate`, `arrow-right`.

### AddToCartButton constraint
`AddToCartButton` has no `className` prop. Wrap it in a `<div className="pdp-atc-wrap">` and target `button[type="submit"]` inside via CSS.

---

## Skills & agents

Skills are invoked via the `Skill` tool. Use the right skill for the task — don't guess, invoke it.

| Task | Skill to use |
|---|---|
| Any Hydrogen/Storefront API work | `shopify-plugin:shopify-hydrogen` then `shopify-plugin:shopify-storefront-graphql` |
| Shopify Admin API / mutations | `shopify-plugin:shopify-admin` |
| Building or styling UI components | `frontend-design:frontend-design` |
| Tailwind class patterns / utilities | `tailwind-css-patterns` |
| React patterns, hooks, data-fetching | `vercel:react-best-practices` |
| Responsive layout, mobile breakpoints | `responsive-design` |
| Typography, spacing, scale | `web-typography` |
| Hover/transition micro-animations | `microinteractions` |
| Accessibility audit / WCAG | `accessibility` |
| E2E tests (Playwright) | `e2e-testing` |
| Browser QA / visual regression | `browser-qa` |
| Requesting a code review | `superpowers:requesting-code-review` |
| Receiving / acting on a code review | `superpowers:receiving-code-review` |

### Key skill constraints for this project

- **Always read `DESIGN.md`** before any UI work — it is the design source of truth, not the skill defaults.
- When `shopify-plugin:shopify-hydrogen` conflicts with project conventions (e.g., CSS-in-JS vs our custom CSS tokens), follow the project conventions in this file.
- `tailwind-css-patterns` is a supplement; our primary styling is custom CSS classes in `app/styles/app.css`, not utility-first Tailwind.

---

## Known issues / gotchas

- `npm run typecheck` is currently clean (0 errors) — if you see stale advice elsewhere referencing pre-existing TS errors, re-run typecheck before trusting it.
- Real filtering exists on `collections.$handle.tsx` (Shopify-native `filters`/`ProductFilter`, see `CollectionFilters`/`collectionFilters.ts`) but **not** on `collections.all.tsx` — the Storefront API's top-level `products` field has no `filters` argument, only `Collection.products` does.
- `reset.css` applies `margin: 0 1rem 1rem 1rem` to `body > main` — this is overridden in `app.css`. If layout shifts appear, check that override is intact.
- `tsconfigPaths` alone does not resolve `~` in MiniOxygen's module fetch layer — the explicit `resolve.alias` in `vite.config.ts` is required.
