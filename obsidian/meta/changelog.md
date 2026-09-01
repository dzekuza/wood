---
tags: [meta, changelog]
updated: 2026-09-01
---

## 2026-09-01 — Edit toolbar: dev bypass, and codegen stops choking on it

Two follow-ups after the toolbar shipped.

**Everyone is an admin in local dev.** `isAdminCustomer` short-circuits on
`import.meta.env.DEV`, so the toolbar works without a Customer Account login
(which needs an https tunnel on localhost). Vite replaces the flag with `false`
when building for Oxygen, so the branch does not exist in production and no env
var or header can bring it back.

**Codegen was failing with 5 errors.** Its `default` project globs all of
`app/**` and validates every `#graphql`-tagged document against the
*Storefront* schema — so the Admin API operations ("Cannot query field
`metaobjectByHandle`") and the Customer Account query ("Cannot query field
`emailAddress` on type Customer") both blew up. The Admin documents are now
untagged, and the customer query moved to
`app/graphql/customer-account/CustomerEmailQuery.ts`, which the `customer`
project globs — so it keeps real validation, and that validation confirms the
query shape was right all along.

Verified against the running dev server: `GET /api/page-content?slug=index`
returns `isAdmin: true` and the stored draft, and `ensure-draft` succeeds.

## 2026-09-01 — Fix: landing page failed to hydrate, so no toolbar appeared

`LANDING_SLUG` was exported from `pageContent.server.ts` and read by the
component tree as well as the loader. React Router only strips server code from
`loader`/`action`/`middleware`/`headers`, so Vite rejected the route with
*"Server-only module referenced by client"* — the homepage still server-rendered
but never hydrated, and the toolbar never mounted for an admin. The constant
moved to the client-safe `pageContent.ts`.

Worth remembering: `npm run typecheck` was clean throughout. This is a Vite /
React Router bundling rule, not a type error — only the dev server's output
showed it.

## 2026-09-01 — Inline copy editing on the landing page

An allowlisted admin browsing the live site can now flip **Edit on**, retype any
headline, blurb or button label on the homepage in place, and **Publish** it —
or **Reset** the draft. Adapted from the `edittoolbar` kit's Hydrogen adapter.

Copy lives in a `page_content` metaobject read through the **Admin** API
(Shopify's storefront visibility is whole-type, so a public `published_data`
would drag `draft_data` public with it). "Admin" is a logged-in Customer
Account whose email is in `ADMIN_ALLOWLIST_EMAILS` — no second login system.

It layers on top of the existing `home_page` metaobject rather than replacing
it: `EditableText` receives the value that metaobject (or the coded default)
resolved to, and shows an override only once one is published.

New: `lib/pageContent.ts`, `lib/pageContent.server.ts`, `lib/shopifyAdmin.server.ts`,
`lib/adminCheck.server.ts`, `routes/api.page-content.tsx`, `EditToolbarProvider`,
`EditToolbar`, `EditableText`, `ConfirmDialog`,
`scripts/setup-page-content-metaobject.mjs`. Two deviations from the kit are
recorded in [[decisions-log|ADR-0010]].

> [!success] Backend live on `wood-123252`
> Same day: the `page_content` definition was created (via the Shopify MCP),
> the "prices" custom app behind `SHOPIFY_ADMIN_TOKEN` was granted the four
> metaobject scopes, and `ADMIN_ALLOWLIST_EMAILS` was set locally. The full
> read → draft → publish → delete cycle was verified with the storefront's own
> token. Remaining: `ADMIN_ALLOWLIST_EMAILS` in the Oxygen environment before
> this works on a deployed build. Steps in
> [[../frontend/edit-toolbar|edit-toolbar]].

## 2026-09-01 — The "Categories" rename also had to happen in Admin

Renaming the strings in `HOME_CONTENT_DEFAULTS` changed nothing on the live
homepage: the `home_page` metaobject supplies those fields, and the metaobject
always wins ([[../frontend/homepage-content|homepage-content]]). Four values
still read "Collections" and were updated in Admin:

| Metaobject | Field | Now |
|---|---|---|
| `home_hero_slide/brand-slide` | `secondary_cta_label` | Explore Categories |
| `home_page/main` | `categories_link_label` | All Categories |
| `home_page/main` | `popular_cta_label` | Explore Categories |
| `home_page/main` | `process_cta_label` | Explore Categories |

The lesson generalises: **any copy change to a metaobject-backed field is a
two-place change** — the coded fallback for an unseeded storefront, and the
metaobject for this one. A code-only change looks correct in the diff and does
nothing to the site.

## 2026-09-01 — Storefront copy says "Categories", not "Collections"

Every user-visible "Collections" label is now "Categories": the search
placeholder and predictive-search group heading, the homepage/landing
`Explore Categories` CTAs and `All Categories` link (`HOME_CONTENT_DEFAULTS`),
the `ProductCarousel` explore button, the collections-index breadcrumb and
`Browse Categories` hero, and the PDP/collection breadcrumb crumb. The
`/collections/*` URLs, GraphQL names, and component/type names are unchanged —
Shopify's resource is still a Collection; only the shopper-facing noun moved.

Two singular-catalog phrasings were deliberately left alone: "Search the
collection" on the search page and "Browse our collection" on favourites both
mean the whole catalogue, not the nav concept.

## 2026-09-01 — Process section down to two stacked steps

"Jointed by hand" (an operation the shop does not perform) and "Oiled &
finished" are gone, leaving Rough-cut and Drawn & marked.

The interesting part is *how*. Deleting them from `HOME_CONTENT_DEFAULTS` alone
would have changed nothing — the `home_process_step` metaobjects still supply
four entries, and defaults only apply when a reference is absent. Rather than
leave the site wrong until someone edits Admin, `ProcessIconKey` is now the
authoritative list of steps the shop performs, and `parseProcessSteps` **drops**
any entry whose `icon` names a key not in it. Retiring a step is a code change
that takes effect on the next load; deleting the Admin entry is cleanup.

A blank icon still means "merchant omission" and borrows the positional
default — only a *named but unknown* key counts as retired, so a half-filled
entry is never silently eaten.

- `homeContent.ts` — `ProcessIconKey` narrowed to `'rough-cut' | 'drawn-marked'`;
  `parseProcessSteps` rewritten as a `flatMap` that can drop entries.
- `CraftmanshipProcess.tsx` — `PROCESS_ICONS` trimmed to the two survivors.
- `ProcessIcons.tsx` — `JointedByHandIcon` / `OiledFinishedIcon` deleted, now
  unreferenced.
- `demo.css` — `.demo-process-grid` goes `1fr 1fr` → `1fr`. Two cards in a 2x1
  row read short and wide beside the full-height workshop photo; stacked, the
  pair measures 569px against the photo's 569px.

Verified on the running site: two cards, single column (`grid-template-columns:
652px`), both at the same x, grid height matching the photo.

## 2026-09-01 — Homepage review numbers now cover the whole catalogue

The hero badge and the testimonials heading both advertised "17 reviews". That
number was computed, not typed — but from `HOMEPAGE_REVIEWS`, the 17 hand-copied
Etsy reviews in `lib/reviews.ts`. The store's real review data has been live all
along in each product's `reviews.product_reviews` metafield, driving the product
cards and the PDP: **166 reviews across 9 products, averaging 4.88.** The
homepage was under-reporting by roughly ten times.

- `lib/reviewStats.ts` (new) — `getRatingSummary` moved here from a private copy
  inside `ProductItem`, joined by `aggregateRatings` for the store-wide figure.
  One parser for the metafield now, so a card and the homepage headline cannot
  drift apart.
- `_index.tsx` — new `STORE_REVIEWS_QUERY` (ids + the metafield only, so it stays
  light while walking the catalogue), aggregated in the loader with hidden
  products filtered out via `filterHiddenProducts`, and passed to both the hero
  and the marquee. The module-scope `HERO_RATING` constant is gone.
- `TestimonialsMarquee` gained an optional `rating` prop; it falls back to
  summarising its own cards so the component still stands alone.

**The marquee still shows the same 17 curated cards** — they are the ones with
customer photos, which is the point of that section. Only the numbers changed.
Verified on the running site: hero `4.9 (166) reviews`, heading `4.9 · 166
reviews`, 17 cards (34 DOM nodes — the marquee clones each row for the loop),
product cards unchanged at their own per-product counts.

Because the figures come from metafields, importing more reviews updates the
homepage with no deploy.

## 2026-09-01 — Header currency switcher (and the real cause of the "$" bug)

Added a currency control between the account and cart buttons in the header.

- `lib/localization.ts` — session key, default country (`GB`), and helpers that
  collapse `availableCountries` down to one entry per **currency** (this shop's
  GB and LT markets both settle in EUR, so listing countries would show EUR
  twice).
- `routes/localization.tsx` — resource route action: validates the posted
  country against `availableCountries`, stores it in the session, mirrors it
  onto the cart's buyer identity, and redirects back. Rejects absolute and
  protocol-relative `redirectTo` values so the switcher can't be used as an
  open redirect.
- `lib/context.ts` — `i18n.country` now reads the session instead of being
  hardcoded to `GB`.
- `HEADER_QUERY` gained a `localization` block. It piggy-backs on a query that
  was already fetched and `CacheLong`-cached on every route, so this costs no
  extra request; `$country` is part of the cache key, so each market caches
  separately.
- `CurrencySwitcher.tsx` + `.header-currency*` rules in `app.css`.

See [[decisions-log|ADR-0009]] for why the country lives in the session rather
than a `($locale)` URL prefix.

> [!warning] The switcher has nothing to switch between yet
> `wood-123252` has exactly **one** enabled presentment currency: EUR.
> `paymentSettings.enabledPresentmentCurrencies` is `['EUR']`, and both markets
> (GB and LT) resolve to it. The component therefore renders as a static "EUR"
> label, not a dropdown — it becomes a real `<select>` the moment a second
> currency is enabled in **Admin → Settings → Markets**, with no code change.
> For a `.co.uk` shop advertising "Free UK delivery", GBP is presumably the one
> to add.

### Corrected from the 2026-08-31 audit

The `$0.00` in the header was reported there as a Shopify store-currency
setting. That was only half right: the store currency is EUR, but the header's
empty-cart fallback was the **hardcoded string `'$0.00'`** in `Header.tsx` —
a literal dollar amount on a store that has never traded in dollars. It now
renders `<Money>` with a zero in the active currency (`€0.00` today).

## 2026-08-31 — Client comment round (2026-08-31 PDF): unverifiable claims and dead links removed

Acting on the annotated homepage PDF (`2026 08 31 Komentarai.pdf`). This pass
covers only the items that needed no further decision from the client; the
rest are listed under "Still open" below.

- **Announcement bar copy** (`lib/site.ts`) — "made to order in the Cotswolds"
  → "made at CraftWood Furniture"; the £250 free-delivery threshold is gone
  (delivery is free on everything). The third line was approved as-is.
- **Socials unified.** The bar advertised Facebook+Instagram while the footer
  hardcoded Instagram+Pinterest+YouTube, none of which matched the two accounts
  the shop actually runs. Both now render the new `SocialLinks` component off a
  single `SOCIAL_LINKS` list (Facebook + Pinterest). **The two URLs are still
  placeholders** — `https://facebook.com` / `https://pinterest.com`.
- **Footer links pruned.** `FOOTER_COLS` linked to twelve routes that 404:
  `/pages/{materials,process,bespoke,showroom,guarantee,delivery,trial,care,repairs,trade}`,
  `/collections/{study,storage}` and `/products/gift-card`. Only routes that
  resolve remain. This was a live bug, not just a copy issue.
- **No physical location.** The shop has no UK workshop or showroom to visit, so
  the address/appointment block came out of `ContactBanner`, the "Visit us"
  footer link, the workshop hours + "Visit the workshop" notes on `/contact`,
  `WORKSHOP_LOCATION`/`WORKSHOP_VISIT_NOTE`/`WORKSHOP_HOURS` in `lib/site.ts`,
  and "est. 1998 · Aldsworth, Cotswolds" in the footer copyright. "Made in our
  own workshop" as a *claim* stays — the client explicitly approved it.
- **25-year guarantee removed everywhere** ("labai cia slidi tema"): the
  homepage process step, the PDP highlight pill / assurance tile / Care
  accordion (now "Care & Finish"), the `/landing-oak` FAQ entry, and the
  `CraftStats` tile (→ "100% solid oak, no veneer").
- **"Our Textures" section deleted.** It re-rendered the same six categories as
  `CategoriesGrid` with wood-swatch photos. `TexturesGrid.tsx`, its ~145 lines
  of `.demo-textures`/`.demo-tex-*` CSS, and the three `textures_*` metaobject
  fields in `homeContent.ts` all went with it.
- **Categories are data-driven now.** `HERO_SHOWCASE_QUERY` aliased exactly six
  collection handles, so a seventh category needed a code change. It now reads
  `collections(first: 20)`, filters through `shouldHideCollection`, and orders
  by `HOMEPAGE_CATEGORY_ORDER` — a new collection appears with no deploy.
- **Footer tagline** no longer claims "a four-person workshop in the Cotswolds
  since 1998" (it contradicted the process section's "working since 2014").

### Second pass — client answers applied same day

- **Phone removed everywhere.** `CONTACT_PHONE_DISPLAY`/`_HREF` deleted; the
  `tel:` links are gone from the announcement bar, `ContactBanner`, the
  `/contact` channel list and its "Call …" button. Email is the only channel.
  Verified: no `tel:` anywhere in the rendered DOM.
- **Founding year is 2014.** `ValueMarquee`'s "Handcrafted Since 1998" → 2014
  (its "25-Year Repair Guarantee" item went too, with the rest of the guarantee
  copy).
- **"Jointed by hand" dropped** from `HOME_CONTENT_DEFAULTS.process.steps` —
  three steps now. ⚠️ **The live page still shows four.** Steps come from the
  `home_process_step` metaobjects, and defaults only apply when the metaobject
  is missing, so the entry must also be deleted in **Admin → Content →
  Metaobjects**. The same applies to the "backed by our 25-year repair
  guarantee" sentence in the "Oiled & finished" step — the code default is
  clean, the metaobject is not. See [[homepage-content]].
- **`most-popular` hidden from the category grid.** The new data-driven query
  surfaced it as an eighth "category" alongside the real ones — it is a curated
  merchandising list that drives the "Most popular" row, so it is now in
  `HIDDEN_COLLECTION_HANDLES`.
- **The 7th category already exists.** A `console-tables` collection is live in
  the store; the data-driven grid picked it up with no code change, which is the
  whole point of the change. Added to `HOMEPAGE_CATEGORY_ORDER` so it sits
  seventh deliberately rather than by fallback. Verified: 7 cards, ending
  "Console Tables | 1 product".
- **Footer social icons** were rendering at 35px inside their 36px chip — the
  old inline markup carried `width="16"`, which `SocialLinks` does not. Sized
  via `.footer-social-btn svg` in `app.css` instead of per-icon attributes.

### Still open

The two real social URLs (still `https://facebook.com` / `https://pinterest.com`);
the two metaobject edits above; and the remaining "Cotswolds" copy on `/about`,
`/landing-oak` and the FAQ.

### Not a code issue

`$`/`€` instead of `£` is the Shopify store currency — `lib/context.ts` already
requests `country: 'GB'`. The `hello@` mailbox is a DNS/hosting task. Hero and
workshop photography is metaobject-editable, no deploy needed.

## 2026-08-31 — Per-blog article listing (`/blogs/news`) was stacked instead of a grid

`blogs.$blogHandle._index.tsx` wrapped `<PaginatedResourceSection>` in
`<div className="blog-articles-grid">` instead of passing
`resourcesClassName="blog-articles-grid"` to the component itself.
`PaginatedResourceSection` renders its own outer `<div>` (Previous link +
items + Next link), so the grid class landed on the wrapper's only child —
a non-grid `<div>` — and the `ArticleCard`s inside it just stacked in
block flow instead of laying out 3-up. Fixed by passing
`resourcesClassName` directly, matching the pattern `collections.$handle.tsx`
already used correctly with `resourcesClassName="pgrid"`. Verified live:
`.blog-articles-grid` now computes `display: grid` with 3 equal columns.

## 2026-08-31 — Unified the review-photo lightbox, added thumbnail strip, lightened backdrop

The product page (`ReviewsSection`) had its own single-image `ImageLightbox`
with no next/prev navigation, while the homepage (`TestimonialsMarquee`)
used the shared `Lightbox` component with arrows/counter. Per user request,
unified both onto `Lightbox.tsx`: deleted `ImageLightbox` and the dead
`.rev-lightbox-backdrop`/`.rev-lightbox-img`/`.rev-lightbox-close` CSS.
Added a click-to-jump thumbnail strip (`.lightbox-thumbs`) between the
image and the `N / total` counter. Backdrop opacity dropped from `.92` to
`.5` (`rgba(28,28,28,.5)`) — supersedes the standalone `.rev-lightbox-*`
opacity tweak from earlier today, which is now moot since that class is
gone. Added a box-shadow to `.lightbox-img` for separation against the
now-lighter backdrop. Verified live on both the homepage testimonials and
a product page's review photos — same backdrop, same thumbnail strip.

## 2026-08-31 — Category pages default to Shopify's collection order (see [[../meta/decisions-log|ADR-0007]])

`collections.$handle.tsx` defaulted `sort` to `newest` (`CREATED`,
descending) instead of the collection's actual configured order. Added a
`featured` option to `SortDropdown.tsx`'s shared `SORT_OPTIONS`, made it the
new default on both `collections.$handle.tsx` (→ `sortKey:
COLLECTION_DEFAULT`, defers to the collection's manual/best-selling
`sortOrder` set in Shopify Admin) and `collections.all.tsx` (→ `sortKey:
BEST_SELLING`, since that route has no single collection to defer to).
Verified `/collections/solid-oak-coat-racks` now renders in the exact
manual order set in admin ("Coat Rack (Set of 2)", "Coat Rack", "Coat Rack
with Shelf") with no `?sort=` param.

## 2026-08-31 — Homepage "Most popular" now reads the real `most-popular` collection (see [[../meta/decisions-log|ADR-0006]])

`_index.tsx`'s `POPULAR_PRODUCTS_QUERY` was ranking the whole catalog by
`BEST_SELLING` instead of using the store's actual `most-popular` collection
(manual sort order, 11 curated products). Switched to
`collection(handle: "most-popular") { products(first: 16) {...} }` with no
`sortKey`, so it inherits the collection's `MANUAL` order set in Shopify
Admin — verified the first 8 rendered products match the admin order
exactly. Also fixed `ProductCarousel.tsx`/`FeaturedPicks.tsx` (unrelated,
`landing-oak.tsx`-only components) which had been typed against this
query's result shape by coincidence; retyped against the proper
`PopularProductItemLandingOakFragment`.

## 2026-08-31 — Header nav now reads from Shopify's `main-menu` (see [[../meta/decisions-log|ADR-0005]])

`Header.tsx`'s `HeaderMenu` rendered every nav link as hardcoded JSX even
though the loader already fetched `header.menu` from the Storefront API's
`main-menu` handle. Rewrote it to render `header.menu.items` generically —
a `resolveMenuItemUrl()` helper strips the item's absolute Shopify URL down
to a path, top-level items with nested `items` become a `.header-dropdown`
on desktop / indented list on mobile. Removed the now-dead `categories`
prop from `HeaderMenu` (it still feeds `HeaderSearch`'s tags, just not nav).
Also seeded the store's `main-menu` in Shopify Admin (via the
`claude.ai Shopify` connector, confirmed with the user first) to match the
old hardcoded structure: All products, a "By category" dropdown (7
collections), News, Contact — so nothing changed visually. Nav is now
editable from Settings → Navigation with no deploy.

## 2026-08-31 — Review lightbox backdrop lightened

`.rev-lightbox-backdrop` (`app/styles/app.css`) opacity dropped from `.88`
to `.7` per user request, so the review-photo lightbox background is more
transparent.

## 2026-08-31 — Product/collection pages loading slow: unsized `<img>` pulling full-res Shopify sources

Investigated via Chrome DevTools network + DOM inspection on the PDP and
`/collections/all`. Three components rendered product images as plain
`<img src={node.url}>` instead of Hydrogen's `<Image>` component, so the
browser downloaded Shopify's *full source resolution* file (PNG sources up
to ~2.9MB, ~230–270KB even after Shopify's automatic webp re-encode) for
every thumbnail-sized slot, with no `srcset`/`sizes` to let the browser
pick something smaller:

- `ProductItem.tsx` (product cards — collection grids, "Recommended for
  you", search results) — up to 5 gallery frames per card, all unsized.
- `SearchSuggestions.tsx` (header search-dropdown "Featured Products") —
  rendered (though visually hidden) on every single page load site-wide,
  so this was firing on every route, not just search.
- `CollectionCategoryNav.tsx` (40px sidebar category thumbnails on
  `/collections/$handle` and `/collections/all`) — same full-res pull for
  a 40×40 icon.

All three already had `width`/`height` on their GraphQL image fields, so
the fix was swapping the raw `<img>` for `@shopify/hydrogen`'s `<Image>`
(`aspectRatio="1/1"` + a `sizes` matching the actual rendered slot —
`120px` for search suggestions, `40px` for the sidebar icons, viewport
fractions for the responsive card grid). Verified via
`evaluate_script` reading `img.srcset`/`img.src` post-fix: requests now
carry `?width=&height=&crop=center` and land in the 100–600px range
instead of full source size. See `ProductImage.tsx` for the pattern this
follows (PDP main gallery was already correct).

## 2026-08-31 — CSP `img-src` missing, blocking inline `data:` SVGs

`app/entry.server.tsx`'s `createContentSecurityPolicy()` call defined
`scriptSrc`, `workerSrc`, `styleSrc`, `fontSrc` but never `imgSrc` — so
`img-src` fell back to `default-src` (`'self' cdn.shopify.com shopify.com
http://localhost:*`), which has no `data:` scheme. Any inline
`data:image/svg+xml;...` background image (e.g. a select/chevron icon
authored as an inline SVG data URI) was silently blocked by the browser
with a CSP violation in the console — the icon rendered as nothing, no
thrown error. Added an explicit `imgSrc: ["'self'", 'data:',
'https://cdn.shopify.com', 'https://shopify.com', 'http://localhost:*']`.
Requires a dev-server restart to pick up.

## 2026-08-31 — `.art-card` was using undefined CSS variables, not tokens

The article card (`.art-card`/`.art-card-img`/`.art-card-title`) predates
the CWF token system and referenced bare `var(--line)`, `var(--sand)`, and
`var(--primary)` — none of which are defined anywhere in `app.css` (the
project's tokens are all `--cwf-*`-prefixed; `--primary`/`--accent` only
exist inside an unrelated shadcn/ui `oklch()` block much further down the
file, for a different component family entirely). An undefined custom
property makes the property it's used in invalid, so `border: 1px solid
var(--line)` computed to no border at all — combined with the card's `#fff`
background sitting on the page's near-white `--cwf-surface`, the card read
as bg-less, which is what the user saw. Fixed:
- `border: 1px solid var(--line)` → `.5px solid var(--cwf-line)` (matching
  the border weight/token every other card in the site uses)
- `.art-card-img`'s `background: var(--sand)` → `var(--cwf-sand)`
- `.art-card-title`'s `color: var(--primary)` → `var(--cwf-primary)`
- `.art-card-date`/`.art-card-cta` were also on `var(--cwf-accent-deep)`
  (this one *was* a real token, just the wrong one per the dark-not-brown
  direction running through today's other entries) → `var(--cwf-ink-strong)`

Also `.blog-articles-grid`: `gap: 2rem` → `1rem`, and dropped
`margin-top: 3rem; margin-bottom: 4rem` — redundant with `.blog-index-section`
(the grid's actual container on both `blogs._index.tsx` and
`blogs.$blogHandle._index.tsx`) already providing `padding-top: 36px;
padding-bottom: 72px`, so the extra margins were compounding into oversized
gaps above/below and between cards.

## 2026-08-31 — "You may also like" on articles; `/blogs` shows articles directly

- **New `ArticleCard.tsx`** ([[components/common]]) extracted from the
  `ArticleItem` function that used to live only in
  `blogs.$blogHandle._index.tsx`, so it could be reused in two new places
  without duplicating the `.art-card` JSX.
- **`blogs.$blogHandle.$articleHandle.tsx`** (the article page) now has a
  "You may also like" section below the body: `ARTICLE_QUERY` additionally
  fetches `blog.articles(first: 5, sortKey: PUBLISHED_AT, reverse: true)`
  (new `RelatedArticle` fragment), the loader filters out the current
  article and caps at 3, rendered via `ArticleCard` in the same
  `.blog-articles-grid` used elsewhere.
- **`blogs._index.tsx`** ("Journal") rewritten: it used to list one card per
  *blog* (a "News" card with an "Open journal" button hiding the actual
  articles behind a click) — the user wanted articles themselves visible
  here, since the store only really has one editorial blog. New loader
  fetches `blogs(first: 10) { articles(first: 50, sortKey: PUBLISHED_AT,
  reverse: true) }`, flattens every blog's articles into one array, sorts
  newest-first client-side, and renders them directly via `ArticleCard` in
  `.blog-articles-grid` — same layout as `blogs.$blogHandle._index.tsx`'s
  per-blog listing. Holds up if a second blog is ever added (articles from
  both blogs interleave by date) without further code changes.
- Deleted now-dead `.blog-index-grid`/`.blog-index-card`/`.blog-index-cta`
  CSS (the blog-card grid `blogs._index.tsx` no longer renders) and their
  entry in the `@media (max-width: 980px)` block — confirmed no other route
  referenced these classes before removing.

## 2026-08-31 — Article page: image and body capped at 800px

`.article-page-image` (the hero image on a blog article) had no width cap —
it filled the full `.archive-wrap` (1320px+), while `.article-body`
underneath was already capped at 820px, so the image visibly overhung the
text column below it. Set `.article-page-image` to `max-width: 800px;
margin: 0 auto` (plus `display: block`, since a bare `<img>` is inline by
default and won't auto-center) and tightened `.article-body` from 820px to
800px to match exactly. Both now form one consistent 800px reading column.

## 2026-08-31 — CMS/article rich-text body: bullets, sizing, dark text

`.cms-page-body` (Shopify page/article `dangerouslySetInnerHTML` content —
`pages.$handle`, `policies.$handle`, and article pages via `.article-body`)
had three bugs surfaced by a merchant-added blog article and policy page:
- **Bullets were invisible.** `reset.css`'s global `ul { list-style: none;
  padding: 0 }` (there for nav/UI lists site-wide) also flattened real
  `<ul>/<li>` prose lists from Shopify's rich-text editor. Restored
  `list-style`/`padding-left` scoped to `.cms-page-body ul`/`ol`.
- **`<p>`/`<li>` text rendered at 17px, not 16px** — same root cause as the
  contact-card entry above: `.cms-page-body` sets `font-size: 16px` on the
  container, but reset.css's bare `p { font-size: 1rem }` (1rem = the site's
  17px root) out-specifies the inherited value on `<p>` tags specifically.
  Added explicit `.cms-page-body p, .cms-page-body li { font-size: 16px }`.
- **Body text was brown** — `color: rgba(74,47,31,.78)` hardcoded, same
  pattern as the PDP audit two entries below; switched to `color-mix(in
  srgb, var(--cwf-ink-strong) 78%, transparent)`.

Also added `.cms-page-body h1`/`h2`/`h3` scoped sizing (`clamp()`, same
approach as the contact-card entry) — merchant content occasionally opens
with its own `<h1>`, which would otherwise inherit the sitewide 56px h1/h2/h3
rule and blow out the column width. `strong` gets `var(--cwf-primary)` +
bold (was inheriting default browser bold with body's muted color, low
contrast) — an emphasis token, not touched per the "headings/emphasis stay
walnut" precedent.

## 2026-08-31 — Contact card heading was oversized

`.contact-primary-card`'s `<h2 className="title">No ticket desk, no
chatbot, no fake form.</h2>` had no scoped size, so it inherited the bare
`h2` rule's `56px` — fine for a full-width section head, but this h2 sits in
a ~540px boxed card (`.contact-primary-card`) and wrapped to 3 oversized
lines. Added `.contact-primary-card .title { font-size: clamp(24px, 3vw,
32px); line-height: 1.25; }` in `app.css`; now sits on one line at a size
proportionate to the card.

## 2026-08-31 — Breadcrumbs everywhere, `.btn-primary` dark, PDP/contact polish

- **`.btn-primary` (sitewide filled CTA) is now dark, not walnut.** The user
  pasted the exact rule after the PDP audit above and said it "still not
  updated" — this is a deliberate escalation past the two prior entries'
  "leave branded CTAs walnut" calls. `background`/`border-color` and the
  `:hover` state moved from `--cwf-primary`/`--cwf-primary-dark` to
  `--cwf-ink-strong`/`--cwf-ink-strong-hover` (the same pair already used by
  `.header-cart-btn:hover` and, from the entry above, the option-picker
  buttons). Affects every `.btn.btn-primary` site-wide — "Order now" on PDP,
  "Email the workshop" on Contact, etc. **Not** touched: `.demo-btn-solid`
  (homepage hero "Shop All Products" — a different, orange-accent button
  class, not `.btn-primary`) and `.pdp-sticky-bar .pdp-atc-btn`'s inverted
  cream-bg/walnut-text variant (not raised).
- **New `Breadcrumbs.tsx`** ([[components/common]]) extracted from the
  hand-written markup that only existed on `products.$handle.tsx`, and
  mounted on every other content route per "place crumbs on all pages except
  landing[s]": `collections.$handle`, `collections.all`, `collections._index`,
  `blogs._index`, `blogs.$blogHandle._index`, `blogs.$blogHandle.$articleHandle`,
  `contact`, `about`, `pages.$handle`, `policies.$handle`, `search`. Skipped
  `policies._index` (still an unstyled scaffold page, no `.archive-page` to
  anchor it in — needs its own redesign pass first) and, per "except
  landing[s]", `_index` (homepage), `landing-oak`, `coming-soon`, plus
  `account.*`/`cart.*` (transactional flows, not content pages).
- **`.crumb` text is default case, not caps**: removed
  `text-transform: uppercase` and its `.08em` letter-spacing (wide tracking
  reads wrong on mixed-case text) from `.crumb` in `app.css`; bumped
  `font-size` 12px → 13px since caps-tracking was partly compensating for
  legibility at the smaller size.
- **`.pdp-main-img` aspect-ratio**: `1/1.05` → `1/1` (was very slightly
  taller than square, visible as a small vertical crop on the main PDP
  image).
- **Contact page's "Get in touch" card**: `.contact-channel-label`/
  `.contact-note-label` ("EMAIL", "PHONE", "WORKSHOP HOURS", "VISIT THE
  WORKSHOP") went `--cwf-accent-deep` → `--cwf-ink-strong`; the description
  text under each channel and the note paragraphs
  (`.contact-channel span:last-child`, `.contact-note p`) went from
  hardcoded `rgba(74,47,31,.7)` to `color-mix(in srgb, var(--cwf-ink-strong)
  70%, transparent)` (same audit pattern as the PDP entry below) **and**
  gained an explicit `font-size: 16px` — they had none before, so they
  inherited `html,body`'s `font-size: 17px` (`app.css` sets the site's rem
  base to 17px, not the browser default 16px) rather than the 16px other
  pages set explicitly. `.contact-channel strong` (email/phone values) and
  `.contact-channel-icon` (icon color) were left on `--cwf-primary`/
  `--cwf-accent-deep` — not raised, same emphasis/icon-accent reasoning as
  elsewhere.

## 2026-08-31 — PDP full color audit: every remaining brown text/hardcoded rgb

The user flagged `.pdp-sub` (description paragraph) and `.pdp-acc-body`
(accordion body) still reading brown, plus asked for a full re-audit of the
page (not just the classes already touched) and a check for hardcoded colors.
Root cause: `.pdp-sub`/`.pdp-acc-body` and most other PDP muted/secondary
text used `rgba(74, 47, 31, X)` — the raw decomposed RGB of `--cwf-primary`
(#4a2f1f) — hardcoded directly rather than referencing a token, so none of
this turn's earlier `var(--cwf-accent-deep) → var(--cwf-ink-strong)` sweeps
ever touched it (different property value entirely, same visual "brown").

Audited every `.pdp-*`/`.product-opt*`/`.crumb*`/`.rev-*`/`.tcard`/`.tgrid*`/
`.unit-toggle*` rule actually rendered on the product page (cross-checked
route + component `className`s against `app.css`, not just grepped by
prefix — this surfaced dead CSS like `.rcard`/`.rev-score`/`.rev-card` that
looked PDP-related but is never rendered, since `ReviewsSection.tsx` and the
related-products block actually use `.tcard`/`.tgrid-*` and `.pgrid`/
`ProductItem` respectively). For every rule that renders real body/label
text, replaced the hardcoded `rgba(74, 47, 31, X)` with
`color-mix(in srgb, var(--cwf-ink-strong) X%, transparent)` — same opacity,
now a token instead of a raw triplet:
- `.pdp-sub`, `.pdp-acc-body` (the two the user pointed at directly)
- `.pdp-price-from`, `.pdp-price-vat`, `.pdp-rating-row`, `.pdp-rating-sep`
- `.pdp-guarantee`, `.pdp-guarantee-sep`, `.pdp-assure-small`, `.pdp-spec-sub`
- `.crumb` (the HOME / COLLECTIONS / … breadcrumb text)
- `.tcard .rl` and `.tgrid-count` (→ flat `var(--cwf-ink-strong)`, no
  transparency needed there) — the actual review-marquee/rating-summary
  classes `ReviewsSection.tsx` renders on the PDP
- `.unit-toggle-opt` (the in/cm toggle) — text was `--cwf-accent-deep`; also
  changed `.unit-toggle-opt.is-active`'s background from `--cwf-primary`
  walnut to `--cwf-ink-strong`, matching the option-button precedent set two
  entries below

**Deliberately left alone** (confirmed each is either non-text or
intentionally not in scope):
- Border-colors and background tints at low opacity
  (`rgba(74,47,31,.2–.25)` borders, `.03` background tints on
  `.pdp-carousel-dot`, `.pdp-wish-btn`, `.pdp-qty`, `.product-opt-select`,
  `.product-optn`, `.product-opt-progress-step`, table zebra-striping) —
  these are structural/decorative, not readable text
- `.pdp-info h1`, `.pdp-price-big`, `.pdp-highlight-item`,
  `.pdp-assure-strong`, `.pdp-acc summary`, `.pdp-spec-val`,
  `.crumb-here`/`.rev-score .big`/`.rev-card .headline`/`.tcard q`/`.tcard
  .nm` (dead code aside) — all `var(--cwf-primary)` walnut used for
  headings/emphasis/price, the brand's intended use of that token, not
  incidental brown body text
- `.pdp-viewing`/`.pdp-urgency` (hardcoded amber/orange, not
  `--cwf-accent-deep` or the primary-rgb pattern) — intentional
  urgency/social-proof accent colors, same reasoning as leaving the star
  icon gold
- `.pdp-maker`/`.maker` section and its `rgba(243,239,234,X)` — light text on
  a dark (`--cwf-dark`) background, not brown-on-white
- `.rcard`, `.rev-score`, `.rev-card`, `.pdp-reviews .rhead` — confirmed dead
  CSS (no component renders these classNames); left as-is rather than
  scope-creeping into a cleanup pass
- Non-PDP selectors that also use `--cwf-accent-deep`/raw primary-rgb
  (`.page-header`/`.page-breadcrumb` on collection pages, `.eyebrow` used
  homepage-wide, `.hero-showcase-*`, `.sale-carousel-*`, etc.) — out of
  scope, this audit was PDP-only per the request

No inline `style={{color: ...}}` or other hardcoded-color `style` props
found on any PDP-rendered component (`products.$handle.tsx`, `ProductForm`,
`ReviewsSection`, `ProductPrice`, `UnitToggle`, `ProductModel3D`,
`ProductImage`) — the two `style={{}}` usages that exist are dynamic
layout percentages (progress-bar fill/step position), not colors.

## 2026-08-31 — PDP option buttons: dark instead of walnut brown (user override)

The entry below deliberately left `.product-optn` (unselected option-button
text) and `.product-optn[data-selected="true"]` (selected button's
background/border) on `var(--cwf-primary)` walnut, reasoning it was a
branded button fill like the "Order now" CTA. The user explicitly asked for
these too, overriding that call — changed both to `var(--cwf-ink-strong)`:
unselected text, the hover border, and the selected state's
background+border (selected text stays `#f3efea` cream, unchanged, still
reads correctly on the now-charcoal fill instead of walnut).

`.pdp-atc-btn`/"Order now" CTA was **not** touched — the user's correction
was scoped to the option-picker buttons (`Sanded`/`Standard`/etc.), not
raised against the CTA.

## 2026-08-31 — PDP option values: dark instead of walnut brown

Follow-up to the entry below: after the eyebrow/label fixes, the *values*
next to those labels still read brown — `.product-opt-picked` (the "Sanded",
"Standard", "Clear + Black" text at the right of each option row) and
`.product-opt-select` (the Size dropdown's own text) were colored
`var(--cwf-primary)` (#4a2f1f, walnut), not `--cwf-accent-deep` — a
different, darker brown that the earlier pass didn't touch since it's the
same token used for h1s and primary CTAs, i.e. treated as "already dark".
Against the now-ink-strong labels beside them the walnut still reads warm,
so switched both to `var(--cwf-ink-strong)`. Also recolored the native
`<select>`'s inline SVG chevron from `#4A2F1F` to `#352f2a` (ink-strong's
hex — CSS custom properties don't work inside a `background-image` data URI)
to match.

Deliberately **left unchanged**: `.product-optn[data-selected="true"]`'s
walnut background and the "Order now" CTA — those are branded button fills
(same convention as the site's other primary buttons), not incidental body
text, so they stay walnut on purpose.

## 2026-08-31 — PDP labels/links: dark instead of brown

Same dark-not-brown direction as the two entries below, applied across the
product page (`products.$handle.tsx` + `ProductForm.tsx`). Changed
`color: var(--cwf-accent-deep)` → `var(--cwf-ink-strong)` in `app.css` for:
- `.pdp-info .eyebrow`, `.pdp-specs-head .eyebrow`, `.pdp-related-head .eyebrow`,
  `.pdp-reviews .rhead .ey`, `.pdp-related .related-head .ey` — the small
  uppercase eyebrow labels above PDP section headings
- `.pdp-rating-link` ("See reviews"), `.pdp-sub-toggle` ("Show more")
- `.product-opt-label` (UNITS / SIZE / OIL COLOUR + HOOKS COLOUR / WORKING
  TYPE / HEIGHT ALLOWANCE — the variant-option row labels)
- `.product-opt-progress-label`, `.product-opt-note` (length-slider step
  labels and the small helper note under an option row)
- `.pdp-spec-label` (spec-grid labels lower on the page)

Deliberately **left unchanged**: `.pdp-viewing` ("N viewing now", `#a05c2a`)
and `.pdp-urgency` (the "Made to order · N slots left" amber banner,
`#92400e`/`#fef3c7`) — these are intentional urgency/social-proof accent
colors, not generic label text, same reasoning as leaving the star icon gold
in the product-card-rating entry below. The sitewide `.eyebrow` class (used
on non-PDP pages — homepage section headers, etc.) was **not** touched; only
the PDP-scoped selectors that override it.

## 2026-08-31 — Product card rating text: dark instead of brown

`.pcard-rating` (the "4.0 ★ (4 reviews)" line under a product card's name)
was colored `var(--cwf-accent-deep)` (brown/oak) for both the number and
review count. Changed to `var(--cwf-ink-strong)` (dark charcoal), matching
the same dark-not-brown direction as the filter headings below. The star
icon itself is untouched — it keeps `var(--cwf-star)` (gold) via its own
`.pcard-rating svg` rule, since that's the intended accent, not incidental
brown text.

## 2026-08-31 — Filter headings: no divider, dark instead of brown

Follow-up to the Categories-heading tweak below: the same request now
applies to every sidebar filter heading, not just Categories. Changed the
shared `.filters-content h4` rule directly (`app.css`) instead of adding more
one-off overrides:
- Removed `border-bottom` and `margin-bottom` — `padding-bottom: 12px` alone
  now supplies the gap to the content below, so Price/Categories/Availability
  all look identical to what `.category-nav h4`'s override produced.
- Color changed `var(--cwf-accent-deep)` (brown/oak) → `var(--cwf-ink-strong)`
  (dark charcoal, `#352f2a` — same token the header nav text uses).

Since the base rule no longer has a border/margin to strip, the now-redundant
`.category-nav h4 { border-bottom: none; margin-bottom: 0; }` override (added
in the entry below) was deleted.

## 2026-08-31 — Collection sidebar filter order: Price, Categories, Availability

`CollectionFilters.tsx` used to render Availability/other list filters first,
then Price, with `CollectionCategoryNav` rendered as a separate sibling above
it (order: Categories, Availability, Price). Requested order is Price,
Categories, Availability instead.

Rather than reorder three independently-rendered pieces at each of the four
call sites (desktop sidebar + mobile drawer, on both `collections.$handle.tsx`
and `collections.all.tsx`), `CollectionFilters` now takes an optional
`categoriesSlot: ReactNode` prop and owns the fixed order internally: Price →
`categoriesSlot` → Availability/list filters → Clear all. `CollectionCategoryNav`
no longer renders its own `.filters-content` wrapper (it's always nested
inside `CollectionFilters`'s one now) — just the `.fblock`. See
[[components/common]].

Follow-up: the shared `.filters-content h4` rule (used by every filter block
heading — Price, Availability, etc.) gives each heading a bottom border and
14px margin as a divider from its own content below. `.category-nav` already
carries a border-bottom + margin below the whole block for separation from
what follows, so that same divider under just the "Categories" heading text
read as a duplicate line. Added `.category-nav h4 { border-bottom: none;
margin-bottom: 0; }` to `app.css` to strip it — scoped to `.category-nav`
only, so Price/Availability headings keep their divider.

## 2026-08-31 — Collection sidebar: categories moved from top row into filters

- `collections.$handle.tsx` and `collections.all.tsx`: the horizontal
  "Console Tables / Cube Blocks / …" category-card row that sat above the
  product grid (`.category-row`/`.category-card`, deleted as dead CSS once
  unused) is gone. Collections now render as a "Categories" block at the top
  of the sidebar (`.shop-sidebar` desktop, `.mob-filter-body` mobile),
  above Availability/Price — new shared `CollectionCategoryNav.tsx`
  ([[components/common]]).
- `collections.$handle.tsx`: loader var renamed `siblingCollections` →
  `sidebarCategories`; the current collection is now **included** in the
  list (was excluded) so it can render highlighted via `activeHandle`,
  matching how a sidebar category nav conventionally shows "you are here".
  Query renamed `SIBLING_COLLECTIONS_QUERY` → `SIDEBAR_CATEGORIES_QUERY` to
  match.
- Both routes cap the sidebar list at 8 collections (`.slice(0, 8)`,
  filtered through `shouldHideCollection` same as before) — the full
  catalog only has 7, so nothing is currently cut off, but a future
  9th+ collection would need a "show more" if this becomes a real limit.

## 2026-08-31 — Product card image gallery nav + header search suggestions

- `ProductItem.tsx`: the crossfade-on-hover two-image swap (`featuredImage` +
  one other) is now a full gallery scrubber. Hovering a `.pcard` reveals
  chevron arrows and progress dots overlaid on the image (styled after
  `HeroCarousel`'s `.demo-hero-nav`/`.demo-hero-dot`, but white-on-dark since
  the card has no strip below the image to host it in) — up to 5 images,
  clickable without triggering the card's outer `Link` navigation. New CSS:
  `.pcard-img-nav`, `.pcard-img-arrow`, `.pcard-img-dots`, `.pcard-img-dot` in
  `app.css`.
- Header/aside search no longer opens to an empty panel. New
  `app/components/SearchSuggestions.tsx` renders "Popular Search" tags (real
  collection titles from `header.collections`, already fetched by
  `HEADER_QUERY`) and a "Featured Products" row while the search field is
  focused but has no term yet, used by both `HeaderSearch.tsx` (inline
  desktop dropdown) and `PageLayout.tsx`'s `SearchAside` (mobile aside).
- Added `app/lib/searchSuggestions.ts` — `SEARCH_SUGGESTIONS_QUERY` (best
  sellers, `EXCLUDE_HIDDEN_PRODUCTS_QUERY`-filtered like the homepage) plus
  `buildFeaturedSearchProducts`. Fetched in `root.tsx`'s `loadDeferredData`
  (cached long, deferred so it never blocks TTFB) and threaded through
  `PageLayout` → `Header`/`SearchAside` as a promise, resolved with
  `<Await>`/`<Suspense>` inside `SearchSuggestions`.

## 2026-08-27 — catalog: Figma hero images + status cleanup (Shopify data only)

Store-side change (no repo code touched), done via the Shopify Admin API.

- Pulled the 11 product renders from Figma file `rofOs7HDouBaGx36STSZuP`,
  section `256:1992` ("Section 2", items 2–12), as 1254×1254 PNGs and added
  each as new product media, moved to position 0 so it is the featured image.
- Products updated (all now ACTIVE): Oak Mantle Beam with Corbels, Oak Mantle
  Beam Flamed, Oak Fireplace Surround, Coat Rack with Shelf, Coat Rack,
  Coat Rack (Set of 2), Solid Oak Shelf with Brackets, Solid Oak Floating
  Shelf, Oak Doorstop, Console Table with Hairpin Legs, Solid Oak Block.
- `Solid Oak Shelf with Brackets` and `Console Table with Hairpin Legs` were
  also published to the **Wood Headless** channel (publication `342742139222`)
  — they were ACTIVE but unpublished, so they would not have rendered.
- Every other product (23: the legacy `- Part 1` Etsy imports plus
  `Mantle Beam`, `Oak Mantle Beam`, `Solid Oak Fireplace Beam Mantel …`) set
  to DRAFT. `Oak Mantle Beam (Copy)` left ARCHIVED.
- `Height Allowance Surcharge` and `Working Type Surcharge` deliberately left
  ACTIVE — they are checkout add-on line items, not catalog products.

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-08-27 — Product card titles clamp to one line

`.pcard-name` was `-webkit-line-clamp: 2`, so titles like "Oak Mantle Beam with
Corbels" took two lines while their neighbours took one, leaving the rating and
price rows on a grid row out of alignment. Now clamped to 1.

Added `overflow-wrap: anywhere` alongside it so a single unbroken long word
clips rather than pushing the card wide.

Verified every title renders at one line-height (23px) and every `.pcard-heading`
is a uniform 41px, on desktop and at 375px, with 2 titles ellipsised on desktop
and 5 on mobile. `pages.favourites.tsx` shares `.pcard-name` and picks up the
same clamp.

Note when checking this: `-webkit-box` line clamping wraps the text and then
clips it, so truncation shows up as `scrollHeight > clientHeight` — a
`scrollWidth > clientWidth` check (the usual `nowrap` test) reports zero and
looks like the clamp is not working.

## 2026-08-26 — PDP shows the side thumbnail gallery on desktop again

The product page rendered the swipeable carousel at every width. The desktop
layout — an 88px thumbnail rail beside a large main image — was already fully
built (`.pdp-gallery`, `.pdp-thumbs`, `.pdp-main-img`, with `activeItem` state
and 3D-model handling), but a blanket `.pdp-gallery { display: none !important }`
disabled it everywhere. It came in with unrelated header work in `eeefa52` and
sat above the real `display: grid` rule, which `!important` beat.

Removed that line and made the split explicit: `.pdp-gallery` on ≥981px,
`.pdp-carousel` on ≤980px, exactly one displayed at any width. No component
changes were needed — the markup was already there.

Fixed a real cost this exposed: the 6 thumbnails inherited `ProductImage`'s
default `sizes="(min-width: 45em) 50vw, 100vw"` and each downloaded a ~712px
file for an 88px slot. `ProductImage` now takes an optional `sizes` prop and the
rail passes `88px` — verified the thumbs load at 88px natural width while the
main image still resolves to 600px for a 569px render.

Two follow-ups once it was visible:

**Sticky offset.** `.pdp-gallery` stuck at `top: 88px` under a header that is
actually 133px, so it sat behind the header. Added a `--cwf-header-h` token and
offset from it. The 88px looks like a measurement taken before webfonts loaded —
the header reads 117px pre-Outfit, 133px after — so the token's comment says to
measure with fonts settled. `.filter-bar` (68px) and `.shop-sidebar` (160px) are
on the same kind of hardcoded guess and were left alone for now.

**The rail was setting the gallery's height.** With 10+ images the thumb column
ran ~900px past the photo, which also meant the gallery consumed its entire
sticky range within one screen — the two reports had one cause. `.pdp-thumbs` is
now absolutely positioned with `overflow-y: auto`, so the main image sets the
height and the rail scrolls inside it. That required pinning `.pdp-main-img` to
`grid-column: 2`: as the only in-flow item it had been auto-placing into the 88px
rail column and collapsing to 92px tall.

Verified 6 thumbs stacked left of the main image, clicking one swaps the main
image and moves `.active`, carousel hidden on desktop and shown at 375px with 6
slides and 6 dots, no horizontal overflow at either. Rail height tracks the main
image exactly (574px) and still does with 14 thumbs (1362px of content, scrolls
internally). Sticky holds at 149px with 17px clearance from scroll 400 to 1200,
releasing only when the grid ends.

## 2026-08-26 — Collection grid goes 3-up on tablets

`.pgrid` jumped straight from 4 columns to 2 at 980px. On collection pages that
left a landscape tablet showing four ~150px cards, because the grid shares its
row with the 240px filter sidebar (+40px gap) and gets ~280px less width than the
homepage does at the same viewport.

Added a 3-up step for 981–1280px, scoped to `.shop-layout .pgrid`. Deliberately
not global: at 1024px the homepage grid renders 4 cards at 218px, which is exactly
the Figma card width (node `250:2911`), so it does not need the step and would
lose a column for nothing. 1280px is where 4-up stops holding that 218px width in
the sidebar layout.

The media query is bounded at both ends. `.shop-layout .pgrid` outranks `.pgrid`
on specificity, so an unbounded `max-width: 1280px` would have overridden the
2-up rule below 980px and stopped the grid collapsing at all — verified 2-up at
979px, 3-up at 1024/1201, 4-up at 1281.

See [[design-system]] § Product grid breakpoints.

## 2026-08-26 — Product card body split into two blocks

`.pcard-body` was a flat column of four siblings (name, rating, price row,
swatches). It's now two groups: `.pcard-heading` holds the name + rating,
`.pcard-bottom-row` already held price + swatches. The card can now space "what
it is" apart from "what it costs" without touching the rhythm inside either.

Spacing then went to Figma (node `250:2911`), which the new structure maps onto
exactly: name h24 at y0, rating h14 at y28 (**4px** apart), group h42, bottom
container at y58 (**16px** below). The old flat layout produced 20px above the
rating — `.pcard-body`'s 16px gap plus a stray 4px `margin-top` — so that is now
a single `gap: 4px` on `.pcard-heading` and the margin is gone.

`.pcard-rating` also needed `line-height: 1`. It was inheriting `body`'s
`line-height: 22px`, making the 14px row 22px tall; the ~4px of half-leading sat
above the text and read as an 8px gap under the name however the `gap` was set.
Its `min-height: 18px` went with it — that only existed to hold space for the
hidden empty state, which no longer exists. Measured 4px/16px with a 14px rating
row against Figma's 4/16/14.

`pages.favourites.tsx` also uses `.pcard-body`/`.pcard-name` but has no rating or
bottom row, so it is unaffected.

## 2026-08-26 — Unrated product cards show 0.0 instead of a blank gap

`.pcard-rating` used to render an empty div with `visibility: hidden` when a
product had no reviews — the row reserved its 18px but showed nothing, so cards
looked like the rating had failed to load rather than like the product had no
reviews yet.

It now always renders the score: `0.0 ★ (0 reviews)`. `getRatingSummary` still
returns `null` for "no data" — that stays an honest signal — and the zero is a
presentation fallback in the JSX, not a fake summary object.

The star is muted on `.is-zero` (`color-mix` off `--cwf-ink-strong`, per the
"alpha variants are mixed off the token, never re-declared as rgba()" rule).
A full-strength gold star next to 0.0 reads as a real rating at a glance.

Also dropped the `aria-hidden` that used to sit on the empty state — "0.0, 0
reviews" is real information, so screen readers should get it.

## 2026-08-26 — Homepage copy & imagery moved into metaobjects

Every heading, subheading, button label, hero slide and the workshop photo on
the homepage is now editable from Shopify Admin instead of living in the source.
See [[homepage-content]] for the model and field conventions.

Three merchant-owned metaobject definitions (`home_page` singleton,
`home_hero_slide`, `home_process_step`), created via the Admin API rather than
`shopify.app.toml` — this is a Hydrogen storefront, not an app, so there is no
app TOML to declare them in. Seeded with the exact copy that was already live,
so the rendered page is byte-for-byte what it was.

`HERO_BLURBS`, `BRAND_HERO_SLIDE`, `buildHeroSlides` and `HERO_SLIDE_LIMIT` are
gone from `_index.tsx`. The single-slide behaviour from earlier today is now
data, not a constant: one `home_hero_slide` entry exists, and adding a second in
admin brings the arrows and dots back on its own. The collection-derived slides
that `HERO_SLIDE_LIMIT` was hiding are not rebuilt — a merchant who wants a
per-collection slide creates one and picks the image.

`app/lib/homeContent.ts` holds the query, the types and
`HOME_CONTENT_DEFAULTS` — a complete fallback set merged field-by-field, so a
missing metaobject, an unreachable API or a field the merchant blanked all
render the previous copy rather than an empty heading.

**Verified live.** The Storefront API serves the entries, both images resolve to
`cdn.shopify.com`, and an admin edit to `categories_heading` came back changed on
the next request (reverted after). `buildHomeContent` also passes 19/19
assertions against a mocked response.

Getting there took a wrong turn worth recording: the definitions and entries were
first created **on the wrong Shopify store**, because the MCP connector was
authorized elsewhere and the shop was never verified before writing. The writes
succeeded, so the only symptom was the Storefront API returning `null` — which
was then misdiagnosed as a missing `unauthenticated_read_metaobjects` scope on
the Headless channel, and that wrong conclusion briefly reached this changelog,
ADR-0004 and PR #3. No scope change was ever needed. See
[[homepage-content]] § Verify the shop before writing for the tells that were
missed and the check to run first.

## 2026-08-26 — Hero reduced to a single slide

The hero now shows only the brand slide ("Timeless Oak. Made for Your Home.")
instead of that plus six per-collection slides.

Done as `HERO_SLIDE_LIMIT = 1` with a `.slice()` at the loader's call site
rather than by deleting the slide-building code — this was asked for as "for
now", so `buildHeroSlides` still assembles every collection slide and raising
the constant (or dropping the slice) restores the full carousel. Deleting it
would also have left `collectionSlides` unused and tripped lint.

`HeroCarousel` now renders `.demo-hero-nav` only when there's more than one
slide. With a single slide the arrows would re-render the same content
(`goTo` is modulo the slide count) and the lone dot reads as a broken carousel.
Autoplay was already guarded by `activeSlides.length < 2`; confirmed the
heading doesn't change after 4s.

## 2026-08-26 — Review photos open a lightbox; process cards pin icon/copy

**Lightbox on the testimonials marquee.** `.demo-review-photo` was an inert
`<span>`; it's now a `<button>` that opens a full-screen preview.

Reused `app/components/Lightbox.tsx` rather than writing a third overlay — it
already had arrows, a counter and Escape handling, and was sitting unused (noted
in the lint cleanup earlier today). Two things it needed first:

- `createPortal` to `document.body`. `.demo-review-track` is
  transform-animated, and a transformed ancestor becomes the containing block
  for `position: fixed` — the same trap that had the PDP review lightbox opening
  ~1600px off-screen. Fixed here *before* wiring it up rather than after.
- `button.demo-review-photo` styling, `button.`-prefixed so it outranks
  `button.reset { background: inherit }`.

The marquee renders each row twice for the seamless loop. The clones now get
`aria-hidden` and `tabIndex={-1}`, so the duplicate photo buttons stay
mouse-clickable (they're visible) without doubling every tab stop.

Verified: opens portalled to `<body>`, covers the viewport, image centred,
arrows page 1/2 → 2/2, closes on Escape and on backdrop click.

**Process cards.** Title and body moved into `.demo-process-card-copy`, and the
card switched from `justify-content: flex-end` to `space-between`. The icon now
sits at the top, the copy at the bottom, and the gap between absorbs the
difference in copy length — measured 49px on the short cards and the 24px
minimum on the long ones, with all four aligned on both edges.

## 2026-08-26 — Categories show all 6 in one row on desktop again

Mobile (≤620px) now shows **2.2 cards** —
`flex: 0 0 calc((100% - 2 * 12px) / 2.2)`, giving two full cards plus a sliver
of the third so the strip reads as swipeable. The old `68%` basis with
`min-width: 220px` / `max-width: 280px` clamps produced ~1.4-up: at 375px the
220px minimum overrode the percentage entirely, so the clamps had to go.

`.demo-cat-image` also swaps its fixed `height: 206px` for
`aspect-ratio: 1 / 1`, so the tile stays square at whatever width the basis
resolves to instead of getting taller-than-wide as cards narrow.

`.demo-cat-card`'s desktop basis goes 4-up → **6-up**
(`calc((100% - 5 * 16px) / 6)`), so every category is visible without paging —
207px cards at 1440px.

Nothing else had to change: `CategoriesGrid` measures cards-per-view, so 6
cards at 6-up computes to a single page and the component simply doesn't render
`.demo-cat-nav`. Confirmed at 1440px (6 in view, no overflow, no nav) and at
1000px, where the 3-up rule still applies and paging returns with 2 dots.

This partly reverts the desktop half of the earlier carousel change — the
carousel now only does work below 1080px, which is where it was actually
needed.

## 2026-08-26 — Hero copy grouped; section sub-paragraphs unified on #352f2a

**Hero.** Rating, `h1` and blurb now sit in a `.demo-hero-copy` wrapper with a
24px internal gap, and `.demo-hero-content` carries a single 48px gap between
that block and the CTAs. Previously one 24px gap governed all four children, so
the CTAs couldn't be spaced independently of the copy rhythm.

Removed `margin-top: 8px` from `.demo-hero-ctas` in the same pass — a leftover
from the old single-gap layout that made the measured copy→CTA distance 56px
instead of 48px. Measured in the browser: 24 / 24 / 48 exactly.

**Section sub-paragraphs.** `.demo-categories-sub` (#61482e),
`.demo-textures-sub` (#474747) and `.demo-process-sub` (#61482e) were three
different colours for the same role. All now use `var(--cwf-ink-strong)`.
`.demo-contact-heading p` stays light — it sits on the dark panel.

**Card labels.** Same move for `.demo-cat-title` / `.demo-cat-count` and their
texture twins `.demo-tex-title` / `.demo-tex-count`, all previously #61482e.
The counts keep `opacity: .7` — that's the intended hierarchy against the
title, not a second colour.

Still warm brown and deliberately untouched: the `.demo-categories-all` /
`.demo-textures-all` links. They read as accent links rather than body copy —
flag if they should join the ink.

## 2026-08-26 — Price row shares one colour; `--cwf-header-ink` renamed

Both halves of the card price row are now `#352f2a`. The eyebrow was a faded
`rgba(122, 90, 58, .45)` and the value the warm `--cwf-primary`.

That colour had been sitting under `--cwf-header-ink`, named for the one place
it first appeared. It's since spread to the contact panel, the demo headings and
now card prices, so referencing "header ink" from a product price would have
been misleading. Renamed to **`--cwf-ink-strong`** (and
`--cwf-ink-strong-hover`) across all 25 references in `app.css` / `demo.css`;
zero old references remain, and header nav + cart pill were re-checked in the
browser after the rename.

Still differing from the supplied reference, left as-is pending a decision: the
reference renders "From" at the same size and in sentence case as the price,
where the eyebrow is 11px uppercase with letter-spacing.

## 2026-08-26 — Product card price row unified on Outfit 600

`.pcard-price-eyebrow` ("FROM") was Plus Jakarta Sans 600 while
`.pcard-price-value` was Mark Bold 700 — two faces sitting on the same
baseline. Both are now Outfit 600.

**This needed a font-loading change, not just a CSS one.** The self-hosted
`@font-face` for Outfit declares **weight 500 only**
(`/fonts/outfit-medium.ttf`), and Outfit 600 was requested solely by the
route-level `links()` in `_index.tsx` / `landing-oak.tsx`. `.pcard` is
site-wide, so on `/collections/*`, PDPs and search the browser would have
picked the 500 face and synthesised a faux-bold. `Outfit:wght@400;500;600` is
now in the **root** Google Fonts link, and `document.fonts.check('600 16px
Outfit')` returns true on `/collections/all`.

General rule this is the second instance of: **before setting a weight, check
that the weight actually exists** — the self-hosted faces here cover exactly
one weight each (Outfit 500, Mark Bold 700), so anything else silently
synthesises.

## 2026-08-26 — Announcement bar: capped width, Facebook replaces mail, filled Instagram

- The dark band stays full-bleed but its content now lives in
  `.announcement-bar-inner`, capped at **1400px** — the same as
  `.header-topbar`, so the socials and contacts sit on the same vertical lines
  as the logo and cart button directly below them. Verified aligned at 1700px.
- The mail icon is gone; **Facebook** takes its place, using the
  designer-supplied `Link.svg` path recoloured to `currentColor`. Its viewBox
  is cropped to the glyph (`4.48 4.98 20.20 20.20`) rather than kept at the
  30x30 artboard it shipped in — the mark only occupies x 10-19.2 / y 6.7-23.5,
  so at the original viewBox it inked 9.5px against Instagram's 14.2px in the
  same 17px box. The crop makes the glyph fill 83.3% of its height, matching
  Instagram's ratio, and both now measure 14.2px. **Check the inked bounds, not
  the artboard, when dropping in a supplied SVG next to an existing icon.**
- Instagram is now solid. Tabler's webfont has no filled glyphs (see
  [[../frontend/design-system]]), so both marks are inline SVGs in
  `Icons.tsx` alongside `StarFilledIcon`/`HeartFilledIcon`. The Instagram mark
  is a single `fill-rule="evenodd"` path: the body fills, the lens ring and
  flash punch back out — no separate mask or nested shapes needed.

`FACEBOOK_URL` in `site.ts` is a **placeholder** (`https://facebook.com`), the
same as the footer's existing social links. It needs the shop's real page before
launch.

## 2026-08-26 — Live homepage showed 4 categories, local showed 6

Not a bug in the code — the deployed `buildCategories`/`TexturesGrid` are
byte-identical to local. **Local dev and production use two different headless
storefronts on the same shop**, and `solid-oak-fireplace-surrounds` and
`solid-oak-cube-blocks` are published to the local one only. The Storefront API
returns `null` for an unpublished collection and `buildCategories` filters nulls
out, so the section silently renders fewer cards.

Proved by querying the same six handles with each token:
local 6/6 visible, production 4/6.

Fix is in the Shopify admin (publish both collections, and their products, to
the production storefront's channel) — the API credentials this project holds
lack `read_publications`/`write_publications`, so it can't be scripted.

Written up in [[../backend/storefront-environments]], including the env keys
that differ and the diagnostic. Worth reading before debugging any future
"works locally, missing on live" report.

## 2026-08-26 — Review cards drop the avatar placeholder

`ReviewCard` (TestimonialsMarquee) rendered a `.demo-review-avatar` — an empty
36px circle filled with a beige gradient, standing in for a photo the reviews
data has never carried. Removed the element, its CSS block, and the 12px gap on
`.demo-review-author` that only existed to separate it from the name.

Not touched: `.tcard .av` in `app.css` does the same thing on the PDP review
cards. Same placeholder, different component — left alone as it wasn't in scope.

## 2026-08-26 — Lint: 19 errors → 0, and a lightbox that opened off-screen

Cleared every ESLint error in the repo (17 warnings remain, all pre-existing
`react/no-array-index-key` and unused-disable-directive noise).

**Accessibility (`Lightbox.tsx`, `ReviewsSection.tsx`)** — both overlays put
`onClick={onClose}` on the wrapper `div`, which is unreachable by keyboard.
Dismissal is now a real `<button class="lightbox-backdrop">` sitting behind the
content (`position: absolute; inset: 0`, `tabIndex={-1}` since Escape already
closes). The images no longer need `stopPropagation` — the backdrop is a sibling
now, not an ancestor. Thumbnail `alt` became `""` (the wrapping button already
carries the label) and the lightbox image is `alt="Customer review"` — the old
`"Review photo"` tripped `img-redundant-alt`.

**Dead code in `scripts/`** — removed `pollFileReady` and `waitForCdnUrl`
(`upload-review-images.mjs`; neither was ever called, and `pollFileReady`
returned `null` on its first iteration anyway), `shopifyGet`
(`set-inventory.mjs`), a dead `ratingPattern` regex
(`etsy-reviews-scraper.mjs`), an unused `mkdir` import, an unused
`buildDescription(…, listingId)` parameter, and two unused `url` destructures.
All five scripts still parse (`node --check`).

**The bug this turned up:** verifying the reworked overlay showed the review
lightbox rendering ~1600px off-screen. `.rev-marquee-track` animates with
`transform`, and a transformed ancestor becomes the containing block for
`position: fixed` — so the overlay was pinned to the *moving marquee* rather
than the viewport. It's now `createPortal`'d to `document.body`. This predates
today's work; the old wrapper-div click handler masked it, because clicking the
div closed it wherever the div happened to be.

Noted, not acted on: `app/components/Lightbox.tsx` has no callers anywhere in
the app.

## 2026-08-26 — Contact banner panel goes #352f2a

`.demo-contact`'s panel was `#2d231a`; it now uses `var(--cwf-header-ink)`
rather than a fresh literal, since that token already holds #352f2a from the
header change earlier today and the two are meant to be the same charcoal.

Its own text colours were already light-on-dark and needed no adjustment.

## 2026-08-26 — Process cards flip to linen with oak icons

`.demo-process-card` went from the dark `#5f5145` tile to `var(--cwf-surface)`
(#f3efea) with `var(--cwf-accent)` (#c9a27a) icons.

The card copy had to move with it: the title was `#fff` and the body
`rgba(243, 239, 234, 0.7)` — both effectively invisible on linen. They now use
the same pair the surrounding section already uses (`#352f2a` title, `#61482e`
body), so the cards read as part of the section rather than a separate palette.

Also fixed a regression from the announcement-bar rebuild earlier today: between
620px and ~900px the `1fr auto 1fr` side columns get thin enough that the phone
number wrapped mid-number across three lines. Contacts now hide below 900px
(they were only hiding at 620px) and the links carry `white-space: nowrap`. The
header still exposes the same contacts below that width.

## 2026-08-26 — Rating stars unified on #ffa817

Stars were two colours depending on where you looked: the homepage hero and
product cards hardcoded `#ffa817`, while the testimonials, review cards, PDP
rating row, `.tcard`, `.rev-score` and `.tgrid-rating` all used
`var(--cwf-accent)` (#c9a27a) — the pale gold, which read washed-out on light
cards. All nine now use a new `--cwf-star: #ffa817` in `app.css`.

`demo.css` references the same token rather than keeping its own literal:
`app.css` is loaded on every route, so a site-level token is safe there and
avoids the two files drifting the way they just had.

## 2026-08-26 — Announcement bar: 3-column layout with a rotating message

Rebuilt to the reference layout — social icons left, message centred, phone/email
right — and the message now cycles through `ANNOUNCEMENT_MESSAGES` (site.ts)
every 4s with a short fade.

The bar is a `grid-template-columns: 1fr auto 1fr`. That's what finally makes the
message *actually* centred: yesterday's fix made the contact block a flex item to
stop it being overlapped, but that only centred the message in the space left
over. Equal `1fr` side columns center it against the viewport by construction.

Notes:

- **The marketing copy is placeholder.** "Free UK delivery on orders over £250"
  and any coupon code are commitments to customers — they need confirming
  against what the shop actually offers before this ships. The comment above the
  constant says so.
- The reference shows a Facebook icon; the site has no Facebook URL anywhere, so
  the bar links mail + Instagram (`INSTAGRAM_URL`, the same destination the
  footer already uses) rather than inventing one.
- `aria-live="polite"` on the message so the rotation is announced rather than
  silently swapped; `prefers-reduced-motion` keeps the rotation but drops the
  movement.
- Mobile collapses to a single column — socials and contacts hide, message wraps
  instead of truncating.

## 2026-08-26 — Header chrome moves off the warm brown to #352f2a

Every brown in the header — nav items, dropdown items, the search icon/input,
the account circle, the cart pill, the mobile toggle and the mobile aside menu —
was `--cwf-primary` (#4a2f1f) or a hand-rolled `rgba(74, 47, 31, …)` of it. All
now resolve from `--cwf-header-ink: #352f2a`, with `--cwf-header-ink-hover:
#241f1a` for the cart pill's hover (it previously used `--cwf-primary-dark`).

The alpha variants use `color-mix(in srgb, var(--cwf-header-ink) N%,
transparent)` rather than new `rgba()` literals. The file's existing habit was
literal rgba, but that's exactly what made this change a nine-site search — the
mixes keep every tint tied to the token, so the next shift is a one-line edit.

Deliberately not changed:

- `--cwf-primary` itself. The header is the only surface asked for; the token is
  used all over the site (buttons, PDP, footer), and repointing it would have
  been a site-wide restyle rather than a header one.
- The logo. `/darkwood.svg` is an `<img>`, so its colour is baked into the file
  and CSS can't reach it — it stays the warmer brown. Needs a new asset (or an
  inline SVG) if it should match.

## 2026-08-26 — Product card media tile goes grey too, behind one shared token

`.pcard-img` was `var(--cwf-card)` (#f9f4ed cream) while the homepage's own card
tiles had just moved to #f6f6f6 — two different neutrals behind the same kind of
cut-out photo. `.pcard-img` now uses a new site-level `--cwf-tile: #f6f6f6` in
`app.css`, and `demo.css`'s `--demo-tile-bg` aliases it rather than repeating
the literal, so the two stylesheets can't drift.

`.pcard` is site-wide, so this lands on collection pages and search results as
well as the homepage carousel — that's the intent, it's the same component.

Still on the warm `--cwf-sand` and deliberately untouched (different surface, a
different page, and not part of the ask): `.pdp-main-img`,
`.pdp-carousel-slide`, `.pdp-thumb`, `.pdp-model3d`.

## 2026-08-26 — Categories become a paged carousel on desktop

`.demo-cat-grid` was a 6-up CSS grid (3-up under 1080px) that only turned into a
swipeable strip below 620px. It's now one scroll-snap track at every size, with
paging controls from 621px up: 4 cards per view on desktop, 3 under 1080px, and
the existing free-swipe 68%-width cards below 620px (where `.demo-cat-nav` is
hidden — paging arrows fight the thumb).

`CategoriesGrid` gained the same track-ref/page-state logic as `ProductCarousel`
rather than a new mechanism. Two things it does differently, both deliberate:

- **Page count is measured, not a constant.** `ProductCarousel` hardcodes
  `PER_PAGE = 4` while its CSS drops to 2-up and 1.15-up at narrower widths, so
  its dot count is wrong below desktop. `CategoriesGrid` derives cards-per-view
  from the measured card width + `columnGap` inside a `ResizeObserver`, so the
  dots stay right across breakpoints. Worth backporting to `ProductCarousel`.
- **Cards-per-view, not `scrollWidth / clientWidth`.** The track's trailing gap
  pushes that ratio just past a whole number — 6 cards at 3-up measures 2.02 —
  which rounds up to a phantom final page that scrolls 16px. Caught it in the
  browser showing 3 dots for 2 real pages.

Also fixed in passing: `.demo-popular-dot` had the same invisible-dot bug as the
hero dots — `button.reset { background: inherit }` in app.css outranks a bare
class, so the popular carousel's dots were painting transparent too. Both dot
rules are now `button.`-prefixed. The nav/arrow/dot styles are shared between
the two carousels via grouped selectors so they can't drift.

One cascade trap worth remembering: `.demo-cat-nav { display: none }` initially
sat in the 620px media block *above* the shared `.demo-popular-nav,
.demo-cat-nav { display: flex }` rule. Equal specificity, later rule wins — the
nav stayed visible on mobile until the hide moved below it.

## 2026-08-26 — Card media tiles go neutral grey (#f6f6f6)

The beige `--cwf-sand` (#e8dfd1) behind card media was competing with the oak in
the product cut-outs. Replaced with a new `--demo-tile-bg: #f6f6f6` token, used
by `.demo-cat-image`, `.demo-product-image` and `.demo-tex-swatch`.

It's a token rather than three literals because these three tiles are one visual
role — if one changes they all should.

Left beige on purpose (they're accents, not media tiles, and weren't part of the
ask): `.demo-benefit-icon`'s round chip and `.demo-review-avatar`'s
`#e8dfd1 → #ddd2c0` gradient.

## 2026-08-26 — Announcement bar: 14px, and stop the message overlapping contacts

Two bugs in one strip.

**The declared size wasn't the rendered size.** `.announcement-bar` set
`font-size: 12px`, but the message rendered at **17px** — `reset.css` has
`p { font-size: 1rem }`, and `html` is `font-size: 17px`, so 1rem = 17px. A
rule that targets the element directly always wins over a value inherited from
an ancestor, regardless of specificity. Any `<p>` in this codebase ignores its
container's `font-size` unless it sets its own. `.announcement-bar-message` now
declares `font-size: 14px` explicitly (13px on mobile), and the bar itself is
14px so the contact links match.

**The message ran under the phone/email.** `.announcement-bar-contact` was
`position: absolute; right: 40px` while the message was centred by flex — at
~1050px wide the two overlapped by 100px, printing the Cotswolds line straight
through the phone number. The contact block is now a normal flex item
(`flex-shrink: 0`) and the message is `flex: 1; text-align: center`. Trade-off:
the message is now centred in the space *left of* the contacts rather than
dead-centre in the viewport — it can no longer collide, which matters more.
Below the mobile breakpoint the contacts are `display: none`, so the message is
genuinely centred there.

## 2026-08-26 — Hero h1 raised to 72px / 78px on desktop

`.demo-hero h1` was `clamp(2.25rem, 5vw, 56px)` with `line-height: 1.05`; it is
now `clamp(2.25rem, 6vw, 72px)` with `line-height: 1.0833` (= 78px at 72px).

The `vw` term went 5 → 6 deliberately: at 5vw the new 72px ceiling would not be
reached until a 1440px viewport, leaving most laptop widths well short of the
requested size. 6vw hits it at ~1200px. The 2.25rem (36px) floor is unchanged,
and leading stays unitless so the fluid mid-range keeps the same ratio instead
of inheriting a fixed 78px.

Scope: `demo.css` only — `app.css` keeps its flat 56px/36px heading scale.

## 2026-08-26 — Hero carousel: nav moved below the hero, autoplay + progress pill

Three things, from a UI pass on `HeroCarousel`:

**The dots were invisible, and had been.** `.demo-hero-dot` set
`background: #fff`, but `app.css` has `button.reset { background: inherit }` —
specificity (0,1,1) vs (0,1,0), so `inherit` won and every dot painted
transparent against a transparent parent. Only the active pill's *width* hinted
that anything was there. The dot rules are now written as
`button.demo-hero-dot` so they outweigh the reset. **Any control that carries
`.reset` and needs a background has this problem** — write the selector with
the element to win.

**The nav is now below the hero, not over it.** `.demo-hero-nav` was
`position: absolute; bottom: 0` inside `.demo-hero`; it's now a sibling of
`.demo-hero` (JSX wraps both in a fragment) and renders static on a white
strip. Its controls flipped from white to `#61482e` accordingly — they sit on
the page surface now, not on a dark photo.

**Autoplay with a visible dwell.** Slides advance every 3s. The active dot
stretches into a 40px pill whose `::after` fills left-to-right via
`scaleX` over the same duration, so the pill *is* the progress indicator. Two
details worth keeping:

- The timer effect is keyed on `active`, so a manual arrow/dot click restarts
  the full dwell instead of inheriting the remainder of the old one.
- Duration is declared twice — `--demo-hero-slide-duration` (CSS, drives the
  fill) and `SLIDE_DURATION_MS` (TS, drives the timer). They must change
  together; both carry a comment saying so. A CSS custom property can't be read
  by `setTimeout` without a `getComputedStyle` round-trip, which wasn't worth it
  for one constant.
- `prefers-reduced-motion: reduce` disables autoplay entirely and renders the
  pill filled, so it still reads as "current slide".

Sizing after a review pass: dots 10px, active pill 40px, chevrons 26px in 44px
hit areas.

## 2026-08-26 — demo.css h2 scale drops to 36px / 42px

Every section `h2` on the homepage/`landing-oak` routes was 56px (inherited
from the site-wide flat Outfit scale). Requested directly: h2 is 36px with 42px
leading.

Applied to all seven display heads — `.demo-categories-head h2`,
`.demo-textures-head h2`, `.demo-testimonials-head h2`, `.demo-process-head h2`,
`.demo-faq-head h2`, `.demo-popular-heading`, `.demo-benefits-heading` — plus
`.demo-contact-heading h2`, which was its own 44px Mark Bold treatment and is
now on the same 36/42 scale (it keeps the Mark Bold face).

Leading is expressed as **`line-height: 1.1667`, not `42px`**: it computes to
42px at the 36px desktop size while letting the existing mobile steps (28px,
26px) keep proportional leading instead of inheriting a fixed 42px that would
be far too airy at those sizes.

Scope: `demo.css` only. `app.css` keeps the flat 56px/36px Outfit heading scale
from the 2026-08-25 change — the two stylesheets remain separate type systems.

## 2026-08-26 — Button type scale: 18px in the hero, 16px everywhere else

`.demo-btn` was 20px base with a per-modifier drift (`.demo-btn-solid-dark`
carried its own 18px, `.demo-btn-sm` its own 16px). Requested directly: hero
buttons 18px, every other button 16px.

- `.demo-btn` base dropped 20px → **16px**; a single
  `.demo-hero-ctas .demo-btn` rule steps the hero back up to **18px**. The hero
  is the only place that overrides the base size — keep it that way rather than
  adding per-section sizes.
- `.demo-btn-solid-dark` lost its own `font-size: 18px` and now inherits the
  16px base.
- The three mobile `.demo-btn` overrides (780/480/400px) were global selectors
  living inside hero-only media blocks — so they shrank *every* button on
  mobile as a side effect of scaling the hero. They are now scoped to
  `.demo-hero-ctas .demo-btn` and re-based off 18px (16/15/14px). Non-hero
  buttons stay flat at 16px on all widths.

## 2026-08-26 — demo.css body copy is DM Sans Regular, behind type tokens

The homepage/`landing-oak` stylesheet (`app/styles/demo.css`) declared
`'DM Sans'` on about half its rules and `'Plus Jakarta Sans'` on the rest.
DM Sans was already being loaded — but only by `_index.tsx` and
`landing-oak.tsx`'s own route-level `links()`, not by `root.tsx`. It is now
requested in the root Google Fonts link too, so the face is available to any
route that later reaches for it rather than being tied to those two.

Three changes, requested directly ("P texts should be DM Sans regular …
update component style to use everywhere"):

- `root.tsx` now requests `DM+Sans:wght@400;500;600;700` alongside Plus
  Jakarta Sans in the same Google Fonts stylesheet link.
- Every `font-family` in `demo.css` (49 declarations) now goes through one of
  three tokens defined at the top of that file — `--demo-font-display`
  (Outfit), `--demo-font-body` (DM Sans), `--demo-font-mark` (Mark Bold).
  The leftover `'Plus Jakarta Sans'` declarations — review quote/name/product,
  `.demo-process-card p`, `.demo-contact-heading p`, `.demo-contact-etsy`,
  `.demo-featured-eyebrow`, `.demo-stat-label`, `.demo-testimonials-rating`,
  `.demo-product-price-label` — all collapsed into the body token, so body
  copy on those routes is now uniformly DM Sans.
- Paragraph copy dropped from weight 500 to 400 (`.demo-hero-blurb`,
  `.demo-textures-sub`, `.demo-process-sub`). UI text that is deliberately
  medium — buttons, popular-tabs, FAQ questions, the marquee — kept its
  weight; the ask was about paragraphs, not chrome.

Scope note: this is `demo.css` only. The rest of the site (`app.css`) still
uses Plus Jakarta Sans for body/UI — the two stylesheets have been separate
type systems since the Outfit change, and merging them was not part of this.

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
