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
- User manually unpublished `coat-racks` (Hooks Colours) and `aaa-types-of-corbels` (Types of Corbels) in Shopify Admin from Online Store, POS, Shop, Wood Headless and Craft (the MCP connector blocks `publishableUnpublish` itself, so this had to be done by hand). Verified both product URLs now 404 on the live storefront, and a PDP using their swatch images (`/products/solid-oak-floating-shelf`) still renders fine. Both are still published to one channel, **Meta AI and Muse** — left as-is unless the client wants that off too.
- Fixed swapped Oil Colour swatch images on the PDP (`app/lib/swatches.ts`) — from a previous session, still not yet committed.
- Mobile LCP fix (hero `<img>` + resized category images, `shopifyImage.ts`) — from a previous session, typechecked, still not committed/pushed.

## In progress

- None of the above is committed yet — `npm run typecheck` is clean; changes are sitting in the working tree.

## Next up

- (Done) Unpublishing `coat-racks` / `aaa-types-of-corbels` — see above. Optional: also turn off the remaining "Meta AI and Muse" channel if the client wants them fully invisible everywhere.
- Merchant Center flags surfaced in WhatsApp (not yet investigated/actioned — likely product-data fixes in Shopify Admin, not code):
  - "Missing unit pricing measure" — ~1K products (13.7%) flagged "Not supported".
  - 7 products "Not approved" for Invalid product price + Misrepresentation: Hooks Colours (Old Brass, Chrome, Gold, Black, Old Copper), Types of Corbels (Type A, Type B) — these are variants of the two now-unpublished products; re-check Merchant Center in a day or two to confirm the flags clear.
  - "Inappropriate image" flag (alongside the sitewide Misrepresentation flag) on **Flamed Beam** and **Solid Oak Fireplace Surround** specifically — needs the actual product images reviewed in Shopify Admin / Merchant Center, not a code fix.
  - **Merchant Center fully investigated 2026-11-24** (Aside, logged in as `dzekuza` which has MC access to account `5873004081`): confirmed **all 7,356 products/variants are "Not Approved"** (0 approved/limited) — an **account-level** Misrepresentation flag from a **manual Google review** (first failed ~Oct 30 2026, a requested re-review still failed), not a per-product/per-image issue. Google gives no further sub-reason beyond its standard policy checklist (business identity transparency, reviews/trust badges, SSL/professional design, Business info settings match, SEO/data-matching). Business info (name/address/contact/phone), SSL, domain verified+claimed all check out. Confirmed via `curl` with Googlebot/GoogleShoppingBot UAs that the storefront is **not** blocking crawlers (all 200s) — rules out the bot-protection theory. **Fixed 2026-11-24**: corrected Merchant Center's checkout URL via Aside (user signed in as `dzekuza`, who has MC access) from `https://craftwoodfurniture.co.uk/cart/{id}:1` → `https://checkout.craftwoodfurniture.co.uk/cart/{id}:1` to match the real checkout domain. Saved; Google's own note says it reviews the new checkout URL structure within 24h. The account-wide Misrepresentation flag did **not** clear immediately (expected — Google's review takes time). **Next up**: check back in 24h+, and if still flagged, use "Request a review" (or "I disagree with the issue") in Merchant Center's issue details page. The 11-product "Misrepresentation" list seen in the Shopify Google & YouTube app is just a sample of the same account-wide flag, not separate issues. "Inappropriate image" on Flamed Beam/Fireplace Surround still unconfirmed as a separate per-product issue vs. just surfaced by the same flag — re-check those two individually once the account-level issue clears.
- Mindaugas's Media→Files question (2026-11-23 19:32), **acted on 2026-11-24**: decision made to move non-product-photo images (colour/finish swatch charts) off product Media, since Google Shopping pulls ad images from there. Found one concrete offender via Admin GraphQL audit: a 6-panel oak-finish swatch collage (Clear/Grey/Old Oak/Light Grey/Dark/White, Craftwood-branded, `il_fullxfull.7733204783_3t2y.jpg`) was attached as product Media on **Solid Oak Console Table with Black Hairpin Legs** — with mismatched alt text from an unrelated product ("FLAMED Rustic Mantle Beam..."). Collage/multi-panel images are explicitly against Google Shopping's image policy, so this was a real misrepresentation-flag candidate. Detached it from that product via `fileUpdate(referencesToRemove:...)` — the file itself is untouched and still in Content → Files, just no longer shown as that product's media/fed to Shopping ads. Verified: Console Table now shows only its 2 real product photos. Spot-checked the first 50 files in the store's Files library for other obvious collages/mismatches — none found, but this was not an exhaustive per-image visual review of every product (~16 products, several dozen images total) — worth a fuller manual pass if more turn up after the Merchant Center re-review.
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
