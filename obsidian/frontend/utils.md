---
tags: [frontend, catalog, wip]
updated: 2026-08-25
---

# Utils Catalog

Pure helpers in `src/utils/`. A util is pure, typed, and unit-testable; anything
with I/O or client state belongs in `lib/` or a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `parseFiltersFromSearchParams` / `getFilterValueUrl` / `getPriceRangeUrl` / `getClearFiltersUrl` / `isFilterValueActive` / `hasActiveFilters` | `app/lib/collectionFilters.ts` | `(searchParams: URLSearchParams, ...) => ...` | Round-trips Shopify's native `Filter`/`ProductFilter` shape through `?filter=`/`price_min`/`price_max` URL params — see [[components/common\|CollectionFilters]] |
| `getSwatchTone` | `app/lib/swatches.ts` | `(name: string, color?: string \| null) => string` | Maps a variant option's name/color to a `.product-swatch-tone-*` CSS class for swatches with no image. Shared by `ProductForm` (PDP option picker) and `ProductItem` (card grid) so both render color-only swatches identically — extracted from a PDP-only helper when the card grid needed the same logic |

## Related

[[folder-structure]]
