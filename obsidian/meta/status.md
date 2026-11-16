---
tags: [meta, status]
updated: 2026-11-16
---

# Current status — wood

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-16

## Current focus

Small storefront fixes and search-console setup, no active feature build.

## Done recently

- CSP now allows Google doubleclick/ads-audience hosts (fixes blocked GA4 remarketing pixel).

- Added `public/google40dbce897c805d36.html` — Google Search Console site-verification file, served statically at the site root.
- Removed the Availability filter from real per-collection pages (`collections.$handle.tsx`) — `getListAndBooleanFilters` now also drops Shopify's native `filter.v.availability` facet, matching the earlier `/collections/all` fix.
- Merged in two other commits that landed on `main` meanwhile: `fix: block stacked filter URLs and nofollow facet links`, `feat: keyword-led category H1s and search-matched guide copy`.

## In progress

- _Nothing in flight._

## Next up

- Waiting on Google Search Console domain ownership verification (file deployed; DNS TXT blocked on client). Once verified: confirm OpenSEO/gsc-mcp return rows, request indexing for 5 collection URLs + homepage.
- Re-check rendered `rel=nofollow` on facet links with filter panel open.

- Confirm the Google Search Console verification succeeds once the site is deployed, then it can stay (don't remove the file after verification — Google re-checks it).

## Blockers & open questions

- _None open._

## Environment

- **Run:** `npx shopify hydrogen dev --port 3001 --disable-version-check`
- **Deploy:** pushes go straight to `main` (no PR workflow on this repo); production is the connected Oxygen/Vercel deployment for `wood-123252.myshopify.com`.
- **Known issues:** none tracked separately — see [[changelog]].
