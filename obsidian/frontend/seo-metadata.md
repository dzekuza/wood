---
tags: [frontend]
updated: 2026-10-15
---

# SEO & Metadata

## Conventions

- Metadata is each route's React Router `meta` export. Indexable routes build
  it with `seoMeta()` from `app/lib/seo.ts` (see [[utils]]): title,
  description and canonical in one call.
- **Every indexable route sets a description.** Order of preference: the
  merchant's Shopify SEO field (`seo.description`), then the resource's own
  text (`description`), then a written default naming the product or
  category, so a blank field in Admin never leaves a page without one.
  `toMetaDescription` trims to 155 characters.
- **Canonicals are absolute and path-only**: `https://craftwoodfurniture.co.uk`
  plus the pathname, with no query string. Filter (`?filter=`, `price_*`),
  sort and pagination (`cursor`, `direction`) variants of a listing all point
  at the clean listing URL. See [[../meta/decisions-log#ADR-0018]].
- A canonical must be `{tagName: 'link', rel: 'canonical', href}`. Without
  `tagName` React Router renders `<meta rel="canonical">`, which search
  engines ignore (that was the PDP's bug until 2026-10-15).
- Listing links that change filters or sort must delete **both** `cursor` and
  `direction`. `?direction=previous` with no cursor 404s, so
  `collections.$handle` 301s any such URL to the same listing without
  `direction`.
- `robots.txt` and the sitemaps are the `[robots.txt].tsx`, `[sitemap.xml].tsx`
  and `sitemap.$type.$page[.xml].tsx` routes.

## Per-route metadata

| Route | Title | Description | Canonical |
|-------|-------|-------------|-----------|
| `_index` | Hard-coded | Hard-coded | — |
| `products.$handle` | `seo.title` → product title | `seo.description` → `description` → default | `/products/{handle}` |
| `collections.$handle` | `seo.title` → collection title | `seo.description` → `description` → default | `/collections/{handle}` |
| `collections._index` | "Shop by Category" | Hard-coded | `/collections` |
| `collections.all` | "All Products" | Hard-coded | `/collections/all` |
| `blogs._index` | "Stories from the Bench" (its h1, so it doesn't duplicate `/blogs/news`) | Hard-coded | `/blogs` |
| `blogs.$blogHandle._index` | `seo.title` → blog title | `seo.description` → default | `/blogs/{handle}` |
| `pages.$handle` | `seo.title` → page title | `seo.description` | — |
| `about`, `contact` | Hard-coded | Hard-coded | — |

## Related

[[routing]] · [[html-semantics]]
