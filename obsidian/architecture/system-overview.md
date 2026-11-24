---
tags: [architecture]
updated: 2026-11-18
---

# System Overview

The big picture of `wood` — what it is, how a request flows, and the mental
model to hold while working on it.

## What it is

Headless Shopify storefront for **Craft Wood Furniture** (UK, `craftwoodfurniture.co.uk`), built on Hydrogen with React Router 7. It sells made-to-order oak furniture, backed by the Shopify store `wood-123252.myshopify.com`. It runs as a Cloudflare/Oxygen-style Worker (`server.ts`, `wrangler.toml`). A second Worker (`workers/price-sync.ts`) syncs prices from a Google Sheet.

## Mental model

`server.ts` creates a Hydrogen context (Storefront client, cart, cookie session, buyer country) and hands the request to React Router. Each file in `app/routes/` owns its GraphQL query, loader, `meta` and view. There is no database of our own: Shopify is the store, and merchant-editable copy lives in a `page_content` metaobject edited through an admin-only toolbar. Everything else (category copy, company facts, reviews) is TypeScript in `app/lib/` and `app/data/`. Module list: [[codebase-map]].

## Request lifecycle

1. `server.ts` `fetch` → `createHydrogenRouterContext` (needs `SESSION_SECRET`; country from session, default GB).
2. `createRequestHandler` → React Router matches `app/routes/*` (`flatRoutes()` + `hydrogenRoutes`).
3. Loader queries the Storefront API (`context.storefront`), or the Admin API for page content; the root loader adds header, footer, GA id.
4. `entry.server.tsx` renders to a stream with a CSP nonce; `entry.client.tsx` hydrates.
5. Session cookie committed if pending; a 404 goes through `storefrontRedirect` first.
   Server/Client split: loaders and `*.server.ts` run on the server only; hooks (`useFavourites`, `useUnitSystem`) and interactive components run in the browser. See [[data-flow]].

## Boundaries

| Concern           | Owned by                                   | Notes                                              |
| ----------------- | ------------------------------------------ | -------------------------------------------------- |
| Routing           | `app/routes/`                              | one file per URL, owns its query — see [[routing]] |
| UI                | `app/components/`                          | see [[component-conventions]]                      |
| Data              | Shopify APIs via loaders                   | see [[data-flow]]                                  |
| Editable copy     | `lib/pageContent*.ts`, `api.page-content`  | admin-gated, see [[edit-toolbar]]                  |
| Secrets           | server only (`*.server.ts`, `context.env`) | see [[environment-variables]]                      |
| External services | [[integrations]]                           |                                                    |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]] · [[codebase-map]] · [[deepening-candidates]]
