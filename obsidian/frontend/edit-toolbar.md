---
tags: [frontend, shopify, content, cms]
updated: 2026-09-10
---

# Edit toolbar (inline copy editing)

An allowlisted admin browsing the live storefront can flip **Edit on**, retype
any headline, blurb or button label on the page in place, then **Publish** it
— or **Reset** to throw the draft away. Nobody else sees the toolbar, or even
receives its markup.

Adapted from the `edittoolbar` kit's Hydrogen adapter
(`~/Desktop/projects/edittoolbar/hydrogen`), with two deliberate deviations —
see [[decisions-log|ADR-0010]].

> [!info] Live on every content page, not just the homepage
> Until 2026-09-10 this was wired into `_index.tsx` only — every other route
> rendered `EditableText` calls (inside shared components like
> `HeroCarousel`/`CraftmanshipProcess`) with no `EditToolbarProvider`
> ancestor, so they degraded to plain text with no toolbar at all. See
> [[decisions-log#ADR-0014]] for the full rollout (which pages, which slugs,
> which components gained their first `EditableText` calls) — the mechanism
> itself needed zero backend changes, since `pageContent.server.ts` was
> already generic over any `slug` string.

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

### Homepage (slug `index`)

| Section | Ids |
|---|---|
| Hero (per slide `n`) | `hero.n.heading.i`, `hero.n.blurb`, `hero.n.cta.primary`, `hero.n.cta.secondary` |
| Categories | `categories.heading`, `categories.subheading`, `categories.linkLabel` |
| Most popular | `popular.heading`, `popular.ctaLabel` |
| Testimonials | `testimonials.heading` |
| Process | `process.heading`, `process.subheading`, `process.ctaLabel`, `process.steps.i.title`, `process.steps.i.description` |
| Contact (footer `ContactBanner`) | `contact.heading`, `contact.subheading`, `contact.ctaLabel` |

Ids are **page-scoped by the metaobject handle**, not globally unique — each
page below is its own `page_content` entry (Shopify metaobject handle = the
slug), so the same id string on two different pages never collides. That's
what let `HeroCarousel`, `CraftmanshipProcess`, `ProductCarousel`,
`OakBenefits`, `CraftStats` and `FaqAccordion` reuse ids like `hero.n.blurb`
or `process.heading` on `landing-oak` (slug `landing-oak`) that already exist
on the homepage (slug `index`) — two independent copy maps, no code change to
either side needed.

### Other pages (rolled out 2026-09-10 — see [[decisions-log#ADR-0014]])

| Page | Route | Slug | Field id prefix |
|---|---|---|---|
| About | `about.tsx` | `about` | `about.hero.*`, `about.story.*`, `about.facts.i.*`, `about.pillars.i.*`, `about.pillars.heading`, `about.cta.*` |
| Contact | `contact.tsx` | `contact` | `contact.hero.*`, `contact.primary.*`, `contact.channels.i.*`, `contact.steps.heading`, `contact.steps.i` |
| Categories | `collections._index.tsx` | `collections` | `collections.hero.*` |
| All Products | `collections.all.tsx` | `collections-all` | `all-products.hero.heading`, `all-products.faq.heading`, `all-products.faq.i.question`/`.answer` |
| Favourites | `pages.favourites.tsx` | `favourites` | `favourites.hero.*`, `favourites.empty.*` |
| Landing (oak) | `landing-oak.tsx` | `landing-oak` | Reuses `hero.*`/`process.*` (see above) plus its exclusive components' own ids: `popular.*` (`ProductCarousel`), `featured.*` (`FeaturedPicks`), `benefits.*` (`OakBenefits`), `values.i` (`ValueMarquee`, **one id per prop, not per rendered item** — the track renders the four props twice back-to-back for a seamless CSS loop, so both copies read `values.{i % 4}` and always match), `stats.*` (`CraftStats`), `faq.*` (`FaqAccordion`) |

Product/collection/search pages were deliberately left out — their copy
(titles, descriptions, prices) is live Shopify catalog data, not hand-authored
marketing copy, so there is nothing here for an admin to override. Policy
pages (`policies.*.tsx`) were also left out on purpose: they render Shopify's
own Shop Policy text, edited in Admin → Settings → Policies, not something
that should be casually rewritten from a floating toolbar.

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
| `app/lib/adminCheck.server.ts` | `isAdminCustomer()` — plus the dev bypass |
| `app/graphql/customer-account/CustomerEmailQuery.ts` | The email lookup, placed where codegen validates it against the right schema |
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
5. Nothing further needed per page. Every slug in the table above shares the
   one `page_content` definition from step 1 — `metaobjectUpsert`'s
   handle-based upsert auto-creates a new metaobject entry the first time any
   admin edits a given page, exactly like step 1's throwaway self-test entry
   did. Adding a new page to the toolbar is purely a code change (a slug
   constant + wrapping the route in `EditToolbarProvider`), never an Admin
   setup step.

> [!info] In local dev, everyone is an admin
> `isAdminCustomer` returns `true` immediately when `import.meta.env.DEV`, so
> the toolbar can be worked on without a Customer Account login — which needs
> an https tunnel to work on localhost at all. Vite statically replaces that
> flag with `false` in a production build, so the branch is dead code on
> Oxygen; it cannot be re-enabled by an env var or a header. It does mean
> anyone who can reach your dev server can edit and publish live copy, so don't
> run `--host` on an untrusted network.

> [!warning] Admin API documents must not carry a `#graphql` tag
> Codegen's `default` project globs **all** of `app/**` and validates every
> tagged document against the **Storefront** schema. The `page_content`
> operations are Admin API, so tagging them fails the build with
> "Cannot query field metaobjectByHandle on type QueryRoot" and friends. They
> are deliberately untagged. The Customer Account query is the opposite case —
> it lives in `app/graphql/customer-account/CustomerEmailQuery.ts`, which *is*
> globbed by the `customer` project, so it keeps real validation.

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
