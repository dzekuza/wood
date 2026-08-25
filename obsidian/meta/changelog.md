---
tags: [meta, changelog]
updated: 2026-08-25
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-08-25 — Headings switch to Outfit Medium at a flat 56px/36px scale

Site-wide typography change, requested directly: every real heading (`h1`,
`h2`, `h3`, plus section-title classes like `.archive-hero-title`,
`.shead .title`, and the homepage's `.demo-*-head h2`s) now renders in a new
self-hosted `Outfit Medium` face (`public/fonts/outfit-medium.ttf`,
`font-weight: 500`) at one flat size — 56px desktop, 36px mobile via
`@media (max-width: 780px)` — instead of the old per-selector responsive
`clamp()` scale (h1 64px / h2 44px / hero clamp up to 72px, etc). Mark Bold
stays exactly where it was for prices, stat numbers, pull-quotes, and
repeated card names (`.category-card-name`, `.pcard-price-value`,
`.collection-card-title(-new)`, `.rev-score .big`, etc) — those are
"spoken" numerals/labels, not structural headings, so they were
deliberately left out of scope. See `DESIGN.md` §3 for the updated Roles/
Scale tables — that file is the source of truth other agents should check
before styling new heading-like text.

One useful discovery mid-change: the homepage's `demo.css` (a separate
"distinct type system" for `_index.tsx`/`landing-oak.tsx`, loaded via its
own Google Fonts `Outfit` link) already used `'Outfit'` as a family name
for its section heads at 36px, and `.demo-benefits-heading` was *already*
56px — i.e. 56px was already the established "hero-scale" size in that
system before this change, which is a good sign this size choice fits the
existing rhythm rather than being arbitrary.

## 2026-08-25 — `/collections/all` filters, filter-styling scope bug, product card hover-swap

- **`/collections/all` ("Products") had no filter sidebar at all.** Unlike
  `collections.$handle.tsx`, the Storefront API's top-level `products` field
  has no `filters` argument (only `Collection.products` does — see the
  gotcha in root `CLAUDE.md`), so there was no server-side facet data to
  render. Added `buildLocalFilters`/`applyLocalFilters` to
  `app/lib/collectionFilters.ts`: they compute Availability/Price facets
  from the already-fetched product set and filter it in JS, shaped as the
  same `Filter[]`/`ProductFilter` types the real per-collection filters use,
  so `CollectionFilters` renders identically on both pages with no
  component changes. The loader now fetches up to 250 products (was 48)
  since facet computation needs the full catalog, not one page of it.
- **Filter sidebar styling silently didn't apply in the mobile drawer.**
  All of `.check`/`.ct`/`li a`/`h4` etc. were scoped to `.shop-sidebar`, but
  the mobile filter drawer renders the same `<CollectionFilters>` inside
  `.mob-filter-body`, not `.shop-sidebar` — so on mobile the checkboxes,
  spacing, and hover states silently never rendered (plain unstyled text).
  Rescoped those rules from `.shop-sidebar X` to `.filters-content X`
  (`.filters-content` is the div `CollectionFilters` always renders,
  regardless of which container it sits in), so desktop sidebar and mobile
  drawer share one styled implementation. Also added a real dual-thumb price
  range slider (`.price-slider`, bounds read from the `PRICE_RANGE` filter's
  `values[0].input`) — previously "Price" was just two bare number inputs.
- **Product cards didn't swap to a second image on hover.** All three
  product-card fragments already fetch `images(first: 4)`, but
  `ProductItem.tsx` only ever rendered `featuredImage`. Added a second
  absolutely-positioned `<img>` (`product.images.nodes` entry that isn't the
  featured image) that crossfades in via `.pcard-img:hover
  .pcard-img-frame-hover`, guarded by the existing `@media (hover: hover)
  and (pointer: fine)` pattern already used elsewhere on `.pcard`.

## 2026-08-25 — Card swatches, category carousel, and object-fit crop fixes

Three related "why does this look worse than the PDP" complaints, same root
cause each time: two places render the same Shopify data with different,
lower-quality treatment.

- **`.pcard-swatch` (product card grid) looked low-quality vs. the PDP's
  `.product-swatch`.** `ProductItem.tsx` rendered swatches via
  `style={{backgroundImage: ...}}` inline styles (a design-system violation —
  see `design-system.md`) at a tiny 14px, and gave the first swatch a
  different inset/padding treatment than the rest, which read as "some
  swatches look worse than others." Extracted the tone-class mapping
  (`getSwatchTone`, previously private to `ProductForm.tsx`) into
  `app/lib/swatches.ts`, and switched `ProductItem` to render an actual
  `<img>` for image swatches — same technique the PDP already used — dropping
  the inline style entirely and removing the `.is-first` special case so all
  swatches render uniformly at 18px.
- **`.demo-cat-image` (homepage "Our Categories") cropped product cutouts on
  hover.** It used `object-fit: cover` on the same transparent Shopify
  collection images that `.category-card-img` (the all-collections page)
  already renders with `object-fit: contain` — see the 2026-08-25
  category-card entry above for why `contain` is correct for these. `cover`
  was cropping the product unpredictably even at rest; the existing
  `scale(1.05)` hover-zoom just made the bad crop more noticeable. Fixed to
  `contain` + `var(--cwf-sand)` background, matching the established pattern.
- **`.demo-cat-grid` had no mobile carousel.** Below 620px it degraded to a
  cramped 2-column grid instead of the horizontal swipeable carousel already
  used for the equivalent row on `collections.all` (`.category-row`). Gave it
  the same `overflow-x: auto; scroll-snap-type: x mandatory` treatment so the
  two behave consistently.

## 2026-08-25 — Fixed inline "Order now" button text wrap on mobile

The main `.pdp-atc-btn` (inline CTA in `.pdp-cta-row`, not the sticky bar) was
wrapping its label onto two lines on narrow phones — "Order" / "now · €400.00" —
because the qty stepper + button + price suffix no longer fit on one row at
375px after the quantity stepper was added. Fixed in `app.css`: `.pdp-atc-btn`
now has `white-space: nowrap`, and at `≤480px` its padding tightens and the
`.pdp-atc-price` suffix (the "· €X.XX" after the label) hides entirely — the
price is already shown above in `.pdp-price-big`, so dropping it from the button
label at this width is not a loss of information, just less crowding.

## 2026-08-25 — Fixed premature sticky ATC bar + restyled to dark overlay

`.pdp-sticky-bar` (mounted in `products.$handle.tsx`) was showing immediately on
page load for any product with a tall options form (many variant/upsell rows push
the CTA below the fold before the user scrolls at all). Root cause: the
`IntersectionObserver` callback did `setShowSticky(!entry.isIntersecting)` —
`isIntersecting` is `false` both when the target has scrolled *past* (above the
viewport) and when it simply hasn't been scrolled *to* yet (below the viewport on
initial load), and the code treated both as "show the bar." Fixed by also
requiring `entry.boundingClientRect.top < 0` (target's top edge is above the
viewport — i.e. actually scrolled past), not just "not currently visible."
**Rule of thumb:** never treat `!isIntersecting` alone as "scrolled past" for a
one-way reveal trigger — check the target's `boundingClientRect` for direction too,
or it fires for elements that just haven't been reached yet.

Also restyled `.pdp-sticky-bar` from a plain white bar to a dark translucent
overlay (`rgba(28,28,28,.94)` derived from `--cwf-ink`, `backdrop-filter: blur`)
with a light pill CTA button (`.pdp-sticky-bar .pdp-atc-btn` overrides to
`--cwf-surface` bg / `--cwf-primary` text) — closer to how competitor PDPs treat
this pattern and more visually distinct as an overlay vs. page content. Mobile now
keeps the price visible in the bar (only the product title hides at `≤600px`),
where it previously hid the whole price/title block and showed just the button.

## 2026-08-25 — PDP layout updated to match reference IA (highlights, qty stepper, benefits card)

Restructured `app/routes/products.$handle.tsx` / `app/components/ProductForm.tsx`
after reviewing a reference storefront's product page layout:
- Added `.pdp-highlights` — a short icon+text bullet list (material, guarantee,
  delivery) between the title and price, mirroring the reference's benefit list
  above the variant picker. New CSS block next to `.pdp-rating-row` in `app.css`.
- Added a quantity stepper (`.pdp-qty`) to the CTA row — previously there was no
  way to order more than 1 in a single line add. `quantity` state now lives in
  the route (`products.$handle.tsx`) and is threaded into `ProductForm` via new
  `quantity`/`onQuantityChange` props; it scales both the main variant line and
  any selected upsell lines in `cartLines`. `.pdp-cta-row` grid changed from
  `1fr auto` to `auto 1fr auto` to fit the new stepper; the wishlist heart button
  hides at `max-width: 480px` to keep the row from cramping on small phones.
  **Gotcha:** the mobile-hide media query must be declared *after* the base
  `.pdp-wish-btn { display: flex }` rule in the cascade — putting it earlier (same
  specificity) meant the base rule always won and the button never actually
  hid on mobile, even though the query matched.
- Moved the "honest specifications" benefit grid (`.pdp-specs`) to sit directly
  after the hero grid, before the maker strip — reference puts its benefits
  section immediately below the fold, not after the story section. Restyled it
  from a bare grid into a `var(--cwf-surface)` (cream) rounded card so it reads
  as a distinct section against the page's white background, without going
  full-bleed (kept inside `.pdp-wrap`, per the "hero is the only full-bleed
  exception" rule).
- Fixed `.claude/launch.json`: it pointed `npm run dev` at port 5173, but this
  project's actual dev command is `shopify hydrogen dev` (default port 3000,
  CLAUDE.md recommends `--port 3001`). Updated to the real command/port so the
  Browser-pane preview tooling attaches correctly.

Follow-ups on the collection-page redesign above, both in `.category-card*`
(`app/styles/app.css`):
- Mobile cards were `flex: 0 0 42%` (~150px), leaving ~38px for text after
  the 64px image + padding + gap — titles like "Solid Oak Coat Racks"
  rendered as "So…". `.category-card-name` was single-line
  `white-space: nowrap` + ellipsis everywhere, not just mobile. Changed it
  to a 2-line `-webkit-line-clamp` (both breakpoints) and widened the
  mobile card to `flex: 0 0 78%` / `min-width: 240px` with a smaller
  52px image, so the full title fits.
- `.category-card-img` had `background: var(--cwf-card)` + `object-fit:
  cover`, filling the square with a cream box and cropping the photo —
  wrong for these Shopify collection images, which are transparent
  product cutouts (same style as the `public/demo/category-*.png` assets
  used elsewhere). Reverted to `object-fit: contain` with no background,
  so the product floats on the card's own white background like the
  reference.

## 2026-08-25 — Collection pages redesigned: real filters, sort, badges, sibling-category row

Reference: a Thrive Market collection page screenshot (title + horizontal
sibling-category row + sidebar filters + product badges).

- `collections.$handle.tsx` had **no sidebar, no sort control, no category
  row** — `SortDropdown` existed but was never mounted, and
  `app/styles/app.css` had a fully-built but completely unwired sidebar
  filter shell (`.shop-sidebar`, `.fblock`, `.check`, `.price-range`) from
  an earlier pass. `collections.all.tsx` had a vertical/centered
  `.category-row` (no counts) and a **fake** mobile filter drawer — the
  price inputs were `readOnly` with hardcoded "240"/"4,800" values, wired
  to nothing.
- Added `app/lib/collectionFilters.ts` + `app/components/CollectionFilters.tsx`
  (see [[../frontend/utils|utils]] / [[../frontend/components/common|components]])
  implementing **real** Shopify-native filtering: the Storefront API
  returns a `filters` array on `Collection.products(...)` (Availability,
  Price, and any store-configured facet) where each value's `input` field
  is a ready-to-resend `ProductFilter` JSON blob — round-tripped through
  `?filter=`/`price_min`/`price_max` URL params. **Important constraint
  discovered while wiring this up:** the top-level `QueryRoot.products`
  field (used by `collections.all.tsx`) has **no `filters` argument** —
  only `Collection.products` supports it. So `collections.all.tsx` only
  gained sort + category row + real counts; the filter sidebar only exists
  on `collections.$handle.tsx`, where it's genuinely scoped to that
  collection's real facets (no "Benefits" group renders for this store
  today because it has no such Shopify filter configured — that's correct,
  not a missing feature).
- Mounted `<SortDropdown>` on both routes (fixed 2 real bugs while making
  it load-bearing: a floating promise on `navigate()`, and a non-interactive
  `<div>` click-to-close backdrop converted to a real `<button>`).
- `collections.$handle.tsx` now also fetches sibling collections
  (`SIBLING_COLLECTIONS_QUERY`, same `products(first:250){nodes{id}}`
  count pattern used elsewhere) to render the horizontal category row.
- Converted `.category-card` from a vertical/centered card to a horizontal
  one (small image left, title + real count stacked right) on both routes,
  matching the reference. Added `.pbadge`/`.pbadge-sale`/`.pbadge-sold-out`
  to `ProductItem` — no badge classes existed in the codebase before this.
- Incidental fix: typing `SORT_MAP`'s `sortKey` values properly (was
  `string`, now the literal union) resolved the 2 pre-existing TS errors
  in these two files that [[../../CLAUDE.md|CLAUDE.md]]'s "Known issues" section
  used to call out as "do not fix unless specifically asked" — they're
  gone now as a side effect of touching this code, not chased separately.

## 2026-08-25 — Categories/Popular/Textures white backgrounds were boxed, not full-bleed

- Flagged as a known caveat in the previous entry, now fixed properly:
  `.demo-categories`, `.demo-popular`, and `.demo-textures` each carried
  `max-width: 1400px; margin: 0 auto` directly on the section element
  itself, so their white background was a centered box with the page's
  cream showing at the edges above ~1462px viewports — unlike
  `.demo-process`, which is `width: 100%` and genuinely edge-to-edge.
  Restructured all three the way `.demo-process` already worked: the
  `max-width`/`margin`/`padding`/layout moved onto a new inner wrapper
  (`.demo-categories-inner`, `.demo-popular-inner`, `.demo-textures-inner`)
  added in `CategoriesGrid.tsx`, the `PopularProductsSection` in
  `_index.tsx`, and `TexturesGrid.tsx`; the `<section>` itself is now just
  `width: 100%` + `background: #fff`. Moved each section's responsive
  padding overrides onto the matching `-inner` selector too. Verified at
  1920px — all four sections now measure the same full viewport width.

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
