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

## Related

[[folder-structure]]
