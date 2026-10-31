---
tags: [frontend]
updated: 2026-10-18
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

## Social tags and structured data (2026-10-18)

`seoMeta()` now also emits Open Graph and Twitter tags (`og:*`, `twitter:*`;
the image is the route's own, else `DEFAULT_SHARE_IMAGE`), a `noindex, follow`
robots tag when `noindex: true`, and JSON-LD blocks passed as `jsonLd`
(`{'script:ld+json': …}`). The builders live in `app/lib/structuredData.ts`:
`organizationJsonLd` and `websiteJsonLd` (homepage), `productJsonLd` (offer for
the selected variant — the cheapest available by default; **no `aggregateRating`**: Google disallows marking up reviews collected on another site such as Etsy),
`articleJsonLd`, `breadcrumbJsonLd` (products, articles, collections). Every
route with a `meta` export now goes through `seoMeta`; `/pages/favourites` and
`/landing-oak` are `noindex`. `/llms.txt` is `app/routes/[llms.txt].tsx`.
Validate in Google's Rich Results Test, not curl — but ours is server-rendered,
so curl does see it.

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

## `og:type` for products (2026-10-31)

`seoMeta()`'s `og:type` was emitting the literal string `og:product` for
product pages — not a valid Open Graph type (the value should just be
`product`; `og:` is the property-namespace prefix, not part of the value).
Fixed in `app/lib/seo.ts` to pass `type` straight through.

## GSC decline investigation (2026-10-31)

Checked why GSC-reported average position fell ~49 spots over 28 days.
Findings, from live `sc-domain:craftwoodfurniture.co.uk` data (the project's
Search Console binding is on the `dzekuza@gmail.com` OpenSEO account — the
`gsc-mcp` server's own default site is bound to a different project
(pawscharm.com), so queries against it need an explicit `site_url` override
or `multi_site_dashboard`/`advanced_search_analytics`):

- The apex→www redirect is correct (`https://craftwoodfurniture.co.uk/` 301s
  to `https://www.craftwoodfurniture.co.uk/` with
  `x-redirect-reason: primary_domain_redirection`; http→https also redirects).
  Not a code bug — GSC is still attributing historical impressions to the
  pre-redirect apex URL while Google re-consolidates signals onto the `www`
  canonical.
- robots.txt and the sitemap route are not blocking any money pages.
- The impression spike (impressions +1059%, clicks flat) is driven mostly by
  the homepage being served for a much broader, largely irrelevant query set
  at very deep positions (100+), plus some clearly non-human/junk queries
  (search-operator strings unrelated to furniture) in the GSC data — not a
  loss of ranking on the actual money pages (`collections/solid-oak-*` held
  steady around position 55-70, which matches the pre-existing near-zero
  organic visibility noted in the OpenSEO project context, not a new drop).
- No further code fix identified beyond the `og:type` bug above; the
  underlying ranking problem is low authority/thin backlinks, tracked as the
  project's actual SEO goal, not a regression from the Oct 20 metadata/schema
  commits.

## Related

[[routing]] · [[html-semantics]]
