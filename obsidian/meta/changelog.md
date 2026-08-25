---
tags: [meta, changelog]
updated: 2026-08-25
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-08-25 — Categories/Popular backgrounds white; Textures width matched to other sections; product-card gap investigated (no bug)

- `.demo-categories` and `.demo-popular` backgrounds set to explicit `#fff`
  (direct request), same pattern as the earlier `.demo-process` /
  `.demo-textures` change.
- `.demo-textures` had `padding: 40px 99px 80px` — 99px side padding vs.
  every sibling section's 40px — so its content was visibly narrower than
  Categories/Popular/Process even though all three share
  `max-width: 1400px`. Changed to `padding: 40px 40px 80px` to match.
- Investigated a "gap between rating and price looks too big, should match
  Figma node 7:1665" report. Figma's own spec for that card
  (`get_design_context` on `7:1665`) is a `gap-[16px]` outer stack; measured
  the live `.pcard-body`'s computed gap at `16px` exactly — already an
  exact match, confirmed by comparing a full, unscaled screenshot of the
  "Most popular" grid (the report screenshot was a tight, scaled crop of
  just the rating/price lines, which reads as "too much space" out of
  context). **No CSS change made** — shrinking the gap further would have
  been a deviation from the cited Figma spec, not a fix.

## 2026-08-25 — `.pgrid` mobile columns were unequal (missing `min-width: 0` on grid items)

- On mobile, the "Most popular" 2-column `.pgrid` was rendering columns
  ~216px / ~105px instead of equal ~160.5px each (confirmed via
  `getComputedStyle(...).gridTemplateColumns`). Root cause: CSS Grid's
  default `min-width: auto` on grid items lets a track's content-based
  minimum win over `1fr`'s equal-share intent — one column's `.pcard` had
  wider min-content (a `.pcard-bottom-row` with an unbreakable price string
  + 6 swatch dots side by side) than the other, so `repeat(2, 1fr)` stopped
  being equal. This is the classic "1fr isn't always equal" CSS Grid trap;
  fix is `min-width: 0` on the grid item. Added it to `.pcard`.
  Fixing the width alone surfaced a second issue: the freed-up-but-still-
  too-narrow `.pcard-bottom-row` (price + swatches) was overflowing
  horizontally into the next column since `justify-content: space-between`
  doesn't wrap by default. Added `flex-wrap: wrap` to `.pcard-bottom-row`
  and `min-width: 0` to `.pcard-price-row` so swatches drop to their own
  line on narrow cards instead of overlapping the neighboring card.
  Verified at the `mobile` (375px) preset — equal columns, no overlap.

## 2026-08-25 — Craftsmanship + Textures sections switched to white; category arrow now hover-only

- `.demo-process` (Craftsmanship section) and `.demo-textures` ("Our
  Textures") backgrounds changed from dark (`#443c35`) / transparent to
  white, on direct request. For `.demo-process` this cascaded further than
  a flat color swap: its heading, subtext, and `.demo-btn-outline-light`
  were all styled for a dark backdrop (light/white text and borders) — so
  those flipped to `#352f2a` / `#61482e` too, scoped to `.demo-process`
  only (`.demo-btn-outline-light` is shared with `FeaturedPicks`, left
  untouched there). The individual step cards (`.demo-process-card`) keep
  their own dark brown background — same "dark card on light section"
  pattern already used for testimonial review cards.
  **Note:** `.demo-textures` still carries `max-width: 1400px; margin: 0
  auto` on the section element itself, so its white background is a
  centered box, not full-bleed — on viewports wider than ~1600px you'll
  see the page's cream background at the edges. `.demo-process` is
  `width: 100%` so it's genuinely edge-to-edge. Restructuring `.demo-textures`
  to match would need the max-width moved onto an inner wrapper — not done
  here since it wasn't asked for and didn't visibly matter at the
  viewport width being tested.
- `.demo-cat-arrow` (the arrow badge on "Our Categories" cards) was always
  visible — inconsistent with `.demo-tex-arrow` on the Textures cards,
  which already only appears on hover (`opacity: 0` → `1`, with a
  `@media (hover: none)` fallback so it stays visible on touch). Brought
  `.demo-cat-arrow` in line with that same pattern.

## 2026-08-25 — product card row alignment; testimonials switched to light section

- `ProductItem`: the `.pcard-rating` row was only rendered when a product
  had review data, so cards without reviews (e.g. "Oak Mantle Beam",
  "Mantle Beam") sat shorter than their row-mates and their price lines
  didn't align — visible once the "Most popular" grid had a real mix of
  reviewed/unreviewed products. Now always renders the `.pcard-rating`
  container (with an `is-empty` / `visibility: hidden` state when there's
  no data) so it reserves the same height either way and every card's
  price sits on the same baseline within a row.
- `TestimonialsMarquee`'s section (`.demo-testimonials`) changed from a
  dark background (`#2d231a`) to the page's light surface (`#F3EFEA`), on
  direct request — heading and rating-row text switched from white to
  `#352f2a` to stay legible; the review cards were already white with a
  border so they're unaffected. **Note:** this makes 3 consecutive light
  sections on the homepage (Categories → Popular → Testimonials) before the
  next dark one (Craftsmanship). [[../CLAUDE.md|CLAUDE.md]]'s "never two
  consecutive dark sections" rule is still satisfied (it doesn't forbid
  consecutive light ones), but it's a deviation from the alternating-rhythm
  *intent* — flagging here since it was a direct styling request, not a
  Figma-audit finding.

## 2026-08-25 — fixed invisible "filled" star/heart icons; light-section h2 color pass

- Root cause of "missing stars" (Figma node `7:873`, hero rating, product
  card ratings, testimonial stars): `@tabler/icons-webfont` (the CDN icon
  font loaded in `root.tsx`) only ships **outline** glyphs — `ti-star-filled`
  and `ti-heart-filled` were being used across `HeroCarousel`,
  `TestimonialsMarquee`, and `ProductItem`, but those classes resolve to no
  glyph at all in this package (confirmed: 0 `-filled` rules in the shipped
  CSS). Same bug hit `ti-point-filled` in `ValueMarquee` (`/landing-oak`).
  Added `app/components/Icons.tsx` — small solid-fill SVG `StarFilledIcon` /
  `HeartFilledIcon` — and swapped all 4 broken `ti-*-filled` spots to use
  them; swapped the `ValueMarquee` separator dot to a plain CSS-styled
  `<span>` instead. Updated the CSS that used to size these via
  `i { font-size }` to size the new `svg` elements via explicit
  `width`/`height` instead (font-size doesn't size an inline SVG).
- Investigated the flat-color (no-photo) swatch dots on the "Oak Mantle
  Beam" card ("Light Grey Oil", "White Oil"): confirmed via the Admin API
  that those 2 of 6 finish option values genuinely have no swatch photo
  uploaded in Shopify — the other 4 do. Figma's mockup shows photos for all
  6, but they're unverified placeholder images, not confirmed photos of
  this store's actual finish. **Decision (user-confirmed): keep the flat
  color swatch for these two** rather than substitute an unverified photo —
  `ProductItem`'s existing color-fallback behavior was already correct, no
  code change needed.
- h2 color pass on the homepage's light-background sections: `.demo-popular-heading`
  and `.demo-textures-head h2` were `#61482e` (warm brown) — changed to
  `#352f2a` to match `.demo-categories-head h2` (fixed earlier this session).
  Left `.demo-testimonials-head h2`, `.demo-process-head h2`, and
  `.demo-contact-heading h2` untouched — they sit on dark section
  backgrounds and are white/cream by design; switching them to `#352f2a`
  would make them unreadable.

## 2026-08-25 — Our Textures now uses real texture close-up photography

- `TexturesGrid` was reusing each collection's live Shopify product photo
  (the same image `CategoriesGrid` shows) as a stand-in, noted at the time
  as "no dedicated texture photography exists". It does — `public/demo/`
  already has one wood-grain close-up per category (`texture-mantel-beams.jpg`,
  `texture-shelves.jpg`, `texture-door-stops.jpg`, `texture-cube-blocks.jpg`,
  `texture-surround-mantels.jpg`, `texture-coat-racks.jpg`), matching
  Figma's "Our Textures" node (`7:1489`) exactly — they just weren't wired
  up. Added a handle → texture-image lookup in `TexturesGrid.tsx`, keyed
  off `Category.to`, falling back to the collection photo only if a handle
  has no dedicated texture crop. Also rendered `.demo-tex-count` (existed
  in CSS, unused) alongside each title, matching Figma.

## 2026-08-25 — categories expanded to 6, product card rebuilt from Figma

- Figma's "Our Categories" section (node `7:908`) shows 6 categories, but
  the live Shopify store only had 4 collections — "Surround Mantels" and
  "Cube blocks" didn't exist, even though matching active products already
  existed (`Oak Fireplace Surround`, `Solid Oak Block`) and category/texture
  image assets for them were already sitting unused in `public/demo/`.
  Confirmed with the user before touching live store data, then:
  - Created `Solid Oak Fireplace Surrounds` (handle
    `solid-oak-fireplace-surrounds`) and `Solid Oak Cube Blocks` (handle
    `solid-oak-cube-blocks`) as manual collections via the Shopify Admin
    API, each seeded with its one matching active product, and published
    both to the **Wood Headless** sales channel (publication id
    `342742139222` — see [[../CLAUDE.md|CLAUDE.md]] Storefront access) so
    they're queryable from the Storefront API.
  - `_index.tsx`: added both to `HERO_SHOWCASE_QUERY` (aliases
    `surroundMantels` / `cubeBlocks`) and to `buildHeroSlides()` /
    `buildCategories()`, in Figma's order (Mantel beams, Coat racks, Door
    stops, Surround Mantels, Cube blocks, Shelves). `.demo-cat-grid` was
    already a 6-column grid — no CSS change needed there.
  - Wired up real per-category product counts: bumped the
    `HeroShowcaseCollection` fragment's `products(first: 1)` to
    `products(first: 250) { nodes { id } }` and pass `.length` as
    `Category.count`; `CategoriesGrid` now renders it into the
    `.demo-cat-count` class (existed in CSS, unused until now — see prior
    entry's list of things left undone this way).
  - Ran `npm run codegen` to regenerate `storefrontapi.generated.d.ts` for
    the new query fields.

- Rebuilt `ProductItem.tsx` to match Figma's product card (node `7:1660`):
  left-aligned title, a real per-product star rating + review count (parsed
  client-side from the `reviews.product_reviews` metafield JSON — already
  fetched everywhere but never parsed/rendered anywhere), a save/favourite
  heart button (local `useState` toggle, not persisted — no wishlist
  backend exists), and a price + variant-swatch row (reads
  `options[].optionValues[].swatch`, already fetched, never rendered).
  `.pcard` in `app.css` was rebuilt to match: left-aligned body instead of
  centered, 1:1 image radius 24px, new `.pheart` / `.pcard-rating` /
  `.pcard-swatches` classes (the `.pheart` name matches what
  [[../CLAUDE.md|CLAUDE.md]]'s Components section already documented but
  never had CSS for). This is the shared card — the visual change applies
  everywhere `ProductItem` is used (homepage, collections, PDP
  recommendations), not just the homepage.

## 2026-08-25 — hero + header brought in line with Figma

- The homepage hero (`_index.tsx` → `HeroCarousel`) was always showing a
  dynamic per-collection slide first (product close-up image, product-name
  headline, "Shop {Collection}" CTA) — the on-brand slide defined in
  `HeroCarousel`'s `FALLBACK_SLIDES` (and the matching `/demo/hero-1.png`
  lifestyle photo, which was sitting on disk unused) only appeared when no
  Shopify data loaded, so in practice it never rendered. Added a
  `BRAND_HERO_SLIDE` constant in `_index.tsx` and prepended it to
  `buildHeroSlides()`'s output — the branded "Timeless Oak. Made for Your
  Home." slide is now always slide 1, with the real per-collection slides
  following it in the carousel.
- `Header.tsx`: removed `/` from `HERO_OVERLAY_ROUTES`. The homepage header
  was `position: fixed` and transparent-over-hero (`.header--overlay`,
  originally built for `/landing-oak`) — Figma shows a normal solid header
  sitting above the hero, not floating over it. Homepage header is now a
  regular static/sticky solid block; `/landing-oak` keeps the overlay
  behavior unchanged.

## 2026-08-25 — homepage audited against Figma, missing sections wired up

- Audited the homepage (`app/routes/_index.tsx`) against the Figma landing
  page design (`ZF9zGJmPThAcYFSGZtVsWd`, node `6:21`). Found that several
  sections already had complete CSS in `app/styles/demo.css` /
  `app/styles/app.css` from a prior pass, but were never rendered by any
  component — a "styled but orphaned" gap, not a design mismatch.
- Added `AnnouncementBar.tsx` (new) — top strip above the header with a
  tagline and real contact info (`lib/site.ts`), styled via new
  `.announcement-bar*` rules in `app.css`.
- Wired up the hero rating line (`.demo-hero-rating` already existed,
  unused) — `HeroCarousel` now takes an optional `rating` prop; `_index.tsx`
  computes it from `HOMEPAGE_REVIEWS` (avg 4.9, 17 reviews — real curated
  Etsy reviews, see `lib/reviews.ts`). No fabricated stats.
- Added `TexturesGrid.tsx` (new) — renders the already-complete
  `.demo-textures` / `.demo-tex-*` CSS, reusing the same category data as
  `CategoriesGrid` (no separate texture photography exists yet).
- `TestimonialsMarquee`: swapped heading order to rating-row-then-heading
  and re-centered `.demo-testimonials-head` (was a left/right split) to
  match the Figma stacked-center layout; heading copy aligned to "What our
  customers say".
- `ContactBanner`: added a second footer column ("Workshop" —
  `WORKSHOP_LOCATION` / `WORKSHOP_VISIT_NOTE` from `lib/site.ts`) using the
  pre-existing but unused `.demo-contact-col` / `.demo-contact-address`
  classes, matching Figma's two-column footer.
- Deliberately did **not** add: fake discount codes, an Etsy shop URL, a
  street address, or per-category product counts (`.demo-cat-count` /
  `.demo-tex-count` CSS exists but no real count data is fetched) — all
  present in the Figma mock but not backed by real data in this repo.

## 2026-08-25 — vault initialised

- Project brain scaffolded from the shared `.project-brain` template: vault,
  root shims (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`), and the three Claude
  Code hooks that keep this vault in sync.
