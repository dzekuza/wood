# Full SEO, AI SEO & GEO Audit + Master Growth Plan: `craftwoodfurniture.co.uk`

**Audit Date:** 25 November 2026  
**Target Domain:** `https://www.craftwoodfurniture.co.uk/` (apex `craftwoodfurniture.co.uk` 301s to `www`)  
**Stack Audited:** Live production site (all 35 URLs crawled) + local Shopify Hydrogen / React Router 7 codebase (`wood-123252.myshopify.com`)  
**Market:** United Kingdom (`en-GB`, GBP, Free UK delivery, workshop registered in Tonypandy, South Wales)

---

## 1. Executive Summary & Current Status Scorecard

Craft Wood Furniture has **unusually strong technical SEO fundamentals** for a small UK Shopify Hydrogen store (clean canonicals, custom sitemaps, `llms.txt`, `FAQPage`/`Product`/`Organization` JSON-LD, no duplicate apex links), **a proven off-platform commercial moat** (1,425 verified Etsy reviews at **4.92★** across thousands of sales), **and near-zero domain authority & organic/AI visibility on its own domain**.

> [!IMPORTANT]
> **The Core Diagnosis:** You do not have a "broken site" problem — you have an **Authority, Entity Consolidation, and Content Footprint** problem, plus a small set of high-impact technical/schema gaps (PDP TTFB ~900ms, missing `CollectionPage`/`ItemList` & `ProductGroup`/`AggregateOffer` schema, no first-party review schema, and brand-name fragmentation).

| Pillar | Score | Current Status (Live Evidence) | Primary Bottleneck |
| :--- | :---: | :--- | :--- |
| **Technical SEO & Crawlability** | **82 / 100** | Clean `www` canonicalization, 32 clean sitemap URLs, zero broken pages, zero missing `alt` attributes, clean `robots.txt` | PDP TTFB **682–1,041ms** (sequential Storefront queries + `CacheShort`), missing HTTP `Cache-Control` on HTML docs, `/search` missing canonical & `noindex` |
| **On-Page SEO & Schema** | **74 / 100** | Solid title/meta lengths (100% of indexed pages pass), 5 money collections have editorial guides + `FAQPage` | Homepage `<h1>` lacks commercial keywords (`Timeless Oak.Made for Your Home.`); missing `CollectionPage`/`ItemList` on category pages; `Product` lacks `AggregateOffer`/variants & first-party `aggregateRating`; `Organization` missing `telephone`, `foundingDate`, eBay `sameAs` |
| **Content & Keyword Footprint** | **45 / 100** | 12 products, 7 collections, 6 blog posts (~1,300–1,580 words each on recent guides) | Competitors rank across 100s of long-tail dimension, wood-type, stove-clearance, alcove, and wall-type queries; Door Stops & Cube Blocks are thin (~348 words, no FAQs); `/blogs` vs `/blogs/news` duplicate index |
| **Off-Page Authority & Backlinks** | **8 / 100** | **1 referring domain** (spam score 45, nofollow) vs Off the Grain (238 RD), Traditional Beams (381 RD), Celtic Timber (895 RD) | Zero editorial UK press/roundup links, zero directory/citation foundation, no Trustpilot or Google Business Profile |
| **AI SEO / GEO Visibility** | **32 / 100** | Already cited in live AI search for **`solid oak coat rack UK`** and **`solid oak fireplace surround UK`**, and `/llms.txt` is live | **0% visibility** on highest-value categories (**`solid oak mantel beam UK`** & **`solid oak floating shelves UK`**); AI relies on Etsy and warns of brand confusion with *"Crafted Wood UK"*; no `llms-full.txt`, no explicit AI-bot rules in `robots.txt` |

---

## 2. Live Technical & On-Page Audit (All 35 URLs Crawled)

### 2.1 Domain, Redirects, Sitemaps & Indexation

| Check | Live Result | Verdict |
| :--- | :--- | :---: |
| `http://craftwoodfurniture.co.uk/` | `301` → `https://craftwoodfurniture.co.uk/` → `301` → `https://www.craftwoodfurniture.co.uk/` (2 hops) | ⚠️ Minor (standard Oxygen HTTPS-first hop; acceptable, ensure all internal & external links use `https://www.`) |
| `https://craftwoodfurniture.co.uk/` | `301` → `https://www.craftwoodfurniture.co.uk/` (144ms) | ✅ Pass |
| `https://www.craftwoodfurniture.co.uk/` | `200 OK` (80ms TTFB) | ✅ Pass |
| `/sitemap.xml` | 5 child sitemaps: `products` (12), `pages` (6), `collections` (7), `articles` (6), `blogs` (1) = **32 URLs** | ✅ Clean (addon products & `most-popular` properly excluded) |
| `/robots.txt` | `200 OK`, blocks `/cart`, `/account`, `/search?*`, filter/sort params; points to `www` sitemap | ⚠️ Missing explicit AI search crawler directives (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`) |
| `/llms.txt` | `200 OK` (4,069 bytes), well-structured facts, links, Etsy entity link | ✅ Strong start — upgrade with specs, price bands, & add `/llms-full.txt` |
| `/landing-oak` | `200 OK`, has `<meta name="robots" content="noindex, follow"/>`, excluded from sitemap | ✅ Safely noindexed (fix 4 `<h1>` tags if used for paid ads) |
| `/search` | `200 OK`, **no `<meta name="robots" content="noindex">`, no canonical tag, no meta description** | ❌ Fix: add `noindex, follow` + canonical in [search.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/search.tsx) |
| `/blogs` vs `/blogs/news` | Both are `200 OK`, self-canonical, **both in sitemap**, near-identical content (454 vs 412 words) | ⚠️ Consolidate: 301 `/blogs/news` → `/blogs` or remove `/blogs/news` from sitemap and canonicalize to `/blogs` |
| Apex links in live HTML | `0` found across audited pages | ✅ Clean |
| Missing image `alt` attributes | `0` missing across all 35 pages | ✅ Clean |

### 2.2 Performance & TTFB Bottleneck (Code-Level Finding)

Live crawl response times (HTML TTFB):
- **Homepage `/`:** `80ms` (fast after PR #12 cached page copy!)
- **Static & Blog pages:** `175ms – 351ms` (good)
- **Collections:** `248ms – 642ms` (`/collections/all`: `719ms`, `/collections/solid-oak-mantel-beams`: `642ms`)
- **Product Pages (11 of 12 slow):** **`682ms – 1,041ms`** (e.g., `/products/coat-rack-set-of-2`: `1,041ms`, `/products/solid-oak-mantel-beam`: `960ms`, `/products/solid-oak-floating-shelf`: `936ms`)

**Root cause verified in [products.$handle.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/products.$handle.tsx#L129-L148):**
1. **Sequential Storefront API waterfall:** `loadCriticalData` awaits `PRODUCT_VARIANTS_QUERY` first, then sequentially awaits `PRODUCT_QUERY`. Both use `storefront.CacheShort()` (only 1s max-age fresh).
2. **Bot streaming penalty:** For crawlers/bots (`entry.server.tsx` waits for `allReady`), response waits for deferred `PRODUCT_RECOMMENDATIONS_QUERY` too.
3. **No document-level CDN `Cache-Control`:** Every audited HTML response returned `Cache-Control: None`.

**Fix:**
- Merge `PRODUCT_VARIANTS_QUERY` into a single Storefront query (or cache `PRODUCT_VARIANTS_QUERY` with `CacheCustom({mode: 'public', maxAge: 300, staleWhileRevalidate: 3600})`) to cut PDP TTFB in half (`<300ms`).
- Ensure anonymous GET HTML responses emit proper `s-maxage` / `stale-while-revalidate` edge caching where safe (skipping when cart/session cookies are present).

### 2.3 On-Page & Structured Data Gaps (Mapped to Exact Codebase Files)

| Issue | Where Found | Concrete Fix |
| :--- | :--- | :--- |
| **1. Homepage `<h1>` lacks primary keywords + missing space in DOM** | Live `/` (`Timeless Oak.Made for Your Home.`) in [_index.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/_index.tsx) | Add a space before `<br/>` and include target entity/category terms cleanly (e.g., `Handmade Solid Oak Mantel Beams & Shelves` as H1 or visually paired display subtitle) so crawlers immediately classify the root domain. |
| **2. Missing `CollectionPage` + `ItemList` JSON-LD on category pages** | All 7 `/collections/$handle` pages in [collections.$handle.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/collections.$handle.tsx#L44-L52) | Add `collectionPageJsonLd()` (already exists in [structuredData.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/structuredData.ts#L72-L89)!) plus an `ItemList` of the collection's products with prices & URLs. |
| **3. `Product` schema lacks `AggregateOffer` / `ProductGroup`, `sku` on 9/12 products, and first-party ratings** | [products.$handle.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/products.$handle.tsx#L79-L88) & [structuredData.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/structuredData.ts#L153-L221) | (a) Emit `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`) or `ProductGroup` + `hasVariant` for multi-size/multi-finish products so Google & AI see the full size/price range.<br>(b) Populate SKUs in Shopify Admin for the 9 products currently missing `sku`.<br>(c) **Important compliance note:** Keep third-party Etsy reviews OUT of `Product.aggregateRating` (Google prohibits third-party reviews in Product rich-result schema). Install a first-party review collector (Judge.me / Shopify Product Reviews / Google Customer Reviews) to earn legitimate rich-snippet stars on `www.craftwoodfurniture.co.uk`. |
| **4. `Organization` schema missing key entity signals** | [structuredData.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/structuredData.ts#L11-L43) | Add `telephone: CONTACT_PHONE_HREF` (`+447904497890` is already in [site.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/site.ts#L45-L46)), `foundingDate: "2017"` (or `"2019"` per incorporation — confirm), add `https://www.ebay.co.uk/str/craftwoodfurniture` to `sameAs`, and reference `{'@id': ORGANIZATION_ID}` inside `Product.brand`, `Product.manufacturer`, and `Offer.seller`. Consider adding `FurnitureStore` / `HomeGoodsStore` if/when GBP is verified. |
| **5. `Article` schema missing `dateModified`, `HowTo`/`FAQPage` on guides, and named human author** | [blogs.$blogHandle.$articleHandle.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/blogs.$blogHandle.$articleHandle.tsx#L31-L38) | Add `dateModified`, `wordCount`, and `about`/`mentions` linking to the relevant collection URL. Attribute articles to a real named maker/workshop founder (`Person` linked to `worksFor: {@id: ORGANIZATION_ID}`) for E-E-A-T. Add `FAQPage` schema to the "Questions people ask" sections already rendered on your 5 long-form guides! |
| **6. Thin collection pages (`door-stops` & `cube-blocks`)** | `/collections/solid-oak-door-stops` (348w), `/collections/solid-oak-cube-blocks` (349w) in [collectionContent.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/collectionContent.ts) | Add 350–500 words of buyer copy + 4–5 FAQs + `FAQPage` schema to both collections so all 7 categories have consistent topical depth. |
| **7. Inconsistent PDP title formats** | 2 of 12 PDPs end in `| Handmade UK` instead of `| Craft Wood Furniture` (`solid-oak-fireplace-surround`, `solid-oak-block-side-table`) | Standardize brand reinforcement across titles while preserving target keyword + `UK` where CTR benefits (e.g., `Solid Oak Fireplace Surround – Handmade UK | Craft Wood Furniture` or consistent pattern ≤60 chars). |
| **8. `/policies/*` and `/contact` missing basic schema** | `/contact` (`schemas=[]`), `/policies` (`schemas=[]`) | Add `ContactPage` schema linking to `ORGANIZATION_ID` on `/contact`. |

---

## 3. UK Keyword Research & Search Intent Matrix

*Calibrated to UK search demand, GBP buyer modifiers, `SEO-LEARNINGS.md` observations, and live UK SERP intent. Exact monthly volumes should be validated/tracked once connected to Semrush or Google Search Console.*

### 3.1 Commercial "Money" Keyword Clusters (Collections & PDPs)

| Priority | Primary UK Keyword Cluster | Secondary / Long-Tail Modifiers (UK) | Search Intent | Target Page | Current Gap |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **P1** | **solid oak mantel beam** / **oak mantel beam UK** | `rustic oak mantel beam`, `floating oak mantel beam`, `solid oak fireplace beam`, `oak mantel beam 120cm / 150cm / 4ft / 5ft / 6ft`, `made to measure oak mantel beam`, `oak beam for log burner`, `flamed oak mantel beam`, `oak mantel beam with corbels` | Transactional | `/collections/solid-oak-mantel-beams` + 3 beam PDPs | **Highest revenue cluster.** Competitors have dedicated style/size landing pages + sample packs + Trustpilot stars. |
| **P1** | **solid oak floating shelves** / **oak floating shelves UK** | `chunky oak floating shelves`, `4cm thick oak floating shelf`, `bespoke oak floating shelves`, `alcove oak floating shelves`, `heavy duty oak floating shelves`, `solid oak wall shelf with black brackets`, `rustic oak shelves UK` | Transactional | `/collections/solid-oak-shelves` + 2 shelf PDPs | **High volume + easier entry via "4cm thick" & "made to size" angles.** Missing alcove/bracket-type guidance & load ratings. |
| **P1** | **solid oak fireplace surround** / **oak fire surround UK** | `3 piece solid oak fire surround`, `rustic oak fireplace surround`, `made to measure oak fire surround`, `oak fire surround for wood burner`, `oak mantel surround UK` | Transactional | `/collections/solid-oak-fireplace-surrounds` + PDP | **Already gaining AI citation!** Double down with measurement guide + 2–3 style/size variants. |
| **P2** | **solid oak coat rack** / **wooden coat rack with shelf UK** | `wall mounted oak coat rack`, `solid oak hallway coat rack`, `rustic oak coat hooks`, `oak peg rail`, `oak coat rack with top shelf` | Transactional | `/collections/solid-oak-coat-racks` + 3 rack PDPs | **Already cited by AI + 513 Etsy reviews (4.92★)!** Easiest category to push into UK Top 5 organically. |
| **P2** | **solid oak console table** / **narrow oak console table UK** | `oak console table hairpin legs`, `solid oak hallway table`, `narrow hallway console table UK`, `rustic oak console table` | Transactional | `/collections/console-tables` + PDP | Currently only **1 product** in collection; narrow depth / hallway sizing variants will multiply keyword coverage. |
| **P3** | **solid oak block side table** / **oak cube side table** | `chunky solid oak cube block`, `solid oak bedside block`, `rustic oak stump side table` | Transactional | `/collections/solid-oak-cube-blocks` + PDP | Thin collection page (349w); add styling/sizing guide & FAQs. |
| **P3** | **solid oak door stop** / **heavy wooden door stop UK** | `solid oak door stop rope handle`, `heavy oak doorstop UK`, `rustic wood door wedge / block` | Transactional | `/collections/solid-oak-door-stops` + PDP | Thin collection page (348w); great gift/upsell SEO angle. |

### 3.2 High-Demand Informational & Commercial-Investigation Keywords (Blog / Guides)

> [!TIP]
> Per `SEO-LEARNINGS.md`, UK demand for **floating shelf installation** (~880/mo UK) dwarfs direct mantel-fitting (~10–30/mo), while **log burner / HETAS oak beam clearances** and **wall-type fixing (dot-and-dab / plasterboard / brick)** are massive high-converting buyer blockers that AI engines constantly cite!

| Priority | Target Topic & UK Focus Keyword | Supporting Queries | Funnel Stage | Status |
| :---: | :--- | :--- | :--- | :--- |
| **P1** | **Oak mantel beam clearance above log burner (UK Building Regs / Document J)** | `how high should an oak beam be above a wood burner`, `distance from stove to wooden mantel UK`, `HETAS oak mantel clearance`, `heat shield for oak beam` | Pre-purchase / Blocker | **NEW (High GEO & link magnet)** — confirm safety wording with Rysard; cite Approved Document J + manufacturer-first rule |
| **P1** | **How to fit heavy oak floating shelves on plasterboard, dot-and-dab & stud walls** | `can you put solid oak floating shelves on plasterboard`, `dot and dab floating shelf fixings`, `best wall plugs for heavy oak shelves` | Pre-purchase / High volume | **NEW (Expand shelf cluster)** — complements existing solid-wall guide |
| **P1** | **Air-dried vs kiln-dried vs green oak mantel beams (which should you buy?)** | `kiln dried vs air dried oak beam`, `will my oak mantel beam crack`, `why do oak beams split above a fire`, `solid oak vs oak veneer mantel` | Comparison | **NEW (High AI citation value)** |
| **P1** | **Oak mantel beam size guide & chimney breast calculator** | `what size mantel beam for chimney breast`, `how much overhang for oak mantel`, `oak mantel beam depth guide` | Pre-purchase | Existing (`/blogs/news/oak-mantel-beam-sizes`) — **upgrade with interactive size calculator + diagram** |
| **P2** | **How to care for, clean & re-oil solid oak furniture (6 oil finishes)** | `how to oil an oak mantel beam`, `best oil for solid oak shelves`, `how to remove water rings from oiled oak` | Post-purchase / Trust | **NEW** — links directly to `oak-oil-colours-compared` & all money pages |
| **P2** | **Alcove floating shelves: measuring, spacing & styling guide (UK homes)** | `alcove shelf spacing guide`, `how far apart should floating shelves be`, `best depth for alcove shelves` | Discovery → Transactional | **NEW** — high Pinterest + Google + AI visual discovery |
| **P2** | **Where to buy handmade solid oak furniture in Wales / UK maker spotlight** | `Welsh oak furniture makers`, `handmade solid oak furniture UK`, `solid oak furniture made in Wales` | Brand / Local PR | Upgrade `/about` with founder/workshop photos, Tonypandy origin story, timber sourcing, & press kit |
| **P3** | **Narrow hallway styling: oak console tables & coat racks for UK Victorian/terraced halls** | `narrow hallway storage ideas UK`, `hallway coat rack height`, `what height to hang a coat rack` | Top-of-funnel | **NEW** — feeds both Coat Racks & Console Tables |

---

## 4. Competitive Landscape & Gap Analysis (UK Market)

Based on live UK SERP & AI Search analysis across all core categories:

| Competitor | Core Overlap | Backlinks (RD) | Why They Win Organic & AI Citations | Weaknesses You Can Exploit |
| :--- | :--- | :---: | :--- | :--- |
| **Off the Grain** (`offthegrain.co.uk`) | Mantel beams, floating shelves, coat racks, console tables | ~238 RD | Yorkshire maker story, bespoke cm sizing, rich wax/oil colour pages, strong editorial mentions (Exeter Daily, London Loves Business, House & Garden, Ideal Home, Saga), Trustpilot social proof | Higher price points on several SKUs; some non-oak (pine) positioning; backlink profile padded with low-tier sites |
| **Celtic Timber** (`celtictimber.co.uk`) | Mantel beams, fire surrounds (also Wales-based!) | ~895 RD | Massive timber-yard authority, Welsh regional directories (`walesonline`, `visitpembrokeshire`), huge product/size SKU matrix, heavy structural beam reputation | Less boutique/interior-design aesthetic; more industrial/timber-yard UX; many low-quality blog links |
| **Traditional Beams** (`traditionalbeams.com`) | Mantel beams, rustic aged oak | ~381 RD | Exact-match domain authority, clear sizing/fitting guides, fast turnaround messaging, strong Trustpilot & Google reviews | Narrower focus (beams only — no coat racks, consoles, or cohesive room-matching sets) |
| **Funky Chunky Furniture** (`funky-chunky-furniture.co.uk`) | Mantel beams, floating shelves, solid wood furniture | High (established brand) | Dominant brand awareness in UK SERPs & AI answers, free wax samples, keyhole concealed fixing USPs, massive review volume | Mass-market scale feels less personal/workshop-direct than a small independent maker |
| **Country & Coast** (`countryandcoast.co.uk`) | Mantel beams, fire surrounds (Wales!) | Medium | **Rank #1 for UK oak mantel buyer's guides & stove clearance guides** — cited repeatedly by AI for Document J clearances | Smaller overall catalog; proving that **authoritative buying/clearance guides directly earn AI citations even at modest domain size** |
| **Bespoke Nature** (`bespokenature.co.uk`) & **Planks** (`planks.co.uk`) | Solid oak floating shelves | Medium | Win AI answers for floating shelves via **wall-type bracket selectors** (brick vs stud vs dot-and-dab), explicit **35–50kg load ratings**, and **free oak sample packs** | Shelf-only specialists — cannot sell matching mantel + alcove shelves + coat rack in the exact same oil finish |

### Craft Wood Furniture's Unfair Advantages (Positioning Angle)
1. **Whole-Room Matching in One Solid Oak Workshop:** Few UK competitors let a buyer match a **solid European oak mantel beam + alcove floating shelves + hallway coat rack + console table** in the exact same 6 oil finishes (`Clear`, `Old Oak`, `Dark`, `Grey`, `Light Grey`, `White`) with free UK delivery.
2. **1,425 Verified Etsy Reviews (4.92★):** Massive real-world trust that just needs to be bridged onto `www.craftwoodfurniture.co.uk`, Google, and Trustpilot.
3. **Genuine Small-Workshop Welsh Provenance (Tonypandy, Rhondda):** Strong regional PR, "Made in Wales" directory, and interiors-editor story angle.
4. **Already Superior Technical Base:** Your Hydrogen storefront is cleaner and faster (once PDP waterfall is fixed) than most legacy WooCommerce/Shopify competitor themes.

---

## 5. AI SEO / GEO & Buyer Prompt Research

### 5.1 Current AI Visibility Baseline (Verified 25 Nov 2026)

| Query / Category | Craft Wood Furniture Cited? | Who AI Cites Instead | Root Cause |
| :--- | :---: | :--- | :--- |
| `"solid oak mantel beam" UK buy` | ❌ No | Celtic Timber, Funky Chunky, Off the Grain, Traditional Beams, Country & Coast, BespOak Mantels | Near-zero external citations/roundups + no Trustpilot/Google reviews |
| `"where to buy oak mantel beam UK"` | ❌ No | Funky Chunky, Traditional Beams, Celtic Timber, Off the Grain, Country & Coast | Not included in UK buyer's guide roundups (e.g., Exeter Daily) |
| `"solid oak floating shelves UK handmade"` | ❌ No | Off the Grain, Bespoke Nature, Planks, MijMoj Design, Green Oak Man | Missing wall-type bracket detail, load rating specs, and sample pack offer |
| `"solid oak fireplace surround UK handmade"` | ✅ **Yes (cited)** | Celtic Timber, Oakley's Oak, Cottage Beams, BK Joinery, **Craft Wood Furniture** | Lighter niche competition + strong on-page guide/FAQs |
| `"solid oak coat rack UK handmade"` | ✅ **Yes (cited)** | Off the Grain, LuxeHouse Decor, **Craft Wood Furniture**, Cottage Garden Carpenter | Strong product-market match + 513 Etsy reviews on coat rack with shelf |
| `"Craft Wood Furniture reviews"` | ⚠️ Partial (Etsy) | Etsy shop (`4.9★`), plus **brand confusion warning with "Crafted Wood UK" on Trustpilot** | No official Trustpilot/GBP profile + inconsistent brand naming across web & trackers |

### 5.2 UK Buyer Prompt Research (30 High-Value AI Prompts Across 5 Funnel Stages)

Design your pages, comparison tables, FAQs, and `llms-full.txt` to directly answer these exact conversational prompts people type into ChatGPT, Perplexity, Gemini, and Google AI Mode:

#### Stage 1: Category Discovery ("Best / Where to buy")
1. *"Where is the best place to buy a handmade solid oak mantel beam in the UK with concealed fixings?"*
2. *"Best UK workshops for made-to-measure solid oak floating shelves (not veneer or MDF)?"*
3. *"Who makes matching solid oak mantel beams and alcove floating shelves in the same finish in the UK?"*
4. *"Best handmade solid oak coat racks with a top shelf in the UK with free delivery?"*
5. *"Small independent UK furniture makers in Wales that make solid oak fireplace surrounds?"*
6. *"Best narrow solid oak console table with hairpin legs for a UK terraced hallway?"*

#### Stage 2: Technical Specs, Sizing & Compatibility (High-Citation "Fact" Prompts)
7. *"How long should an oak mantel beam be compared to my fireplace opening and chimney breast?"*
8. *"What thickness and depth should solid oak floating shelves be for books or kitchen plates?"*
9. *"How much weight can a 4cm thick solid oak floating shelf hold on a brick wall?"* *(Blocked on Rysard confirming load rating)*
10. *"What is the legal minimum clearance between a wood-burning stove and a solid oak mantel beam in the UK?"*
11. *"Can you fit a heavy solid oak floating shelf or mantel beam onto dot-and-dab plasterboard or a stud wall?"*
12. *"Do I need a 3-piece solid oak fireplace surround or just a floating mantel beam?"*

#### Stage 3: Material, Finish & Quality Comparison
13. *"Solid European oak vs oak veneer floating shelves — is solid oak worth the extra cost?"*
14. *"Air-dried vs kiln-dried oak mantel beams: which cracks less above a log burner?"*
15. *"What is the difference between clear oil, old oak, dark oak, grey, and white oil finishes on solid oak?"*
16. *"What is a flamed solid oak mantel beam and how does it compare to a standard rustic oak beam?"*
17. *"Will a solid oak mantel beam split or warp in a centrally heated UK living room?"*
18. *"Oil finish vs wax finish on solid oak shelves and mantels: which is easier to maintain?"*

#### Stage 4: Installation & DIY
19. *"How do you fit a solid oak mantel beam with concealed brackets into a brick chimney breast?"*
20. *"Step-by-step guide to installing floating oak shelves with pre-drilled holes so they stay dead level."*
21. *"What drill bit and rawl plugs do I need for heavy oak mantel concealed fixings?"*
22. *"How high should you hang a solid oak coat rack in a hallway?"*
23. *"How far apart should alcove floating shelves be spaced vertically?"*

#### Stage 5: Brand Verification & Competitor Comparison
24. *"Is Craft Wood Furniture (craftwoodfurniture.co.uk) legit? What are their reviews like?"*
25. *"Is CraftWoodFurniture on Etsy the same company as craftwoodfurniture.co.uk?"*
26. *"Craft Wood Furniture vs Off the Grain vs Funky Chunky Furniture for solid oak mantel beams?"*
27. *"How long does Craft Wood Furniture take to make and deliver a custom oak mantel beam?"*
28. *"Does Craft Wood Furniture do custom sizes and free UK delivery?"*
29. *"Are Craft Wood Furniture shelves and beams 100% solid oak or veneer?"*
30. *"What is Craft Wood Furniture's return policy if a standard oak beam doesn't fit?"*

### 5.3 GEO Optimization Blueprint (How to Win AI Citations)

1. **Fix Entity Disambiguation Immediately:**
   - Standardize on **`Craft Wood Furniture`** everywhere (with `alternateName: ["CraftWood Furniture", "CraftWoodFurniture", "CraftWood"]` already added in schema — also update the OpenSEO AI visibility tracker from `"CraftedWood"` to `"Craft Wood Furniture"` + variants!).
   - Link **Etsy Shop "About"**, **eBay Store description**, **Facebook**, **Pinterest**, **Trustpilot**, and **Google Business Profile** directly to `https://www.craftwoodfurniture.co.uk/`.
   - Add a clear "One Workshop, Multiple Channels" proof block on `/about` explicitly stating *"We are Craft Wood Furniture (CRAFTWOOD FURNITURE LTD, Company No. 11805480, Tonypandy, Wales) — the same workshop behind our 4.9★ CraftWoodFurniture Etsy shop (1,425+ reviews) and eBay store."*
2. **Add "Answer-First" Citation Blocks & Comparison Tables to Every Guide & Collection:**
   - LLMs extract **40–60 word direct answers right below H2 question headings**, structured **HTML `<table>` specs** (sizes, thicknesses, prices, dispatch times, finish names), and **verifiable facts** (4cm thick shelves, 15/20/25/30cm depths, 30–150cm lengths, 3ft–6.5ft mantel beams, 6 oil colours, free UK delivery).
   - Add a **Price & Size Quick-Reference Table** to every collection page and to `/llms-full.txt`.
3. **Upgrade `/llms.txt` + Launch `/llms-full.txt` + Update `robots.txt`:**
   - Expand `[llms.txt].tsx` to include: exact price ranges ("From £59" to "£254+"), exact dimension ranges (`4cm thick`, `15/20/25/30cm depths`, `30–150cm lengths`, `3ft–6.5ft beams`), the 6 named oil finishes (`Clear, Old Oak, Dark, Grey, Light Grey, White`), Etsy review proof (`4.92★ across 1,425 reviews`), and phone/address.
   - Add a `/llms-full.txt` route that serves clean markdown summaries of all 7 collections, 12 products (with exact sizes/prices), policies, and top FAQs so AI agents ingest the whole catalog in one fetch.
   - Explicitly allow AI search crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`) in `[robots.txt].tsx` with `Allow: /` and `Sitemap: https://www.craftwoodfurniture.co.uk/sitemap.xml`.
4. **Win Third-Party Consensus (The #1 GEO Lever):**
   - AI models rarely recommend a brand based solely on its own website; they cross-check **independent roundups, review platforms, and forums**. Securing just **5–10 genuine UK citations** (Trustpilot, Google Business Profile, Exeter Daily, London Loves Business, Houzz UK, Wales directories, and 2–3 home/interiors publications) will flip AI recommendations in your favour on Mantel Beams & Floating Shelves.

---

## 6. Master Prioritized Execution Plan (90-Day + 6-Month Roadmap)

### Phase 1: Technical, Schema & Entity Quick Wins (Weeks 1–2 — High Impact, Low Effort)

- [ ] **Fix PDP TTFB waterfall** in [products.$handle.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/products.$handle.tsx#L129-L148): combine or aggressively cache `PRODUCT_VARIANTS_QUERY` + `PRODUCT_QUERY` to drop PDP TTFB from `~900ms` to `<300ms`.
- [ ] **Fix `/search` indexation hygiene** in [search.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/search.tsx): add `noindex, follow` + canonical URL + meta description.
- [ ] **Deduplicate `/blogs` vs `/blogs/news`:** canonicalize or 301 `/blogs/news` → `/blogs` and remove the duplicate entry from the blogs sitemap.
- [ ] **Upgrade Structured Data** in [structuredData.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/structuredData.ts):
  - Add `CollectionPage` + `ItemList` to all 7 `/collections/$handle` routes.
  - Upgrade `productJsonLd` to support `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`) + link `brand`/`seller`/`manufacturer` to `ORGANIZATION_ID`.
  - Add `telephone`, `foundingDate`, and eBay store URL to `organizationJsonLd`.
  - Add `dateModified`, named `Person` author, and `FAQPage` schema to the 5 long-form advice articles.
  - Add `ContactPage` schema to `/contact`.
- [ ] **Fix Homepage `<h1>`** in [_index.tsx](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/routes/_index.tsx): fix `Timeless Oak.Made` spacing bug and incorporate core UK solid oak furniture/mantel/shelf positioning clearly above the fold.
- [ ] **Populate missing SKUs** in Shopify Admin for the 9 products currently emitting `sku=False`.
- [ ] **Upgrade `/llms.txt`, add `/llms-full.txt`, and add explicit AI search bot rules in `[robots.txt].tsx`**.
- [ ] **Add cross-links from Etsy Shop "About" and eBay Store** pointing directly to `https://www.craftwoodfurniture.co.uk/`.

### Phase 2: Trust, Reviews & First-Party Rich Results (Weeks 3–4)

- [ ] **Claim & optimize Trustpilot UK business profile** (`craftwoodfurniture.co.uk`) — immediately fixes the AI *"Crafted Wood UK"* brand confusion warning and gives LLMs an independent rating source.
- [ ] **Claim Google Business Profile** (Service-Area Business or Workshop in Tonypandy, Rhondda Cynon Taf, if eligible) + **Google Merchant Center** (Free Listings + Shopping feed — feeds Google Shopping Graph & AI Overviews product cards!).
- [ ] **Enable First-Party Storefront Reviews** (e.g., Judge.me free/low-cost plan synced to Hydrogen + automated post-delivery email to direct site buyers) so you can **compliantly emit `Product.aggregateRating` JSON-LD** and earn gold review stars in UK Google SERPs.
- [ ] **Fix OpenSEO / Rank Tracker Brand Name:** Change tracked AI brand from `"CraftedWood"` to `"Craft Wood Furniture"` / `"CraftWoodFurniture"` so GEO mention rate is measured accurately.

### Phase 3: High-Leverage Content, Conversion & Programmatic Depth (Weeks 5–10)

- [ ] **Flesh out thin collections:** Add 400+ word guides + 5 FAQs + `FAQPage` schema to `/collections/solid-oak-door-stops` and `/collections/solid-oak-cube-blocks` in [collectionContent.ts](file:///Users/rysardgvozdovic/Desktop/projects/wood/app/lib/collectionContent.ts).
- [ ] **Publish 4 priority high-intent UK guides** (targeting verified demand & AI citation gaps):
  1. *Oak Mantel Beam Clearance Above a Log Burner (UK Document J & HETAS Guide)*
  2. *How to Fit Heavy Solid Oak Floating Shelves on Plasterboard, Dot-and-Dab & Stud Walls*
  3. *Air-Dried vs Kiln-Dried vs Solid European Oak Mantel Beams: Cracking, Movement & Care*
  4. *Alcove Floating Shelves UK: How to Measure, Space & Match Your Mantel Beam*
- [ ] **Build 1 Interactive Link-Worthy Tool:** **Oak Mantel Beam & Shelf Size Calculator** (inputs: chimney breast width, fireplace opening width, stove clearance check → recommends exact Craft Wood beam length + links directly to pre-selected variant!).
- [ ] **Launch an "Oak Oil Finish Sample Pack" SKU (e.g. £5–£10 redeemable):** Competitors (Planks, Funky Chunky, Off the Grain) convert undecided buyers AND earn tons of editorial mentions/internal links from sample packs.
- [ ] **Upgrade `/about` into a Press-Ready Maker Story Page** with authentic workshop photos, Tonypandy origin story, European oak sourcing, and downloadable press photos for editors.

### Phase 4: UK Authority, Backlinks & Digital PR (Weeks 6–16 — Ongoing)

Execute the prioritized outreach pipeline already drafted in [backlink-targets.md](file:///Users/rysardgvozdovic/Desktop/projects/wood/obsidian/seo/backlink-targets.md), sequenced by ROI:
1. **Week 6 (Baseline Citations & Entity Strength — Low effort):** Claim Trustpilot, ProvenExpert UK, Yell, Houzz UK, Bark/Local Welsh directories (`walesonline` directory, Rhondda business listings) with identical NAP (`CRAFTWOOD FURNITURE LTD, 17 Sherwood Street, Tonypandy CF40 2TB, +44 7904 497890`).
2. **Weeks 7–8 (Exact-Topic UK Roundups — Highest ROI):** Pitch **The Exeter Daily** (*Where to Buy Mantel Beams in the UK*) and **London Loves Business** (*Best Solid Wood Furniture Brands in the UK*) with original installed photos + size guide reference.
3. **Weeks 9–12 (Regional Welsh PR & Interiors Press):** Pitch local Rhondda/South Wales press ("Tonypandy solid oak workshop hits 7,500+ handmade orders") + UK interiors editors (*Ideal Home, Good Homes, Saga, House & Garden*) pitching **solid oak coat racks & shelves** (your strongest review/citation category).
4. **Weeks 10–16 (Trade & Installer Partnerships):** Reach out to 15–20 independent UK HETAS stove installers and fireplace shops offering a trade discount / "Recommended Mantel Beam Suppliers" listing + sharing your Document J clearance guide.
5. **Community Presence (Zero-spam GEO signal):** Answer genuine questions in UK DIY/interiors communities (Reddit `r/DIYUK`, `r/HousingUK`, Log Burner groups) about oak shelf fixing & mantel sizing — Reddit is a top citation source for ChatGPT, Perplexity, and Google AI Overviews.

### Phase 5: Measurement & KPIs (Monthly Cadence)

| KPI | Current Baseline (Nov 2026) | 90-Day Target | 6-Month Target |
| :--- | :---: | :---: | :---: |
| Referring Domains (Quality UK, Spam <15) | 0 (1 spam RD) | 12–18 RD | 35–50 RD |
| Ranked Top-10 UK Commercial Keywords | ~0–3 | 10–15 (Coat Racks, Fire Surrounds, Shelf long-tails) | 30+ (incl. Mantel Beams & Floating Shelves) |
| PDP Median TTFB (Bot & User) | ~890ms | <300ms | <200ms |
| First-Party Reviews (Site + Trustpilot + Google) | 0 | 30+ verified | 120+ verified |
| AI Visibility Mention Rate (30-prompt UK panel) | ~15–20% (Coat Racks & Surrounds only) | 40%+ | 65%+ (including Mantel Beams & Shelves) |
| Google Merchant Center Free Listings | Not verified | Active (all 12 core products + variants) | Active + Review Stars |

---

## 7. Action Items Blocked on Founder Input (`TODO(Rysard)`)

Before publishing new guides, schema updates, or PR outreach, confirm these 5 facts so zero inaccurate claims ever ship:
1. **True Lead Time:** Confirm whether sitewide dispatch is **up to 5 days + 2–3 working days delivery** (current `llms.txt`/policy) or **5–10 working days** (mentioned in older posts).
2. **Shelf Load Rating:** Confirm whether an official max load rating (e.g., kg per shelf on solid brick) can be published for the 4cm floating shelves.
3. **Etsy Sales & Review Numbers for PR:** Confirm exact headline numbers (`1,425+ Etsy reviews / 4.92★` is verified in `app/data/etsy-ratings.ts`; confirm `7,500+ total sales` before citing in press pitches).
4. **Founding Year & Named Author:** Confirm whether `Organization.foundingDate` should be `2017` (workshop start) or `2019` (Ltd incorporation), and which founder/maker name to use for article `author` E-E-A-T bylines.
5. **Original Workshop & Installed Photography:** Provide high-res photos of installed oak beams, shelves, and the Tonypandy workshop for `/about`, press pitches, and article covers.
