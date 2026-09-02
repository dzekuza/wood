---
tags: [meta, decision]
updated: 2026-09-02
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0010 — Inline copy editing stores in Shopify, and loads in the route loader

- **Status:** Accepted
- **Date:** 2026-09-01

**Context.** The landing page needed an on-site editor so copy can be changed
without a deploy or a trip into Admin. The `edittoolbar` kit
(`~/Desktop/projects/edittoolbar`) ships two adapters: Next.js + Supabase, and
Hydrogen + Shopify Metaobjects.

**Decision.** Take the Hydrogen adapter — content in a `page_content`
metaobject via the Admin API, "admin" = a Customer Account email allowlist — so
the storefront needs no second database and no second login. Two deliberate
deviations from the kit:

1. **State comes from the route loader, not a client-side fetch.** The kit
   fetches `/api/page-content` after mount, which means every visitor makes an
   extra request and every visitor sees a flash. Here `loadPageContentState()`
   runs in `_index`'s loader, shoppers' reads go through `CacheShort()`, and the
   API route is admin-only — it exists for mutations and the post-publish
   refetch. Admins bypass the cache, so a Publish lands on the next load.
2. **Project CSS classes, not the kit's Tailwind utility dumps.** `.edit-toolbar-*`
   and `.confirm-dialog-*` live in `app.css` on brand tokens, per the repo's UI
   rules.

`EditableText` also takes the *resolved* value as `children` rather than a
literal default, which is what layers this cleanly on top of the existing
`home_page` metaobject ([[../frontend/homepage-content|homepage-content]])
instead of competing with it.

**Consequences.** Unpublish is not implemented (the kit ships it as a
`console.warn`; shipping dead UI is worse than omitting it). The Admin token
bypasses Shopify's own visibility rules, so `isAdminCustomer` is the only thing
standing between a stranger and unpublished copy — any future route touching
this metaobject has to repeat that check. And a published field stops tracking
`home_page` for that field until its override is cleared.

---

## ADR-0010 — The homepage review *count* is a signed-off constant; only the average is derived

**Context.** `aggregateRatings()` reads every product's
`reviews.product_reviews` metafield and produced both halves of the homepage
headline — `4.9 · 166 reviews` in the testimonials head and `4.9 (166) reviews
from Etsy customers` in the hero badge. 166 is the number of reviews that were
*synced onto products*, not the shop's lifetime Etsy total (~1.4k). The badge
says "from Etsy customers", so 166 reads as an understatement of the shop's
whole trading history, not as a catalogue statistic.

**Decision.** Split the two halves of the summary. The **average** stays
derived from the metafield — it is a real, checkable number and must keep
matching the per-product stars on the cards and the PDP. The **count** comes
from `STORE_REVIEW_COUNT` in `lib/site.ts` (1400), applied once in `_index.tsx`'s
loader so the hero badge and the testimonials heading can never disagree.
`formatReviewCount()` in `reviewStats.ts` renders it compactly — `1.4k`, with a
round thousand dropping the `.0`.

**Consequences.** Per-product ratings, the PDP and the review cards are
untouched: only the homepage headline count changed. The constant is a claim
about the business, not about data the storefront holds, so it needs re-signing
by the shop when it moves — that is why it sits in `site.ts` beside the other
merchant-signed copy rather than being inferred anywhere. `aggregateRatings()`
still returns the real count; `_index.tsx` overrides it, and a catalogue with no
reviews at all still renders no badge rather than a bare 1.4k.

---

## ADR-0009 — Buyer country lives in the session, not the URL

- **Status:** Accepted
- **Date:** 2026-09-01

**Context.** The header needed a currency switcher. On Shopify, currency is not
selectable on its own — it follows the buyer's country through the Storefront
API's `@inContext` directive. Hydrogen's own docs offer two routes: encode the
locale in a URL path prefix (`/en-gb/...`, the `($locale)` route pattern), or
persist the choice server-side.

**Decision.** The chosen country is stored in the session under
`countryCode` (`lib/localization.ts`), read back in `lib/context.ts` when the
Storefront client is built, and mirrored onto the cart's buyer identity by
`routes/localization.tsx` so checkout settles in the currency the shopper was
quoted. No URL prefix, no `($locale)` route.

**Consequences.** Every existing route keeps its path — a locale prefix would
have meant re-nesting the entire `app/routes/` tree and rewriting every internal
`<Link to>`. The cost is that a locale is not shareable or crawlable by URL:
SEO bots and cold visitors always get the default (`GB`). That is the right
trade while the shop sells into one market; if it ever needs per-locale
indexing, this decision has to be revisited in favour of path prefixes.

The switcher validates the posted country against
`localization.availableCountries` before storing it. An unsupported market makes
*every* subsequent Storefront query throw, so an unvalidated value would take
the whole site down, not just the switcher.

---

## ADR-0001 — Documentation lives in an in-repo Obsidian vault

- **Status:** Accepted
- **Date:** 2026-08-25

**Context.** Project knowledge (why a pattern exists, what not to touch, how to add
a feature) was scattered across chat history, READMEs, and people's heads. AI agents
re-derived it every session and got it wrong.

**Decision.** All project documentation lives in `obsidian/`, a linked Obsidian vault
committed to the repo. Root `AGENTS.md` / `CLAUDE.md` / `.cursorrules` are thin shims
pointing into it. Claude Code hooks inject the pointer at session start, remind on
every prompt, and block once at Stop when code changed without a doc update.

**Consequences.** Documentation is versioned with the code and reviewed in the same
PR. Every code change carries a doc obligation. Agents get consistent context without
re-reading the whole codebase.

---

## ADR-0002 — New Shopify collections require explicit confirmation before creation

- **Status:** Accepted
- **Date:** 2026-08-25

**Context.** Closing a Figma-vs-live gap in "Our Categories" required creating 2 new
collections directly in the live Shopify store (`Solid Oak Fireplace Surrounds`,
`Solid Oak Cube Blocks`) via the Admin API and publishing them to the storefront
sales channel. Unlike a local code edit, this is a live, customer-visible change to
shared store data — new nav entries, new indexable pages, real SEO/UX consequences —
and isn't trivially reversible the way reverting a commit is.

**Decision.** Before an agent creates, publishes, or materially restructures live
Shopify store data (collections, products, discounts, etc.) to satisfy a design or
content request, it asks the user to confirm first — even when the underlying
products/assets already exist and the change is well-justified. Routine code edits in
this repo do not require this; only writes that land directly on the connected
Shopify store do.

**Consequences.** One extra confirmation round-trip for store-data changes. In
exchange, the store owner always approves what becomes publicly visible before it
goes live, rather than discovering it after the fact.

**Amended 2026-08-26.** Confirming *intent* is not enough — the agent must also
confirm *which shop it is talking to* before any Admin API write. The homepage
metaobject work (ADR-0004) was written to an entirely different store because the
MCP connector was authorized elsewhere and nothing checked. Run `get-shop-info`
and spot-check `shop { id }` against `102713426262` plus a product title first;
see [[homepage-content]] § Verify the shop before writing.

---

## ADR-0003 — Collection filters use Shopify's native `filters`/`ProductFilter`, not a fake UI

- **Status:** Accepted
- **Date:** 2026-08-25

**Context.** `collections.all.tsx` had a mobile filter drawer with a price range
whose inputs were `readOnly`, hardcoded to "240"/"4,800", and wired to nothing —
it looked like a working filter but did nothing. `app/styles/app.css` also had a
fully-built, completely unused sidebar filter shell (`.shop-sidebar`, `.check`,
`.price-range`) left over from an earlier pass. Redesigning the collection page
(prompted by a reference screenshot with a real Benefits/Availability/Price
sidebar) was the point where this had to be resolved one way or the other.

**Decision.** Build filtering on Shopify's actual mechanism: `Collection.products(filters:
[ProductFilter!])` returns a `filters` array (Availability, Price, and any
store-configured facet), where each filter value's `input` field is a ready-to-resend
`ProductFilter` JSON blob. `app/lib/collectionFilters.ts` round-trips that through
`?filter=`/`price_min`/`price_max` URL params; `CollectionFilters.tsx` renders
whatever comes back — no hardcoded filter categories, no fake inputs. Discovered
mid-implementation that the top-level `QueryRoot.products` field (used by
`collections.all.tsx`) has **no `filters` argument** — only `Collection.products`
does — so the sidebar only exists on `collections.$handle.tsx`; `collections.all.tsx`
keeps sort + category row + counts but no filter sidebar, rather than faking one.

**Consequences.** Filtering is real everywhere it appears — if a checkbox is on
screen, clicking it changes what's on screen, backed by a live Storefront API
query. The tradeoff is asymmetry between the two collection routes (one has a
sidebar, one doesn't) — that's a genuine API constraint, not an oversight, and is
called out in [[../../CLAUDE.md|CLAUDE.md]]'s Known issues section so it isn't
"fixed" by someone assuming it was missed.

---

---

## ADR-0004 — Homepage content lives in metaobjects, with defaults kept in code

- **Status:** Accepted
- **Date:** 2026-08-26

**Context.** Homepage copy and the hero image were hardcoded in `_index.tsx` and
in each section component, so changing a heading or the hero photo meant a code
change and a deploy. The shop owner could not touch any of it.

**Decision.** Homepage content moves into three merchant-owned Shopify
metaobjects (`home_page`, `home_hero_slide`, `home_process_step`), queried once
in the homepage loader. Definitions are created through the Admin API, not
`shopify.app.toml` — this repo is a Hydrogen storefront, not a Shopify app, so
the TOML route the `shopify-custom-data` guidance prefers does not apply.

Critically, **the previous hardcoded values stay in the repo** as
`HOME_CONTENT_DEFAULTS` and are merged under the fetched values field by field.
An empty field, a missing metaobject, or a storefront that cannot read
metaobjects at all degrades to the last-known-good copy.

**Consequences.** Content edits no longer need a deploy, and the hero slide count
becomes a merchant decision rather than a constant. The cost is two sources for
the same string: the defaults will drift from admin over time and are explicitly
*not* the source of truth once the metaobject resolves — [[homepage-content]]
says so at the top of the defaults block. The alternative, failing loudly on
missing content, would have made the homepage hostage to a single API call.

That safety net earned itself immediately: the metaobjects were first created on
the wrong Shopify store, so for several hours the homepage was fetching content
that did not exist. It rendered correctly the whole time. A design that treated
missing content as an error would have taken the homepage down instead.

---

## ADR-0005 — Header nav is driven entirely by Shopify's `main-menu`, not hardcoded links

- **Status:** Accepted
- **Date:** 2026-08-31

**Context.** `Header.tsx`'s `HeaderMenu` hardcoded every nav link in JSX
("All Products", a "By Category" dropdown built from `header.collections`,
"Journal", "Contact"), even though `root.tsx`'s loader already fetched
`header.menu` from the Storefront API's `menu(handle: "main-menu")` — a
standard Hydrogen skeleton query that was simply never wired up. Any nav
change (add a link, reorder, add a category to the dropdown) needed a code
change and a deploy, and the shop owner had no way to touch it.

**Decision.** `HeaderMenu` now renders `header.menu.items` directly. A
top-level item with nested `items` becomes a `.header-dropdown` on desktop
(hover-reveal) and an indented flat list on mobile — matching Shopify's own
nav editor, which only supports one level of nesting. `resolveMenuItemUrl()`
strips the item's absolute URL (myshopify or primary domain) down to a path
so `NavLink` still does client-side routing. The store's `main-menu` was
then populated in Shopify Admin (Settings → Navigation) to mirror the old
hardcoded structure: All products, a "By category" dropdown listing the 7
active collections, News (→ the store's real "news" blog), Contact.

**Consequences.** Nav edits — add/remove/reorder a link, add a collection to
the dropdown — now happen entirely in Shopify Admin, no deploy. The
`categories` list computed in `Header()` from `header.collections` is no
longer used for nav; it survives only as input to `HeaderSearch`'s "Popular
Search" tags, which is unrelated. The one gotcha: menu items authored in
Shopify Admin point at generic resources (e.g. a "Contact" `PAGE` item
resolves to `/pages/contact`), which may not match a route this app has
customized (`/contact` is a bespoke contact-form page, not the generic
`pages.$handle` renderer) — this repo already had a redirect
(`pages.contact.tsx` → `/contact`) covering that case, but a *new* menu item
pointing at a Shopify Page with a bespoke-route collision would need the
same treatment.

---

## ADR-0006 — Homepage "Most popular" reads the merchant-curated `most-popular` collection, not an algorithmic best-sellers query

- **Status:** Accepted
- **Date:** 2026-08-31

**Context.** `_index.tsx`'s `POPULAR_PRODUCTS_QUERY` queried the top-level
`products(first: 16, sortKey: BEST_SELLING, query: $query)` — Shopify's
lifetime sales-count ranking across the whole catalog, filtered by a
hidden-handles exclusion string — then sliced to 8. Meanwhile the store
already has a real `most-popular` collection (handle `most-popular`,
`sortOrder: MANUAL`, 11 products) that the merchant curates by hand in
Shopify Admin, entirely disconnected from what the homepage showed.

**Decision.** The query now fetches `collection(handle: "most-popular")
{ products(first: 16) { nodes {...} } }` with **no `sortKey` argument** —
omitting it defaults to `COLLECTION_DEFAULT`, which respects whatever
`sortOrder` the collection is configured with (`MANUAL` here), so the
homepage section renders in exactly the order set by dragging products in
Shopify Admin's collection editor. `filterHiddenProducts()` (client-side
`.filter()`, order-preserving) stays as a safety net, though the query arg
that fed it (`EXCLUDE_HIDDEN_PRODUCTS_QUERY`) is no longer needed since
`Collection.products` has no free-text `query` argument.

**Gotcha hit while making this change:** `ProductCarousel.tsx` and
`FeaturedPicks.tsx` (both only used by the separate `landing-oak.tsx` demo
route, fed by its own `PopularProductsLandingOakQuery`) were typing their
`products` prop against `PopularProductsQuery['products']['nodes']` —
reaching into *this* file's query purely because the shape happened to
match structurally, not because of any real relationship. Changing this
query's shape broke both, with no import connecting them to make that
obvious. Retyped both against the fragment-level
`PopularProductItemLandingOakFragment[]` instead of a sibling route's
top-level query type — a shared shape should come from a shared fragment,
never from another route's query result.

**Consequences.** The homepage "Most popular" section is now merchant-owned
exactly like nav (ADR-0005): reorder or swap products in the
`most-popular` collection in Shopify Admin, no deploy. The tradeoff is that
an empty or unpublished `most-popular` collection means an empty section —
there is no algorithmic fallback anymore, matching the fail-quiet posture
`PopularProductsSection` already had (`if (!products.length) return null`).

---

## ADR-0007 — Category pages default to Shopify's collection order ("Featured"), not `CREATED`

- **Status:** Accepted
- **Date:** 2026-08-31

**Context.** `collections.$handle.tsx` defaulted its `sort` param to
`newest`, which mapped to `sortKey: CREATED, reverse: true` — every category
page ignored the collection's own configured sort order (manual drag order,
best-selling, etc. — same class of problem as ADR-0006's "Most popular"
section) and instead always showed newest-first.

**Decision.** Added a `featured` option to the shared `SORT_OPTIONS` /
`SortValue` (`SortDropdown.tsx`) and made it the default on both collection
routes:
- `collections.$handle.tsx` maps `featured` → `sortKey: COLLECTION_DEFAULT`
  (no explicit sort key would do the same, but the enum literal makes the
  intent explicit) — this defers entirely to the collection's own
  `sortOrder` field in Shopify Admin (manual, best-selling, etc.).
- `collections.all.tsx` has no single collection to defer to (it aggregates
  the whole catalog through the top-level `products` field), so `featured`
  maps to `sortKey: BEST_SELLING` there instead — the closest analog to a
  merchant-curated "default" view for a catalog-wide listing.

Both routes still default their `sort` search param to `'featured'` instead
of `'newest'`, and the dropdown now lists **Featured** first.

**Consequences.** A category page's default view now matches what's dragged
into place in Shopify Admin's collection editor, same as ADR-0006 did for
the homepage. `newest`/`price-high`/`price-low` remain available as
explicit shopper-chosen sorts via the dropdown, unaffected. Since
`SortValue` is a shared type across both route files, adding `featured`
required a mapping in both `SORT_MAP` records — the type system caught this
immediately (`Record<SortValue, ...>` failed to compile until both were
updated).
