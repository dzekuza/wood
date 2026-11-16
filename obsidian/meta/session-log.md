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
## YYYY-MM-DD HH:MM — one-line summary
- **Changed:** files / areas touched and why
- **Status:** what works now, what is half-done
- **Next:** the first thing to do next session
```

## 2026-11-16 15:40 — Availability filter fix + GSC verification file

- **Changed:** `app/lib/collectionFilters.ts` (`getListAndBooleanFilters` now also drops Shopify's native `filter.v.availability` facet, not just `PRICE_RANGE`), `obsidian/meta/changelog.md`; merged two unrelated commits that landed on `main` meanwhile (nofollow facet links + robots fix, keyword-led category H1s); added `public/google40dbce897c805d36.html` (Google Search Console site verification, static file served at root).
- **Status:** Availability sidebar block confirmed gone on real collection pages (e.g. `/collections/solid-oak-mantel-beams`) via browser check; typecheck clean; merge pushed to `main`. GSC file verified serving at `/google40dbce897c805d36.html` in dev, not yet pushed.
- **Next:** push the GSC verification file; once deployed, complete site verification in Google Search Console (keep the file after verification — don't remove it).

## 2026-11-09 — vault initialised

- **Changed:** project brain scaffolded (vault, shims, hooks).
- **Status:** skeleton only — architecture notes and catalogs still empty.
- **Next:** fill [[status]] and the architecture notes from the real codebase.
