---
tags: [meta, status]
updated: 2026-11-24
---

# Current status — wood

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-24

## Current focus

Working through a batch of client (Mindaugas) requests from the Craftwood WhatsApp group: copy fixes, a Google Merchant Center product-visibility cleanup, and Merchant Center "Not approved" flags on variant/helper products.

## Done recently

- Fixed "CraftWood Furniture" → "Craft Wood Furniture" (two words) in two places: the announcement-bar copy (`app/lib/site.ts` `ANNOUNCEMENT_MESSAGES`) and the homepage craftsmanship section heading, which is CMS content — updated the `page_content` metaobject (handle `index`, field `process.heading`) via Admin GraphQL, not code. Verified both render correctly in the dev preview.
- Renamed footer nav link "Our makers" → "About Us" (`app/components/Footer.tsx`). Note: the _header_ nav is driven entirely by Shopify Admin's menu editor (no hardcoded items in `Header.tsx`) — if "Our makers" also appears there, it needs renaming in Admin → Navigation, not in code.
- Investigated the "color washed out / alignment broken" complaint about the About page hero ("Made by hand, at Craft Wood Furniture" + the up to 5 / 2017 / £0 stats strip). That content lives in the `page_content` metaobject (handle `about`), not hardcoded in `about.tsx`. Checked the live dev preview — text color and stat-strip alignment both render correctly now; no reproducible bug found, so no change made. Flagging in case the client still sees it (could be a since-resolved CMS edit, or a device/viewport-specific rendering issue).
- Confirmed via Admin API that the two "helper" products Mindaugas wants hidden — `coat-racks` (Hooks Colours) and `aaa-types-of-corbels` (Types of Corbels) — are both ACTIVE and published to all 6 sales channels (Online Store, POS, Shop, Wood Headless, Craft, Meta AI and Muse). Confirmed in code that `products.$handle.tsx` already 404s on unpublished products, and that PDP colour/texture swatches (`app/lib/swatches.ts`) are static image assets keyed by option name — **not** sourced from these two products — so unpublishing them is safe and won't break swatches elsewhere.
- **Could not unpublish the two products**: the connected Shopify Admin MCP server blocks `publishableUnpublish` as a destructive-action safety policy, even with user confirmation. Needs to be done manually in Shopify Admin (see Next up).
- Fixed swapped Oil Colour swatch images on the PDP (`app/lib/swatches.ts`) — from a previous session, still not yet committed.
- Mobile LCP fix (hero `<img>` + resized category images, `shopifyImage.ts`) — from a previous session, typechecked, still not committed/pushed.

## In progress

- None of the above is committed yet — `npm run typecheck` is clean; changes are sitting in the working tree.

## Next up

- **Manual (Shopify Admin), not code**: unpublish `coat-racks` (Hooks Colours) and `aaa-types-of-corbels` (Types of Corbels) from all sales channels — Online Store, Point of Sale, Shop, Wood Headless, Craft, Meta AI and Muse — so their pages 404 and they drop out of search/collections/cart. Swatch images on other PDPs are unaffected.
- Merchant Center flags surfaced in WhatsApp (not yet investigated/actioned — likely product-data fixes in Shopify Admin, not code):
  - "Missing unit pricing measure" — ~1K products (13.7%) flagged "Not supported".
  - 7 products "Not approved" for Invalid product price + Misrepresentation: Hooks Colours (Old Brass, Chrome, Gold, Black, Old Copper), Types of Corbels (Type A, Type B) — likely resolved once those two parent products are unpublished above, but worth re-checking Merchant Center after.
  - "Inappropriate image" flag (alongside the sitewide Misrepresentation flag) on **Flamed Beam** and **Solid Oak Fireplace Surround** specifically — needs the actual product images reviewed in Shopify Admin / Merchant Center, not a code fix.
- Mindaugas also asked (2026-11-23 19:32) whether product photos should move from Shopify Media to Content→Files, since Google pulls ad images from Media — needs a decision, not code.
- Commit and push the mobile LCP change + swatch swap fix from the previous session, then re-run mobile Lighthouse on home to compare against 11.8s.
- Fix mobile CLS 0.34 on `/blogs` and `/blogs/news`; slow TTFB (1.4-1.9s) on product pages.
- Waiting on Google Search Console domain ownership verification (both HTML files deployed; DNS TXT method was blocked client-side). Once verified: confirm OpenSEO/gsc-mcp return rows, request indexing for 5 collection URLs + homepage.
- OpenSEO's audit crawler needs a Shopify **Web Bot Auth / storefront crawler signature** for `wood-123252.myshopify.com` — generate via Admin ("crawler signature" search) or the `storefrontCrawlerSignatureGenerate` Admin mutation, and paste into OpenSEO's Shopify integration form.
- (Closed) facet `rel=nofollow`: no facet links remain, the filter panel only holds category links.

## Blockers & open questions

- The Shopify Admin MCP connector is now working and confirmed connected to the right store (Craft Wood Furniture / `wood-123252.myshopify.com`) — the earlier "needs reconnecting" note is stale. It does, however, hard-block destructive mutations like `publishableUnpublish` as a safety policy, so product unpublish/hide actions must be done manually in Admin.

## Environment

- **Run:** `npx shopify hydrogen dev --port 3001 --disable-version-check`
- **Deploy:** pushes go straight to `main` (no PR workflow on this repo); production is the connected Oxygen/Vercel deployment for `wood-123252.myshopify.com`.
- **Known issues:** none tracked separately — see [[changelog]].
