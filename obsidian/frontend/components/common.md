---
tags: [frontend, catalog, wip]
updated: 2026-08-25
---

# Common Components Catalog

Shared composed components in `components/common/` — built from [[components/ui]]
primitives, reused across features.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `Icons` (`StarFilledIcon`, `HeartFilledIcon`) | `app/components/Icons.tsx` | Solid-fill SVG icons — `@tabler/icons-webfont` has no `-filled` glyphs, so any solid star/heart must come from here, not `ti-star-filled` / `ti-heart-filled` | |
| `AnnouncementBar` | `app/components/AnnouncementBar.tsx` | Top strip above the header — tagline + phone/email, rendered inside `Header` | |
| `TexturesGrid` | `app/components/TexturesGrid.tsx` | "Our Textures" homepage section — same `Category` list as `CategoriesGrid` but renders dedicated wood-grain close-ups from `public/demo/texture-*.jpg` (handle-keyed lookup, falls back to the collection photo) | |
| `HeroCarousel` | `app/components/HeroCarousel.tsx` | Homepage hero slider; optional `rating` prop renders the `.demo-hero-rating` badge | |
| `CategoriesGrid` | `app/components/CategoriesGrid.tsx` | "Our Categories" grid — 6 collections with real product counts (`Category.count`) | |
| `ProductItem` | `app/components/ProductItem.tsx` | Shared product card (`.pcard`) — homepage, collections, PDP recommendations. Renders heart-save toggle, per-product star rating (parsed from the `reviews.product_reviews` metafield), price, variant swatches, and a `.pbadge` (Save $X from `compareAtPriceRange`, or Sold out from `selectedOrFirstAvailableVariant.availableForSale`) | |
| `SortDropdown` | `app/components/SortDropdown.tsx` | `?sort=newest\|price-high\|price-low` control, mounted on both collection routes | |
| `CollectionFilters` | `app/components/CollectionFilters.tsx` | Renders whatever Shopify's native `filters` array returns for a collection (Availability, Price, plus any store-configured facet) as checkboxes/price inputs, via [[utils\|collectionFilters.ts]]. Shared between the desktop `.shop-sidebar` and the mobile `.mob-filter-drawer` on `collections.$handle.tsx` — **not** on `collections.all.tsx`, since the Storefront API's top-level `products` query has no `filters` argument (only `Collection.products` does) | |
| `TestimonialsMarquee` | `app/components/TestimonialsMarquee.tsx` | Homepage review marquee, sourced from `lib/reviews.ts` | |
| `ContactBanner` | `app/components/ContactBanner.tsx` | Homepage footer contact panel — general inquiries + workshop columns | |
| `ProductForm` | `app/components/ProductForm.tsx` | PDP variant options (swatches/dropdown/length-slider), upsell option rows, and the CTA row (qty stepper + `AddToCartButton` + wishlist heart). `quantity`/`onQuantityChange` are controlled props — state lives in `products.$handle.tsx` and is threaded into `cartLines` so it scales the main variant line and any selected upsell lines together | |

## Related

[[component-conventions]] · [[components/ui]]
