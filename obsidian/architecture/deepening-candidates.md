---
tags: [architecture, deepening-candidates]
updated: 2026-11-18
---

# Deepening candidates

Friction found at `0ecfd74`, using the improve-codebase-architecture method (hot spots from `git log --since=90.days`: 143 commits). Friction only; no redesign proposed. Terms: **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**. No `GLOSSARY.md` exists; see "Glossary proposals" below. Module names: [[codebase-map]].

## 1. product-page logic is spread across one route and seven helpers

- **Files:** `app/routes/products.$handle.tsx` (1021 lines), `components/ProductForm.tsx`, `lib/{variantSelection,variants,upsells,productOptionDisplay,swatches,units,inventory}.ts`
- **Problem:** The route is the interface for every PDP rule: option resolution, cheapest-variant default, add-on pricing, stock caps, unit system, JSON-LD. Each helper is small and the real behaviour depends on how the route calls them, so locality is poor: one change (e.g. a swatch) touches data, helper and component.
- **Deletion test:** Deleting `variantSelection.ts` or `units.ts` would just move their logic into the route (pass-through-like); deleting the route's inline logic would concentrate nothing. Unclear which helpers earn their keep.
- **Evidence:** 25 commits to `products.$handle.tsx` and 19 to `ProductForm.tsx` in 90 days; `swatches.ts` swap fix `0ecfd74`; ADRs 0018, 0019, 0021 in [[decisions-log]].
- **Strength:** Strong

## 2. Page-content editing: every route repeats the loader and admin gate

- **Files:** `lib/pageContent.server.ts`, `lib/adminCheck.server.ts`, `routes/api.page-content.tsx`, 8 routes calling `loadPageContentState`, 13 components using `EditableText`
- **Problem:** The seam is the `page_content` metaobject, but the interface a route must know is wide: slug constant, `loadPageContentState`, `isAdminCustomer`, and wiring `EditToolbar`. The api route's own comment says any new route reading it "has to repeat the check", so a safety invariant is enforced by convention.
- **Deletion test:** Deleting `adminCheck.server.ts` would spread the allowlist check into every caller (concentrates, earns its keep). Deleting `shopifyAdmin.server.ts` (one call site chain) would only move a fetch into `pageContent.server.ts` (shallow).
- **Evidence:** 8 route files import `pageContent.server`; `routes/api.page-content.tsx` header comment; [[../frontend/edit-toolbar]].
- **Strength:** Worth exploring

## 3. Collection filtering is two implementations with copied fixes

- **Files:** `lib/collectionFilters.ts`, `routes/collections.$handle.tsx` (Shopify-native filters), `routes/collections.all.tsx` (local `buildLocalFilters`/`applyLocalFilters`), `CollectionFilters.tsx`
- **Problem:** One filter interface, two adapters with different semantics because the Storefront API's top-level `products` has no `filters` argument. A rule (hide the Availability facet) was applied twice, to `/collections/all` first and then to `$handle` via `getListAndBooleanFilters`.
- **Deletion test:** Deleting `collectionFilters.ts` would scatter URL parsing across two routes (concentrates).
- **Evidence:** commit `f3e13e1` "remove Availability filter from collection pages"; CRM task 617639c8 (blocked, client decision on availability filter, mirror `TASKS.md` 2026-11-16); CLAUDE.md known issues.
- **Strength:** Worth exploring

## 4. `site.ts` mixes unrelated concerns and is a high-churn file

- **Files:** `lib/site.ts` (176 lines)
- **Problem:** Company legal facts, social links, announcement copy, category ordering, flagship page route map, host detection (`isPublicHost`) and `shouldHideCollection` share one module. Interface is large and unrelated callers (SEO, header, collections, entry.server) all import it. Hand-written copy also lives in `collectionContent.ts` and `homeContent.ts` defaults.
- **Deletion test:** Deleting it would redistribute constants to callers (moves complexity); splitting is not proposed here.
- **Evidence:** 12 commits in 90 days; imported by `entry.server.tsx` and others.
- **Strength:** Worth exploring

## 5. Newsletter module has no caller and its own Admin client

- **Files:** `lib/newsletter.server.ts` (229 lines), `lib/shopifyAdmin.server.ts`
- **Problem:** `subscribeEmailToNewsletter` has no importer under `app/`. It takes `adminToken`/`storeDomain` arguments and pins Admin API `2025-01`, while the shared client uses `2026-04`. Two seams to the same service, one dead.
- **Deletion test:** Deleting it removes code with no callers (earns nothing today); if a signup route is planned it would reuse the shared client.
- **Evidence:** `rg subscribeEmailToNewsletter app` finds only the definition.
- **Strength:** Worth exploring

## 6. Runtime config duplicated across `.env.example`, `wrangler.toml`, `env.d.ts`, and two Workers

- **Files:** `.env.example`, `wrangler.toml`, `workers/wrangler.toml`, `workers/price-sync.ts` (hardcodes shop domain and Admin version)
- **Problem:** Shop domain and Admin API version are repeated per file with different values; `SITE_PASSWORD` and `SCOPES` are declared with no reader found.
- **Deletion test:** n/a (configuration, not a module).
- **Evidence:** see [[integrations]] flags.
- **Strength:** Speculative

## 7. Review data is static TS files with several readers

- **Files:** `app/data/etsy-*.ts`, `lib/reviews.ts`, `lib/reviewStats.ts`, `ReviewsSection.tsx`, `site.ts` (`STORE_REVIEW_COUNT`)
- **Problem:** No seam to a live source; counts in `site.ts` derive from a data file, so a data refresh changes site constants.
- **Deletion test:** `lib/reviews.ts` (one re-export) is a pass-through.
- **Evidence:** `lib/reviews.ts:5`; scripts `etsy-reviews-*.mjs`.
- **Strength:** Speculative

## Glossary proposals (no `GLOSSARY.md` exists; not created)

add-on, slider option, swatch, flagship page, category (collection), guide (collection copy), page slug, draft / published content, headless channel ("Wood Headless").
