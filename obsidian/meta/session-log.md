---
tags: [meta, session-log]
updated: 2026-11-09
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].

Entry format:

```
## 2026-11-16 — Audit, CSP pushed, mobile LCP fix
- **Changed:** CSP (pushed, verified live); kanban `craftedwood` synced; `HeroCarousel`/`CategoryCard` images + new `app/lib/shopifyImage.ts` (uncommitted).
- **Status:** audit done (mobile LCP 6-12s is the main issue). LCP change typechecks but is not committed/pushed.
- **Next:** commit + push LCP change, re-measure home on mobile, then blog CLS and product TTFB.

## 2026-11-16 — SEO review since 11-09, CSP fix
- **Changed:** `app/entry.server.tsx` CSP (doubleclick/google hosts); vault changelog/status.
- **Status:** typecheck clean. GSC returns 0 rows until domain ownership is verified. Guides live, llms.txt OK.
- **Next:** finish GSC verification, re-pull data, sync craftedwood kanban.

## YYYY-MM-DD HH:MM — one-line summary
- **Changed:** files / areas touched and why
- **Status:** what works now, what is half-done
- **Next:** the first thing to do next session
```

## 2026-11-16 16:10 — Second GSC verification file + OpenSEO crawler-signature research

- **Changed:** added `public/googlefac1a0cf53097d92.html` (second GSC site-verification token, alongside the earlier `google40dbce897c805d36.html`); updated `obsidian/meta/status.md`.
- **Status:** new file confirmed serving at `/googlefac1a0cf53097d92.html` in dev. Separately, looked into OpenSEO's "Shopify signature" crawl-permission form — it's Shopify's Web Bot Auth / storefront crawler signature feature (`storefrontCrawlerSignatureGenerate` Admin mutation). Tried to use the connected Shopify dev-MCP connector to generate one, but it was authenticated to the wrong store ("Ohubo", not CraftWoodFurniture) and calling `switch-shop` revoked it entirely instead of switching — connector now needs reconnecting.
- **Next:** reconnect the Shopify connector to `wood-123252.myshopify.com`, then generate/refresh the storefront crawler signature for OpenSEO via `storefrontCrawlerSignatureGenerate` (or have the user generate it manually in Shopify Admin under "crawler signature"). Also commit + push the new GSC file.

## 2026-11-16 15:40 — Availability filter fix + GSC verification file

- **Changed:** `app/lib/collectionFilters.ts` (`getListAndBooleanFilters` now also drops Shopify's native `filter.v.availability` facet, not just `PRICE_RANGE`), `obsidian/meta/changelog.md`; merged two unrelated commits that landed on `main` meanwhile (nofollow facet links + robots fix, keyword-led category H1s); added `public/google40dbce897c805d36.html` (Google Search Console site verification, static file served at root).
- **Status:** Availability sidebar block confirmed gone on real collection pages (e.g. `/collections/solid-oak-mantel-beams`) via browser check; typecheck clean; merge pushed to `main`. GSC file verified serving at `/google40dbce897c805d36.html` in dev, not yet pushed.
- **Next:** push the GSC verification file; once deployed, complete site verification in Google Search Console (keep the file after verification — don't remove it).

## 2026-11-09 — vault initialised

- **Changed:** project brain scaffolded (vault, shims, hooks).
- **Status:** skeleton only — architecture notes and catalogs still empty.
- **Next:** fill [[status]] and the architecture notes from the real codebase.
