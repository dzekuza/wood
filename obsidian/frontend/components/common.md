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
| `AnnouncementBar` | `app/components/AnnouncementBar.tsx` | Top bar: socials / rotating message / contacts in a `1fr auto 1fr` grid. Messages come from `ANNOUNCEMENT_MESSAGES` in `app/lib/site.ts` and rotate every 4s — the copy there is placeholder marketing, confirm before shipping | |
| `CategoriesGrid` | `app/components/CategoriesGrid.tsx` | Homepage category carousel (despite the name). Scroll-snap track at all widths; paged nav ≥621px, free swipe below. Page count is measured from card width + gap in a `ResizeObserver` — don't swap it for a `PER_PAGE` constant, the card basis changes per breakpoint | |
| `HeroCarousel` | `app/components/HeroCarousel.tsx` | Homepage hero slider; optional `rating` prop renders the `.demo-hero-rating` badge. Autoplays every 3s (`SLIDE_DURATION_MS`, mirrored by `--demo-hero-slide-duration` in `demo.css` — change both together); renders `.demo-hero-nav` as a **sibling** of `.demo-hero`, below it, not overlaid | |
| `CategoriesGrid` | `app/components/CategoriesGrid.tsx` | "Our Categories" grid — 6 collections with real product counts (`Category.count`) | |
| `ProductItem` | `app/components/ProductItem.tsx` | Shared product card (`.pcard`) — homepage, collections, PDP recommendations. Renders heart-save toggle, per-product star rating (parsed from the `reviews.product_reviews` metafield), price, variant swatches, a `.pbadge` (Save $X from `compareAtPriceRange`, or Sold out from `selectedOrFirstAvailableVariant.availableForSale`), and a hover-swap second image — `pcard-img-frame-hover` (first `images.nodes` entry that isn't `featuredImage`) crossfades in on `:hover`, gated by `@media (hover: hover) and (pointer: fine)` so touch devices just show the featured image | |
| `SortDropdown` | `app/components/SortDropdown.tsx` | `?sort=newest\|price-high\|price-low` control, mounted on both collection routes | |
| `CollectionFilters` | `app/components/CollectionFilters.tsx` | Renders a `Filter[]` (Availability, Price, plus any store-configured facet) as checkboxes + a dual-thumb price range slider, via [[utils\|collectionFilters.ts]]. Its root `.filters-content` is what's actually styled (not `.shop-sidebar`), so it looks identical whether it's mounted in the desktop `.shop-sidebar` or the mobile `.mob-filter-drawer`. Used on both `collections.$handle.tsx` (real Shopify `Collection.products.filters`) and `collections.all.tsx` (the top-level `products` query has no `filters` argument, so `buildLocalFilters`/`applyLocalFilters` in `collectionFilters.ts` compute/apply the same Availability+Price facets locally from the fetched product set) | |
| `TestimonialsMarquee` | `app/components/TestimonialsMarquee.tsx` | Homepage review marquee, sourced from `lib/reviews.ts` | |
| `ContactBanner` | `app/components/ContactBanner.tsx` | Homepage footer contact panel — general inquiries + workshop columns | |
| `ProductForm` | `app/components/ProductForm.tsx` | PDP variant options (swatches/dropdown/length-slider), upsell option rows, and the CTA row (qty stepper + `AddToCartButton` + wishlist heart). `quantity`/`onQuantityChange` are controlled props — state lives in `products.$handle.tsx` and is threaded into `cartLines` so it scales the main variant line and any selected upsell lines together | |

## Related

[[component-conventions]] · [[components/ui]]
