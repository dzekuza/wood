---
tags: [meta, session-log]
updated: 2026-11-23
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].


## 2026-11-24 — SEO rankings review + brand schema
- **Changed:** `organizationJsonLd()` `alternateName` now lists 3 brand variants (uncommitted). Committed locally: docs sync (`3528f59`) and codex hooks/TASKS.md (`3b337c6`); push failed twice with GitHub 500, 2 commits ahead of origin.
- **Findings:** SEO subagent report (craftedwood): site is new in Google, 1 referring domain, shelves collection 829 impressions/0 clicks, apex/www split still indexed. Backlink target list being written to `obsidian/seo/backlink-targets.md`.
- **Next:** retry push, commit schema change, link building, shelves/fireplace collection guides, re-measure 2026-11-30.

## 2026-11-24 — Architecture incremental sync
- **Changed:** `architecture/codebase-map.md` (site.ts line refs, synced_commit → e74bed1). No structural change: commit e74bed1 was copy-only.
- **Status:** WhatsApp/CRM chats skipped on this automated run.

Entry format:

```
## 2026-11-24 — WhatsApp task batch: copy fixes + Merchant Center cleanup
- **Changed:** `app/lib/site.ts` (announcement bar "CraftWood Furniture" → "Craft Wood Furniture"), `app/components/Footer.tsx` ("Our makers" → "About Us"), `page_content` metaobject `index.process.heading` (same word-spacing fix, CMS content not code).
- **Investigated, no change:** About page "washed colour / broken alignment" complaint — not reproducible on current dev build. Two helper products (`coat-racks`, `aaa-types-of-corbels`) confirmed ACTIVE + published to all 6 sales channels; swatches confirmed self-contained (safe to unpublish); `publishableUnpublish` mutation blocked by the Admin MCP's own safety policy — unpublish must be done manually in Admin.
- **Status:** typecheck clean, changes verified in browser, not yet committed. Merchant Center flags (missing unit pricing, invalid price/misrepresentation on 7 variant products, inappropriate image on Flamed Beam + Fireplace Surround) catalogued in status.md, not yet actioned.
- **Next:** manual unpublish in Admin; review Merchant Center flags; commit pending changes.

## 2026-11-23 — Architecture docs, incremental (synced b573b04)
- **Changed:** `architecture/codebase-map.md` (page-content cache note, line refs, synced_commit), changelog.
- **Status:** one code file changed (`pageContent.server.ts`); chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-23 — Architecture docs, incremental (synced 684220b)
- **Changed:** `architecture/codebase-map.md` (product-page note, `collectionLinkForHandles` row, synced_commit), changelog.
- **Status:** one commit (`684220b`); chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-23 — Architecture docs, incremental (synced 324e699)
- **Changed:** `architecture/codebase-map.md` (seo row, synced_commit), `integrations.md` (Etsy row), changelog.
- **Status:** one commit (`ETSY_SHOP_URL` in sameAs + llms.txt); no interface changes beyond the new const; chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-23 — Architecture docs, incremental (synced a290904)
- **Changed:** `architecture/codebase-map.md` (note + synced_commit), changelog.
- **Status:** one UI/copy commit since `8349b01`; no interface changes; chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-22 — Architecture docs, incremental (synced 8349b01)
- **Changed:** `architecture/codebase-map.md` (`COLLECTION_CONTENT` row, synced_commit), changelog.
- **Status:** one content-only commit since `06269d1`; chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-22 — Architecture docs, incremental (synced 06269d1)
- **Changed:** `architecture/codebase-map.md` (worker-entry: `redirectToCanonicalHost`, synced_commit), changelog.
- **Status:** one code commit since `de9658a`; chats/CRM skipped (automated).
- **Next:** none.

## 2026-11-20 — Architecture docs, incremental (synced de9658a)
- **Changed:** `architecture/codebase-map.md` (seo + collections rows, synced_commit), changelog.
- **Status:** two code commits since `138c599`; chats/CRM skipped (automated).
- **Next:** `internalLinks.ts` and `RelatedLinks.tsx` are in HEAD but missing from the working tree; confirm intent.

## 2026-11-20 — Architecture docs, incremental (synced 138c599)
- **Changed:** `architecture/codebase-map.md` (TestimonialsMarquee thumbnail note, synced_commit), changelog.
- **Status:** only one code commit since `10414fa`; chats/CRM skipped (automated).
- **Next:** confirm the uncommitted working-tree state flagged in the map.

## 2026-11-20 — Architecture docs, incremental (synced 10414fa)
- **Changed:** `architecture/codebase-map.md` (root-layout rows, `editorialCache`, warning callout, synced_commit), `architecture/integrations.md` (fonts row), changelog.
- **Status:** chats/CRM skipped (automated). Working tree on `perf/mobile-lcp-cls` has uncommitted deletions of `lib/cache.ts`, fonts, `tabler-icons-subset.css` vs HEAD.
- **Next:** confirm intended state; verify CSP vs self-hosted fonts; rerun from `10414fa`.

## 2026-11-20 — Architecture docs, incremental (synced eeb4446)
- **Changed:** `architecture/codebase-map.md` only (seo and collections tables, frontmatter, warning callout).
- **Status:** chats/CRM skipped (automated). Working tree differs from HEAD: the 13 files of the last two commits appear reverted/deleted, uncommitted.
- **Next:** confirm which state is intended; rerun from `eeb4446`.

## 2026-11-18 — Architecture docs, first full run (synced 0ecfd74)
- **Changed:** `obsidian/architecture/` only: new `codebase-map`, `integrations`, `deepening-candidates`, `decisions-from-chat`; filled the five template notes. No code touched.
- **Status:** chats/CRM not read (automated run, skipped). `GLOSSARY.md` absent; proposals in `deepening-candidates`.
- **Next:** run with chat review; incremental reruns diff from `0ecfd74`.

## 2026-11-16 — Audit, CSP pushed, mobile LCP fix
- **Changed:** CSP (pushed, verified live); kanban `craftedwood` synced; `HeroCarousel`/`CategoryCard` images + new `app/lib/shopifyImage.ts` (uncommitted).
- **Status:** audit done (mobile LCP 6-12s is the main issue). LCP change typechecks but is not committed/pushed.
- **Next:** commit + push LCP change, re-measure home on mobile, then blog CLS and product TTFB.

## 2026-11-18 — Fix swapped PDP oil colour swatch images
- **Changed:** `app/lib/swatches.ts` — swapped the `FINISH_TEXTURE_IMAGES` entries for `Light Grey` and `White` so each points at the texture crop matching its own label in `TexturesGrid.tsx` (user reported the two were showing each other's swatch).
- **Status:** fixed and verified live on `/products/solid-oak-floating-shelf` in the browser preview. Not committed/pushed.
- **Next:** commit this fix (and the still-pending mobile LCP change) together or separately per user go-ahead.

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
