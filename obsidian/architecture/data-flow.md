---
tags: [architecture]
updated: 2026-11-18
---

# Data Flow

How state and data move through the app.

## Server data

Route loaders fetch from the Storefront API with `context.storefront.query`, with queries co-located in the route (shared fragments in `app/lib/fragments.ts`). Hydrogen cache strategies (`CacheShort` etc.) are used in `root.tsx`, `collections.all`, `collections.$handle`, `products.$handle`, `localization` and `lib/pageContent.server.ts`. Buyer country (session) is passed as `@inContext` so prices show the right currency. Admin-only data (page content draft/published) goes through the Admin API server-side only; see [[edit-toolbar]]. Generated types: `storefrontapi.generated.d.ts` (`npm run codegen`).

## Client data

No client data library (no TanStack Query in `package.json`). Mutations post to route actions (`/cart`, `/localization`, `/api/page-content`) and React Router revalidates loaders.

## Client state

- Session cookie (`AppSession`): country, cart id, customer session.
- Browser-local hooks: `useFavourites` (favourites list), `useUnitSystem` (metric/imperial); unit also travels in the URL (`unitFromSearchParams`).
- Variant and filter state live in URL search params (`variants.ts`, `collectionFilters.ts`).
- Edit mode state in `EditToolbarProvider`.

## Forms

React Hook Form and Zod are not used. Forms use React Router `<Form>`/fetchers with action-side validation (`routes/cart.tsx`, `account.*`, `localization.tsx`, `api.page-content.tsx`).

## Loading / error / empty

TODO: unknown. No shared skeleton or error component was catalogued in this run; routes handle their own empty states (e.g. `getEmptyPredictiveSearchResult` in `lib/search.ts`).

## Related

[[system-overview]] · [[api-architecture]] · [[codebase-map]]
