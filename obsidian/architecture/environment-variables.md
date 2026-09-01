---
tags: [architecture, wip]
updated: 2026-08-25
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
| `SITE_PASSWORD` | server | no | When set, gates the whole storefront behind `/coming-soon`. Currently set **in the Oxygen environment**, so it applies to local dev too |
| `SHOPIFY_ADMIN_TOKEN` | server | for the edit toolbar | Admin API access token (`shpat_…`). Bypasses every Storefront visibility rule — server-only, never import `*.server.ts` from a component. Also used by `scripts/*.mjs` |
| `SHOPIFY_ADMIN_SHOP_DOMAIN` | server | no | The real `*.myshopify.com` handle. Only needed if `PUBLIC_STORE_DOMAIN` is a custom/alias domain, which the Admin API does not answer on; otherwise it falls back to `PUBLIC_STORE_DOMAIN` |
| `ADMIN_ALLOWLIST_EMAILS` | server | for the edit toolbar | Comma-separated Customer Account emails allowed to use the [[../frontend/edit-toolbar|edit toolbar]]. Empty or unset = nobody is an admin |

Types live in `env.d.ts` (`interface Env`); every one of these is optional there
so an unconfigured storefront degrades instead of failing to boot.

## Access

<!-- Document the typed accessor (e.g. src/env.ts) and how to add a new var to it. -->

## Related

[[api-architecture]] · [[tech-stack]]
