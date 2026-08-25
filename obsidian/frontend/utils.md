---
tags: [frontend, catalog, wip]
updated: 2026-08-25
---

# Utils Catalog

Pure helpers in `src/utils/`. A util is pure, typed, and unit-testable; anything
with I/O or client state belongs in `lib/` or a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `parseFiltersFromSearchParams` / `getFilterValueUrl` / `getPriceRangeUrl` / `getClearFiltersUrl` / `isFilterValueActive` / `hasActiveFilters` / `getPriceBounds` | `app/lib/collectionFilters.ts` | `(searchParams: URLSearchParams, ...) => ...` | Round-trips Shopify's native `Filter`/`ProductFilter` shape through `?filter=`/`price_min`/`price_max` URL params — see [[components/common\|CollectionFilters]]. `getPriceBounds` reads a `PRICE_RANGE` filter's `values[0].input` for the slider's min/max |
| `buildLocalFilters` / `applyLocalFilters` | `app/lib/collectionFilters.ts` | `(products: T[]) => Filter[]` / `(products: T[], searchParams) => T[]` | Used only by `collections.all.tsx` — computes Availability/Price facets and filters the fetched product array in JS, since the top-level `products` Storefront query has no server-side `filters` argument. Shaped as the same `Filter[]`/`ProductFilter` types the real per-collection filters use so `CollectionFilters` doesn't need to know which page it's on |
| `getSwatchTone` | `app/lib/swatches.ts` | `(name: string, color?: string \| null) => string` | Maps a variant option's name/color to a `.product-swatch-tone-*` CSS class for swatches with no image. Shared by `ProductForm` (PDP option picker) and `ProductItem` (card grid) so both render color-only swatches identically — extracted from a PDP-only helper when the card grid needed the same logic |

## Related

[[folder-structure]]
