---
tags: [architecture]
updated: 2026-11-18
---

# Folder Structure

Where everything lives and what belongs where. If a file has no obvious home, the
answer belongs in this note before the file is written.

```
wood/
├── server.ts           ← Worker fetch handler
├── app/
│   ├── root.tsx, routes.ts, entry.client.tsx, entry.server.tsx
│   ├── routes/         ← one file per URL (flat routes): loader, action, meta, view
│   ├── components/     ← UI; animate-ui/ holds motion primitives and icons
│   ├── hooks/          ← useFavourites, useUnitSystem, use-is-in-view
│   ├── lib/            ← pure helpers, GraphQL fragments, *.server.ts (Admin API, page content)
│   ├── data/           ← static Etsy review/rating data
│   ├── graphql/        ← Customer Account API queries
│   ├── styles/         ← app.css (brand tokens), demo.css, reset.css
│   └── assets/
├── workers/            ← price-sync Worker (cron) + its wrangler.toml
├── scripts/            ← one-off catalogue/import tooling (.mjs)
├── content/blog/       ← guide drafts as local Markdown (published to Shopify by hand)
├── public/             ← static files incl. Google verification HTML
├── obsidian/           ← this vault
└── wrangler.toml, vercel.json, react-router.config.ts, vite.config.ts
```

Generated files: `storefrontapi.generated.d.ts`, `customer-accountapi.generated.d.ts` (do not edit). Path alias `~` → `app/`. Root also holds loose screenshots (`*.png`) and design folders (`design-talutti-*`, `woodshopify`); TODO: unknown whether still needed.

## Rules

- **kebab-case** is the global rule, but this repo uses PascalCase component files (`ProductForm.tsx`) and Hydrogen route names (`products.$handle.tsx`); follow the existing pattern.
- Each route file owns its queries; shared fragments go in `lib/fragments.ts`.
- `*.server.ts` files must never be imported from components.
- Custom CSS classes in `app/styles/app.css` over utility classes (see CLAUDE.md).

## Related

[[routing]] · [[component-conventions]] · [[codebase-map]]
