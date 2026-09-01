---
tags: [frontend, shopify, content, cms]
updated: 2026-09-01
---

# Edit toolbar (inline copy editing)

An allowlisted admin browsing the live storefront can flip **Edit on**, retype
any headline, blurb or button label on the landing page in place, then
**Publish** it — or **Reset** to throw the draft away. Nobody else sees the
toolbar, or even receives its markup.

Adapted from the `edittoolbar` kit's Hydrogen adapter
(`~/Desktop/projects/edittoolbar/hydrogen`), with two deliberate deviations —
see [[decisions-log|ADR-0010]].

> [!warning] Not wired up until the one-time setup runs
> The metaobject definition, the Admin scopes and the allowlist all have to
> exist before an admin sees anything. Until then every page renders exactly
> the copy it renders today. See **Setup** below.

## Where the copy comes from

Three layers, most specific first:

| Layer | Source | Edited in |
|---|---|---|
| Inline override | `page_content` metaobject, entry handle `index` | The toolbar, on the live site |
| Section content | `home_page` metaobject | Shopify Admin → Content → Metaobjects ([[homepage-content]]) |
| Coded default | `HOME_CONTENT_DEFAULTS` | The repo |

`EditableText` takes the value the lower two layers resolved to as its
`children` and shows an override only once one exists, so **an untouched field
still follows the `home_page` metaobject**. Publishing a field pins it: later
edits in Admin to that same field stop showing until the override is cleared.

## Field ids

Copy is stored as a flat `{fieldId: string}` JSON map. The ids are the contract
between the stored copy and the markup — **renaming one orphans what an admin
already wrote**, so treat them as permanent.

| Section | Ids |
|---|---|
| Hero (per slide `n`) | `hero.n.heading.i`, `hero.n.blurb`, `hero.n.cta.primary`, `hero.n.cta.secondary` |
| Categories | `categories.heading`, `categories.subheading`, `categories.linkLabel` |
| Most popular | `popular.heading`, `popular.ctaLabel` |
| Testimonials | `testimonials.heading` |
| Process | `process.heading`, `process.subheading`, `process.ctaLabel`, `process.steps.i.title`, `process.steps.i.description` |
| Contact | `contact.heading`, `contact.subheading`, `contact.ctaLabel` |

Ids are **page-scoped by the metaobject handle**, not globally unique: the
components carrying them (`HeroCarousel`, `CategoriesGrid`,
`CraftmanshipProcess`, `ContactBanner`, `TestimonialsMarquee`) also render on
`landing-oak`, which has no provider — there they are plain text. Giving that
page its own toolbar means its own slug, and it would get its own copy map.

## Storage

`page_content` metaobject, one entry per page, keyed by Shopify's built-in
handle (= the slug; `index` for the landing page).

| Field | Type | Holds |
|---|---|---|
| `published_data` | `json` | Live overrides |
| `draft_data` | `json` | In-progress copy, admin-only |
| `draft_status` | `single_line_text_field` | `none` \| `editing` \| `ready` |

Read and written **only through the Admin API**, never the Storefront API:
Shopify's storefront visibility is whole-type, not per-field, so exposing
`published_data` publicly would expose `draft_data` with it. The definition is
therefore created **without** storefront access.

## Lifecycle

1. **Edit on** → `ensure-draft` copies `published_data` into `draft_data` and
   sets `draft_status: 'editing'` (idempotent — an existing draft is kept).
2. **Typing** → each field is written back 800ms after the last keystroke
   (`save`, merged into `draft_data`). The toolbar's dot is amber while dirty
   or saving, green once flushed.
3. **Publish** → flushes anything pending, copies `draft_data` over
   `published_data`, clears the draft.
4. **Reset** → drops `draft_data`. Published copy is untouched.

There is no Unpublish — the kit ships it as a `console.warn` placeholder, so it
was left out rather than shipped dead.

## Who is an admin

A logged-in Shopify **Customer Account** whose email is in
`ADMIN_ALLOWLIST_EMAILS`. No second login system: the storefront already has
`account_.login` and `context.customerAccount`. The check re-runs on every
request, so removing an email revokes access immediately, and an empty or
missing allowlist means nobody is an admin.

> [!danger] `isAdminCustomer` is the only gate
> The Admin API token bypasses every Shopify visibility rule. Any new route
> that reads this metaobject must repeat the check, or it leaks unpublished
> copy.

## Files

| File | Role |
|---|---|
| `app/lib/pageContent.ts` | Shared types + `fieldId()`. Client-safe |
| `app/lib/pageContent.server.ts` | Metaobject read/write, `loadPageContentState()` |
| `app/lib/shopifyAdmin.server.ts` | Admin GraphQL client; `adminCredentials()` returns null when unconfigured |
| `app/lib/adminCheck.server.ts` | `isAdminCustomer()` |
| `app/routes/api.page-content.tsx` | Write endpoint + admin-only refetch |
| `app/components/EditToolbarProvider.tsx` | Draft state, autosave, publish/reset |
| `app/components/EditToolbar.tsx` | The floating bar |
| `app/components/EditableText.tsx` | One editable string |
| `app/components/ConfirmDialog.tsx` | Reset confirmation |
| `scripts/setup-page-content-metaobject.mjs` | One-time definition creation |

## Setup

1. ~~Create the `page_content` definition~~ — **done 2026-09-01** on
   `wood-123252` (`gid://shopify/MetaobjectDefinition/46859583830`), with
   `storefront: NONE` and `admin: PUBLIC_READ_WRITE`. Created through the
   Shopify MCP; `scripts/setup-page-content-metaobject.mjs` does the same thing
   and is safe to re-run (it no-ops on an existing definition) — keep it for
   any other storefront.
2. ~~Grant the Admin app the metaobject scopes~~ — **done 2026-09-01**. The
   token in `SHOPIFY_ADMIN_TOKEN` belongs to the custom app titled
   **"prices"**, which now holds `read_metaobjects`, `write_metaobjects`,
   `read_metaobject_definitions`, `write_metaobject_definitions` alongside its
   original product/price-rule scopes. Verified end-to-end with that token:
   read → upsert draft → publish → read back → delete, all clean, against a
   throwaway `__toolbar-selftest` handle that was deleted afterwards.
3. ~~Add `ADMIN_ALLOWLIST_EMAILS`~~ ([[environment-variables]]) — **done
   2026-09-01** in local `.env`; still needs adding to the Oxygen environment
   for deployed builds. There is no `SCOPES` env var — scopes are granted on
   the app, not in `.env`.
4. Log in at `/account/login` with an allowlisted email, open `/`, and the
   toolbar appears bottom-right.

> [!danger] Never import a `.server` module from anything a component touches
> `LANDING_SLUG` briefly lived in `pageContent.server.ts` and was read by both
> the loader *and* `<EditToolbarProvider slug={LANDING_SLUG}>`. React Router
> only strips server code from `loader` / `action` / `middleware` / `headers`,
> so a value a **component** imports drags the whole server module — Admin
> token and all — toward the client bundle, and Vite refuses with
> *"Server-only module referenced by client"*. The route then fails to hydrate:
> the page renders but no client JS runs, so the toolbar never appears. It now
> lives in the client-safe `pageContent.ts`.
>
> `npm run typecheck` does **not** catch this — it is a Vite/React Router build
> rule, not a type error. Watch the dev server output.

> [!warning] A missing metaobject scope reads as *empty*, not as an error
> Querying `metaobjectDefinitions` with a token that lacks
> `read_metaobject_definitions` returns HTTP 200 and an empty list — no
> `ACCESS_DENIED`. So "the toolbar shows no copy" and "the app has no scopes"
> look identical from the outside. Check
> `{currentAppInstallation{accessScopes{handle}}}` before debugging anything
> else.

## Cost

Shoppers cost **one extra Admin request per page, cached** — `CacheShort()`
around the published read, keyed `['page-content', slug]`. Admins bypass the
cache so a Publish shows on the very next load. If the CMS is unconfigured or
unreachable the loader logs and returns empty state: the page renders its coded
copy, never a 500.

## Related

[[homepage-content]] · [[components/common]] · [[../backend/api-architecture|api-architecture]] · [[../architecture/environment-variables|environment-variables]] · [[decisions-log|ADR-0010]]
