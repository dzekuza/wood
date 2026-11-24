import type {Storefront} from '@shopify/hydrogen';

/**
 * Cache strategy for Storefront queries whose data changes by editorial
 * action (home copy, blog articles, the category list) rather than per
 * request: fresh for a minute, then served stale for up to an hour while a
 * background request refreshes it.
 *
 * Hydrogen's default `CacheShort` (1s fresh, 9s stale) rarely hits on a
 * low-traffic store, so most requests paid the full Storefront API round trip
 * in the loader. This keeps the first byte off that round trip; an edit shows
 * up on the first load after it is revalidated (so, at worst, the second
 * reload) rather than after ~10s.
 *
 * Not for prices, stock or anything per-shopper — product and collection
 * listings use `CacheShort` instead.
 */
export function editorialCache(storefront: Storefront) {
  return storefront.CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 3600,
  });
}

/**
 * Cache strategy for catalog queries (product detail, variant matrix,
 * collection listings). Keeps prices and availability fresh within 30 seconds
 * while serving stale-while-revalidate for 30 minutes so crawlers and shoppers
 * avoid paying ~900ms sequential Storefront API round trips on cold cache hits.
 */
export function catalogCache(storefront: Storefront) {
  return storefront.CacheCustom({
    mode: 'public',
    maxAge: 30,
    staleWhileRevalidate: 1800,
  });
}
