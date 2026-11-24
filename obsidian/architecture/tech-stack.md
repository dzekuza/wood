---
tags: [architecture]
updated: 2026-11-18
---

# Tech Stack

Every dependency and **why it is here**. Update this note whenever a dependency is
added, removed, or majorly upgraded — and add a [[changelog]] entry. Versions from `package.json` at `0ecfd74`.

## Core

| Package                                                 | Version   | Why                                                                                                  |
| ------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `@shopify/hydrogen`                                     | ^2026.4.3 | storefront framework: Storefront client, cart, session, analytics                                    |
| `react-router` / `react-router-dom`                     | ^7.16.0   | routing and SSR (note: CLAUDE.md says 7.12.0 pinned; package.json range is newer — conflict, verify) |
| `react` / `react-dom`                                   | ^19.1.0   | UI                                                                                                   |
| `vite`, `@react-router/dev`, `@react-router/fs-routes`  | dev       | build, flat file routes                                                                              |
| `@shopify/mini-oxygen`, `@shopify/oxygen-workers-types` | dev       | local Worker runtime and types                                                                       |

## UI

| Package                                              | Version          | Why                                                     |
| ---------------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `tailwindcss`                                        | ^3.4.17          | utilities (secondary; brand CSS is custom in `app.css`) |
| `tailwind-merge`, `clsx`, `class-variance-authority` |                  | `cn()` helper, variants                                 |
| `radix-ui`, `shadcn`, `lucide-react`                 |                  | primitives and icons                                    |
| `@tabler/icons-webfont`                              | ^3.44.0          | icon font                                               |
| `gsap`, `@gsap/react`, `motion`, `tw-animate-css`    |                  | animation                                               |
| `@google/model-viewer`, `three`                      | ^4.3.1, ^0.182.0 | 3D product model (`ProductModel3D`)                     |
| `@fontsource-variable/geist`                         |                  | font                                                    |

## Data & backend

| Package                                             | Version | Why                         |
| --------------------------------------------------- | ------- | --------------------------- |
| `graphql`, `graphql-tag`                            |         | queries                     |
| `@graphql-codegen/cli`, `@shopify/hydrogen-codegen` | dev     | generate `*.generated.d.ts` |
| `isbot`                                             | ^5.1.22 | SSR bot handling            |
| `xlsx`                                              | dev     | catalogue scripts           |

No database or ORM of our own; Shopify is the data store.

## Tooling

| Package                            | Version | Why                                  |
| ---------------------------------- | ------- | ------------------------------------ |
| `typescript`, `eslint`, `prettier` | dev     | typecheck, lint, format              |
| `@shopify/cli`                     | dev     | `shopify hydrogen dev/build/codegen` |

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `codegen`.

## Deliberately NOT used

| Package                              | Why not                                                                      | Use instead           |
| ------------------------------------ | ---------------------------------------------------------------------------- | --------------------- |
| `@remix-run/*`, Next.js              | Hydrogen uses React Router 7                                                 | `react-router`        |
| TanStack Query, React Hook Form, Zod | not in `package.json`; global defaults do not apply to this Hydrogen project | route loaders/actions |
| Supabase                             | not used                                                                     | Shopify APIs          |

## Related

[[system-overview]] · [[changelog]]
