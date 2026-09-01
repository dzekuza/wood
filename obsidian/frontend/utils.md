---
tags: [frontend, catalog, wip]
updated: 2026-09-01
---

# Utils Catalog

Pure helpers in `src/utils/`. A util is pure, typed, and unit-testable; anything
with I/O or client state belongs in `lib/` or a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `parseFiltersFromSearchParams` / `getFilterValueUrl` / `getPriceRangeUrl` / `getClearFiltersUrl` / `isFilterValueActive` / `hasActiveFilters` / `getPriceBounds` | `app/lib/collectionFilters.ts` | `(searchParams: URLSearchParams, ...) => ...` | Round-trips Shopify's native `Filter`/`ProductFilter` shape through `?filter=`/`price_min`/`price_max` URL params — see [[components/common\|CollectionFilters]]. `getPriceBounds` reads a `PRICE_RANGE` filter's `values[0].input` for the slider's min/max |
| `buildLocalFilters` / `applyLocalFilters` | `app/lib/collectionFilters.ts` | `(products: T[]) => Filter[]` / `(products: T[], searchParams) => T[]` | Used only by `collections.all.tsx` — computes Availability/Price facets and filters the fetched product array in JS, since the top-level `products` Storefront query has no server-side `filters` argument. Shaped as the same `Filter[]`/`ProductFilter` types the real per-collection filters use so `CollectionFilters` doesn't need to know which page it's on |
| `getSwatchTone` | `app/lib/swatches.ts` | `(name: string, color?: string \| null) => string` | Maps a variant option's name/color to a `.product-swatch-tone-*` CSS class for swatches with no image. Shared by `ProductForm` (PDP option picker) and `ProductItem` (card grid) so both render color-only swatches identically — extracted from a PDP-only helper when the card grid needed the same logic |

| `buildHomeContent` | `app/lib/homeContent.ts` | `(data: HomeContentQuery \| undefined) => HomeContent` | Merges the homepage `home_page` metaobject response over `HOME_CONTENT_DEFAULTS`, field by field — see [[homepage-content]]. Blank and missing fields both fall back (`text()` trims, so clearing a field in admin restores the coded default rather than rendering an empty heading); multi-line headings split on `\n`; an unrecognised process-icon key falls back to that step's positional default. Pure and covered by an assertion pass over a mocked response |

| `currencyOptions` / `activeCurrency` / `resolveCountry` | `app/lib/localization.ts` | `(localization: Localization) => CurrencyOption[]` / `... => CurrencyOption \| null` / `(value, available) => CountryCode` | Back the header [[components/common\|CurrencySwitcher]]. `currencyOptions` dedupes `availableCountries` down to one entry **per currency** (GB and LT both settle in EUR on this shop, so a per-country list would repeat EUR). `resolveCountry` is a guard, not a convenience: an unsupported market makes every subsequent Storefront query throw, so a posted value is narrowed against `availableCountries` before it reaches the session — see [[../meta/decisions-log\|ADR-0009]] |
| `getRatingSummary` / `aggregateRatings` | `app/lib/reviewStats.ts` | `(metafieldValue?: string \| null) => RatingSummary \| null` / `(products: ReviewedProduct[]) => RatingSummary \| null` | Owns reading the `reviews.product_reviews` metafield JSON. `getRatingSummary` is the per-product figure behind every product card's stars (extracted from a private copy inside `ProductItem` so the card and the homepage cannot disagree); `aggregateRatings` sums **individual reviews** across products for the homepage hero badge and testimonials heading — averaging per-product averages would let a product with 2 reviews outweigh one with 40. Both return `null` rather than a zero summary so "no reviews yet" stays distinguishable from "rated 0", which the card renders differently |
| `shouldHideCollection` / `homepageCategoryRank` / `getPagePath` | `app/lib/site.ts` | `({handle, title}) => boolean` / `(handle: string) => number` / `(handle: string) => string` | `shouldHideCollection` filters merchandising/utility collections (`most-popular`, room-name leftovers) out of anywhere that enumerates collections — the header search tags and the homepage category grid. `homepageCategoryRank` orders that grid by `HOMEPAGE_CATEGORY_ORDER`, sorting unlisted handles to the end so a new Admin collection appears without a deploy |
| `fieldId` / `PageContentMap` | `app/lib/pageContent.ts` | `(...parts) => string` | Shared, client-safe types for the [[edit-toolbar]]'s flat `{fieldId: copy}` map. No Admin imports, so a component can pull it in |
| `loadPageContentState` / `ensureDraft` / `saveDraft` / `publishDraft` / `resetDraft` | `app/lib/pageContent.server.ts` | see file | The `page_content` metaobject read/write path. `loadPageContentState` is what a route loader calls: admins read live, shoppers read through `CacheShort()`, and it **never throws** — an unconfigured or unreachable CMS renders the coded copy instead of a 500 |
| `adminCredentials` / `shopifyAdminGraphQL` | `app/lib/shopifyAdmin.server.ts` | `(env) => {token, shopDomain} \| null` / `(credentials, query, vars) => Promise<T>` | Admin GraphQL client. `adminCredentials` returns `null` when the token or shop domain is missing, which is how "no CMS configured" stays a normal state rather than an error. Server-only — the token bypasses every Storefront visibility rule |
| `isAdminCustomer` | `app/lib/adminCheck.server.ts` | `(context) => Promise<boolean>` | Logged-in Customer Account whose email is in `ADMIN_ALLOWLIST_EMAILS`. Re-checked per request (so revoking is immediate) and short-circuits on an empty allowlist before touching the session |

## Related

[[folder-structure]]
