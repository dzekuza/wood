---
tags: [meta, status]
updated: 2026-11-16
---

# Current status — wood

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-18

## Current focus

Small storefront fixes and Google Search Console verification, no active feature build.

## Done recently

- Fixed swapped Oil Colour swatch images on the PDP (`app/lib/swatches.ts`): "Light Grey Oil" and "White Oil" were pointing at each other's texture crop (`texture-coat-racks.jpg` / `texture-surround-mantels.jpg`), inconsistent with the same crops' labels in `TexturesGrid.tsx`. Swapped the two image assignments so they match; verified in browser on `/products/solid-oak-floating-shelf`. Not yet committed.
- Mobile LCP fix written (hero `<img>` + resized category images, `shopifyImage.ts`), typechecked, **not yet committed/pushed** (commit command was blocked by the permission check; needs user go-ahead).
- OpenSEO audit + Lighthouse run 2026-11-16: SEO 100 everywhere, desktop perf 80-97, mobile perf 55-89 (home LCP 11.8s).

- Added a second GSC verification file, `public/googlefac1a0cf53097d92.html` (alongside the earlier `google40dbce897c805d36.html` — both kept; Google issues a new token per verification attempt/method and re-checks whichever is live).
- CSP now allows Google doubleclick/ads-audience hosts (fixes a blocked GA4 remarketing pixel).
- Added `public/google40dbce897c805d36.html` — first GSC site-verification file, served statically at the site root.
- Removed the Availability filter from real per-collection pages (`collections.$handle.tsx`) — `getListAndBooleanFilters` now also drops Shopify's native `filter.v.availability` facet, matching the earlier `/collections/all` fix.
- Merged in two other commits that landed on `main` meanwhile: `fix: block stacked filter URLs and nofollow facet links`, `feat: keyword-led category H1s and search-matched guide copy`.

## In progress

- Commit and push the mobile LCP change, then re-run mobile Lighthouse on home to compare against 11.8s.

## Next up

- Fix mobile CLS 0.34 on `/blogs` and `/blogs/news`; slow TTFB (1.4-1.9s) on product pages.

- Waiting on Google Search Console domain ownership verification (both HTML files deployed; DNS TXT method was blocked client-side). Once verified: confirm OpenSEO/gsc-mcp return rows, request indexing for 5 collection URLs + homepage.
- OpenSEO's audit crawler needs a Shopify **Web Bot Auth / storefront crawler signature** (Domain + Signature-Input + Signature) to get through Shopify's bot protection — generate one in Shopify Admin (search "crawler signature") for the real storefront domain and paste it into OpenSEO's Shopify integration form. The connected `shopify-dev-mcp`/`multi-account-connectors` Shopify tool was pointed at the wrong store ("Ohubo", `ohubudemo.myshopify.com`) and got disconnected while trying to switch it — needs reconnecting to `wood-123252.myshopify.com` before I can generate/refresh this signature via the `storefrontCrawlerSignatureGenerate` Admin mutation instead of the Admin UI.
- (Closed) facet `rel=nofollow`: no facet links remain, the filter panel only holds category links.

## Blockers & open questions

- Shopify connector needs reconnecting to the CraftWoodFurniture store (see above) before Admin API calls for this project will work again.

## Environment

- **Run:** `npx shopify hydrogen dev --port 3001 --disable-version-check`
- **Deploy:** pushes go straight to `main` (no PR workflow on this repo); production is the connected Oxygen/Vercel deployment for `wood-123252.myshopify.com`.
- **Known issues:** none tracked separately — see [[changelog]].
