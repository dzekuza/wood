---
tags: [frontend, shopify, content, wip]
updated: 2026-08-26
---

# Homepage content (metaobject-driven)

Every heading, blurb, button label and image on the homepage is editable from
**Shopify Admin → Content → Metaobjects** — no deploy needed. The code holds a
full set of fallbacks, so an unreachable or unseeded metaobject renders exactly
the page that shipped before this change.

> [!warning] Not live yet
> The Storefront API currently returns `null` for every metaobject on this shop.
> See [[#The blocker: storefront metaobject scope]] — one admin toggle away.

## The model

| Metaobject type | Handle | What it holds |
|---|---|---|
| `home_page` | `main` | Singleton. Every section's heading/subheading/button label, plus references to the two lists below. |
| `home_hero_slide` | one per slide | Background image, heading, blurb, both CTAs. |
| `home_process_step` | one per card | Icon key, title, description. |

`home_page.hero_slides` and `home_page.process_steps` are ordered
`list.metaobject_reference` fields — **order in admin is order on the page**, and
adding a second hero slide is what re-enables the carousel arrows and dots.

### Field conventions

- **Headings are `multi_line_text_field`** where the design breaks them across
  lines. One row per line; `lines()` splits on `\n` and the component renders a
  `<br>` between them. This is how "Timeless Oak. / Made for Your Home." keeps
  its two-line shape without markup in the field.
- **CTA links are `single_line_text_field`, not `url`.** Shopify's `url` type
  demands an absolute URL with a scheme; these are relative in-app paths
  (`/collections/all`) handed to React Router's `<Link to>`.
- **Icons are a key, not an image.** The process illustrations are hand-drawn
  SVG components in `ProcessIcons.tsx`. The metaobject stores one of four
  choices and `CraftmanshipProcess` resolves it through `PROCESS_ICONS`. Adding
  an icon means adding it to *both* that map and the field's `choices`
  validation — an unrecognised key falls back to the step's positional default.
- **A blank field is the same as a missing one.** `text()` trims and treats `''`
  as absent, so clearing a field in admin restores the coded default rather than
  rendering an empty heading.

## The code

`app/lib/homeContent.ts` owns all of it:

- `HOME_CONTENT_QUERY` — one Storefront query, fetched in parallel with the
  existing collection/product queries in `_index.tsx`'s loader.
- `HOME_CONTENT_DEFAULTS` — the fallbacks. **This is the safety net, not the
  source of truth.** Editing copy here does nothing once the metaobject resolves.
- `buildHomeContent()` — merges the response over the defaults, field by field.

Components take content via props (per [[component-conventions]]'s "content via
props, never hardcoded"), each defaulting to its slice of
`HOME_CONTENT_DEFAULTS` so they still render standalone.

## The blocker: storefront metaobject scope

The definitions are created with `access: {storefront: PUBLIC_READ}` and every
entry is `ACTIVE`, but the Storefront API still returns `null`/`[]` for
**every** metaobject on this shop — including the pre-existing `specifications`
type, which no code ever consumed, so this was never noticed before.

Verified it is not a code, data or query problem:

- Admin API returns the entries with correct values.
- Same `null` on API versions 2025-04 → 2026-04, with both the public and the
  private storefront token.
- `metaobjects(type:)` returns `[]` rather than an error — the field is
  *allowed*, so the token has the query but sees no rows.
- `buildHomeContent()` parses a mocked response correctly (19/19 assertions).

**The fix is admin-UI only:** Shopify admin → the Headless/Hydrogen channel →
Storefront API permissions → enable **Read metaobjects**
(`unauthenticated_read_metaobjects`). The credentials this project holds cannot
read or change channel scopes — `appInstallations` returns `access denied`, the
same class of gap as the publications one in [[storefront-environments]].

Until that toggle is on, the homepage renders `HOME_CONTENT_DEFAULTS` and
admin edits have no visible effect.

## Gotchas

- **`publishable` must be enabled on the definition.** Without it, entries have
  a `null` status and are invisible to the Storefront API by design. Enabling it
  later lands existing entries in **DRAFT** — they must then be set `ACTIVE`
  explicitly, which is easy to miss because admin shows the content fine either
  way.
- **Production is a different storefront** ([[storefront-environments]]). The
  metaobjects are shop-level so they exist for both, but the scope toggle above
  has to be set on whichever channel each environment's token belongs to.

## Related

[[component-conventions]] · [[design-system]] · [[storefront-environments]] ·
[[components/common]] · [[decisions-log]] ADR-0004
