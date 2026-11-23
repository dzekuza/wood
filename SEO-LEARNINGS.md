# SEO learnings: Craft Wood Furniture

- 2026-11-01: seo-audits get_post takes `postId` (not `id`).
- 2026-11-01: seo-audits keywordInIntro needs the exact focus keyword phrase in the first 100 words.
- 2026-11-01: Direct demand for mantel-fitting queries is tiny (10 to 30/month UK); floating shelf install queries are about 880/month. Pick topics by data, not the plan order.
- 2026-11-01: gsc-mcp default site is a different project; use OpenSEO get_search_console_performance with the project id.
- 2026-11-01: Existing blog posts link to the apex host; new content uses www to avoid a redirect.
- 2026-11-23: seo-audits `latest` rank is null for all keywords because the dashboard sync is manual; read OpenSEO get_rank_tracker instead (last check 2026-11-16: 3 keywords ranked, rest not in top 40).
- 2026-11-23: competitor backlink profiles (Off the Grain 238 RD, Celtic Timber 895, Traditional Beams 381) are mostly low-quality blogspot/web.app links; own site has 1 backlink (spam 45) and 1 RD. A few quality UK links (directories, regional press) matter more than volume.
- 2026-11-23: get_ai_visibility_results is ~70k chars; save-to-file then jq.
