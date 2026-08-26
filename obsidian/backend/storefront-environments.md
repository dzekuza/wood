---
tags: [backend, shopify, gotcha]
updated: 2026-08-26
---

# Storefront environments: local ≠ production

**Local dev and production talk to the same shop through two *different*
headless storefronts.** Same `PUBLIC_STORE_DOMAIN` and `SHOP_ID`, but these
differ between `.env` and the Oxygen Production environment:

- `PUBLIC_STOREFRONT_API_TOKEN`
- `PUBLIC_STOREFRONT_ID` — production is **1000169438** ("Craft", the storefront
  the GitHub workflow `Storefront 1000169438` and `hydrogen link` target)
- `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_CUSTOMER_ACCOUNT_API_*`,
  `SESSION_SECRET`
- `PUBLIC_CHECKOUT_DOMAIN` and `SHOPIFY_ADMIN_TOKEN` are set locally and **not
  set in Production** at all

Each storefront is its own sales channel, so **a collection or product visible
locally can be invisible in production** — the Storefront API simply returns
`null` for it. `CLAUDE.md`'s note about the "Wood Headless" channel
(publication `342742139222`) describes the *local* channel, not production.

## The failure mode it causes

Nothing errors. `collection(handle:)` returns `null`, and code like
`buildCategories` in `_index.tsx` filters nulls out — so the section just
renders fewer cards in production than it does locally, silently.

Seen 2026-08-26: the homepage showed 6 texture/category cards locally and 4 on
live, because `solid-oak-fireplace-surrounds` and `solid-oak-cube-blocks` were
never published to the production storefront's channel.

## Diagnosing it

Hit the Storefront API directly with each token and compare — this takes a
minute and settles "is it code or data?" definitively:

```bash
# pull production env to a scratch file (NEVER to .env), diff which keys differ
npx shopify hydrogen env pull --env production --env-file /tmp/scratch/prod.env
```

Then query the same handles with both tokens against
`https://<shop>/api/2025-01/graphql.json` using the
`X-Shopify-Storefront-Access-Token` header. Delete the pulled file afterwards.

## Fixing it

**Admin UI only.** Neither `SHOPIFY_ADMIN_TOKEN` nor
`PRIVATE_STOREFRONT_API_TOKEN` carries the `read_publications` /
`write_publications` scope, so publications cannot be read or changed over the
API with the credentials this project holds.

Shopify admin → the collection → **Publishing / Sales channels** → add the
production Hydrogen storefront ("Craft"). Publish the collection's **products**
to the same channel too — a published collection full of unpublished products
renders as empty.
