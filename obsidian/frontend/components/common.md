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
| `ProductItem` | `app/components/ProductItem.tsx` | Shared product card (`.pcard`) — homepage, collections, PDP recommendations. Renders heart-save toggle, per-product star rating (parsed from the `reviews.product_reviews` metafield), price, and variant swatches | |
| `TestimonialsMarquee` | `app/components/TestimonialsMarquee.tsx` | Homepage review marquee, sourced from `lib/reviews.ts` | |
| `ContactBanner` | `app/components/ContactBanner.tsx` | Homepage footer contact panel — general inquiries + workshop columns | |

## Related

[[component-conventions]] · [[components/ui]]
