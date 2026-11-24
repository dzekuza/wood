---
tags: [architecture]
updated: 2026-11-18
---

# Environment Variables

## Rules

- Secrets are **server-only** — never `NEXT_PUBLIC_`.
- Never hardcode URLs or keys in source.
- `.env.example` must exist and stay in sync with the table below.
- Never log or print an env var value.
- The `.env*` files are edited by the project owner, not by agents — an agent
  states what to add; the owner adds it.

## Variables

| Name | Scope | Required | Purpose |
|------|-------|----------|---------|
| `SHOPIFY_ADMIN_TOKEN` | server | for the edit toolbar | Admin API access token (`shpat_…`). Bypasses every Storefront visibility rule — server-only, never import `*.server.ts` from a component. Also used by `scripts/*.mjs` |
| `SHOPIFY_ADMIN_SHOP_DOMAIN` | server | no | The real `*.myshopify.com` handle. Only needed if `PUBLIC_STORE_DOMAIN` is a custom/alias domain, which the Admin API does not answer on; otherwise it falls back to `PUBLIC_STORE_DOMAIN` |
| `PUBLIC_GA_MEASUREMENT_ID` | public | no | GA4 measurement ID (`G-…`). Public — it ships to the browser. Empty/unset = GA4 is not loaded. Read in `root.tsx`'s loader and passed to `GoogleAnalytics`. `.env.example` lists every variable |
| `ADMIN_ALLOWLIST_EMAILS` | server | for the edit toolbar | Comma-separated Customer Account emails allowed to use the [[../frontend/edit-toolbar|edit toolbar]]. Empty or unset = nobody is an admin |
| `SESSION_SECRET` | server | yes | Signs the cookie session. `createHydrogenRouterContext` throws if missing (`app/lib/context.ts`) |
| `PUBLIC_STORE_DOMAIN` | server (read by Hydrogen and loaders) | yes | Shopify store domain; Admin fallback domain |
| `PUBLIC_STOREFRONT_API_TOKEN` | server | yes | Storefront API public token (read by Hydrogen context) |
| `PRIVATE_STOREFRONT_API_TOKEN` | server | optional | Storefront API private token, listed in `.env.example`; read implicitly by Hydrogen |
| `PUBLIC_STOREFRONT_ID` | server | yes | Hydrogen analytics storefront id (`root.tsx`) |
| `PUBLIC_CHECKOUT_DOMAIN` | server | yes | Checkout host used by cart and Analytics |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | server | for account pages | Customer Account API client id (read by Hydrogen) |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | server | for account pages | Customer Account API URL (read by Hydrogen) |
| `SHOP_ID` | server | for account pages | numeric shop id |
| `GOOGLE_SHEET_ID` | server (price-sync Worker) | for `workers/price-sync.ts` | Sheet id; set in `workers/wrangler.toml` |
| `SITE_PASSWORD`, `SCOPES` | TODO: unknown | TODO: unknown | present in `.env.example`; no reader found in `app/`, `server.ts`, `vite.config.ts`, `scripts/` |

Types live in `env.d.ts` (`interface Env`); every one of these is optional there
so an unconfigured storefront degrades instead of failing to boot.

## Access

Loaders read `context.env.<NAME>`; there is no separate accessor module. `env.d.ts` declares `interface Env`. Also in code: `import.meta.env.DEV` (build flag) and `process.env.NODE_ENV` (`server.ts`). `wrangler.toml` `[vars]` also commits storefront values; see [[integrations]] flags. Values are never recorded in this note.

## Related

[[api-architecture]] · [[tech-stack]]
