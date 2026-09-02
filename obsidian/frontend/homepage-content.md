---
tags: [frontend, shopify, content, wip]
updated: 2026-09-02
---

# Homepage content (metaobject-driven)

Every heading, blurb, button label and image on the homepage is editable from
**Shopify Admin → Content → Metaobjects** — no deploy needed. The code holds a
full set of fallbacks, so an unreachable or unseeded metaobject renders exactly
the page that shipped before this change.

> [!success] Live
> Verified end-to-end on `wood-123252` (shop `102713426262`): the Storefront API
> serves the entries, images come off `cdn.shopify.com`, and an admin edit reaches
> the page on the next uncached load.

## The model

| Metaobject type | Handle | What it holds |
|---|---|---|
| `home_page` | `main` | Singleton. Every section's heading/subheading/button label, plus references to the two lists below. Includes the `textures_heading` / `textures_subheading` / `textures_link_label` fields — the "Our Textures" section was removed 2026-08-31 and restored 2026-09-02, and the fields were never deleted in Admin, so they drive it again with no re-seeding. |
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

> [!info] One layer sits above this one
> Copy published through the [[edit-toolbar]] is stored in a separate
> `page_content` metaobject and overrides whatever `home_page` resolves to for
> that field. An untouched field still follows `home_page`; a published one
> stops tracking it until the override is cleared.

> [!tip] Renaming copy? Change it in both places
> Editing a string in `HOME_CONTENT_DEFAULTS` has **no effect** on this
> storefront while the metaobject supplies that field. The 2026-09-01
> Collections→Categories rename shipped looking complete and changed nothing
> live until four `home_page` / `home_hero_slide` fields were edited in Admin
> too. Grep the metaobject values, not just the repo.

> [!warning] The metaobject wins — code defaults do not
> Removing a sentence from `HOME_CONTENT_DEFAULTS` does **not** change the live
> page while the metaobject supplies a value: `buildHomeContent()` only falls
> back when a field or reference is absent.
>
> **Process steps are the one exception**, since 2026-09-01. `ProcessIconKey` is
> the list of steps the shop actually performs, and `parseProcessSteps` drops any
> metaobject entry whose `icon` names a key that is no longer in it. So retiring
> a step is a code change that takes effect immediately; deleting the Admin entry
> afterwards is tidying, not a prerequisite. A *blank* icon still means "merchant
> omission" and borrows the positional default, so this cannot silently eat a
> half-filled entry.
>
> Still pending in Admin from the 2026-08-31 round: the stale `home_process_step`
> entries for "Jointed by hand" and "Oiled & finished" (both now ignored by the
> code, so this is cleanup only).

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

## Verified working

Confirmed on the real store, not just in theory:

- Storefront API returns the `home_page` entry with all fields, both image
  references resolving to `cdn.shopify.com` URLs.
- The rendered page pulls the hero background and workshop photo from the CDN,
  not the `/demo/*` fallbacks.
- Changing `categories_heading` in admin came back changed from the Storefront
  API on the next request (reverted afterwards).
- `buildHomeContent()` parses a mocked response correctly (19/19 assertions).

**No Storefront API scope change was needed.** An earlier version of this note
claimed metaobjects were blocked by a missing `unauthenticated_read_metaobjects`
scope on the Headless channel — that was wrong; see
[[#Verify the shop before writing]].

## Gotchas

- **`publishable` must be enabled on the definition.** Without it, entries have
  a `null` status and are invisible to the Storefront API by design. Enabling it
  later lands existing entries in **DRAFT** — they must then be set `ACTIVE`
  explicitly, which is easy to miss because admin shows the content fine either
  way.
- **Metaobjects are shop-level**, so they exist for both the local and the
  production storefront ([[storefront-environments]]) with no per-channel setup.
  Unlike collections, there is nothing to publish to a sales channel.
- **The dev server caches the loader's Storefront query.** After editing a
  metaobject, a browser reload can still show the old value — restart
  `shopify hydrogen dev` to see the change. This is Hydrogen's sub-request cache
  doing its job, not a bug, and it is why a first check after seeding can look
  like the data never arrived.

## Verify the shop before writing

The first attempt at this feature created all three definitions, six entries and
two image uploads **on the wrong Shopify store** — the MCP connector was
authorized to a different shop. Nothing errored; the writes succeeded, and the
Storefront API returned `null` simply because the data was somewhere else. That
`null` got misdiagnosed as a missing storefront scope, and the wrong conclusion
reached the docs and a PR before it was caught.

Tells that were visible and ignored:

- The shop's only metaobject definition was `specifications` with fields like
  `floor_area`, `wall_construction`, `roof_pitch`, `snow_load` — a garden-building
  schema, on a shop that supposedly sells oak furniture.
- The publications list contained a channel named `ohubodev`.
- The staged-upload path was scoped to shop `76806357159`, not `102713426262`.

**Before any Admin API write, confirm the shop.** `get-shop-info` plus a
`shop { id }` and a product-title spot check. The right store is
`wood-123252.myshopify.com`, shop id **`102713426262`** (it also appears in
`PUBLIC_CUSTOMER_ACCOUNT_API_URL`), ~37 oak products.

## Related

[[component-conventions]] · [[design-system]] · [[storefront-environments]] ·
[[components/common]] · [[decisions-log]] ADR-0004
