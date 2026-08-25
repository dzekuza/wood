import type {Filter, ProductFilter} from '@shopify/hydrogen/storefront-api-types';

const FILTER_PARAM = 'filter';
const PRICE_MIN_PARAM = 'price_min';
const PRICE_MAX_PARAM = 'price_max';

/**
 * Builds the `filters` variable for the Storefront API's `products(filters: ...)`
 * argument from the current URL. Each `?filter=` param holds the JSON-encoded
 * `ProductFilter` input taken verbatim from a Shopify-returned `FilterValue.input`
 * (see getFilterValueUrl). Price is handled separately via `price_min`/`price_max`
 * since it's a user-typed range, not a value Shopify enumerates.
 */
export function parseFiltersFromSearchParams(searchParams: URLSearchParams): ProductFilter[] {
  const filters: ProductFilter[] = [];

  for (const raw of searchParams.getAll(FILTER_PARAM)) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        filters.push(parsed as ProductFilter);
      }
    } catch {
      // Ignore malformed filter params rather than 500ing the page.
    }
  }

  const min = searchParams.get(PRICE_MIN_PARAM);
  const max = searchParams.get(PRICE_MAX_PARAM);
  if (min || max) {
    filters.push({
      price: {
        ...(min ? {min: Number(min)} : {}),
        ...(max ? {max: Number(max)} : {}),
      },
    });
  }

  return filters;
}

function isSameFilterInput(a: string, b: string) {
  try {
    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
  } catch {
    return a === b;
  }
}

export function isFilterValueActive(searchParams: URLSearchParams, input: string) {
  return searchParams.getAll(FILTER_PARAM).some((raw) => isSameFilterInput(raw, input));
}

/** Toggle a single filter value on/off, preserving every other applied filter. */
export function getFilterValueUrl(searchParams: URLSearchParams, input: string) {
  const params = new URLSearchParams(searchParams);
  const active = isFilterValueActive(params, input);
  const existing = params.getAll(FILTER_PARAM);
  params.delete(FILTER_PARAM);
  for (const raw of existing) {
    if (!isSameFilterInput(raw, input)) params.append(FILTER_PARAM, raw);
  }
  if (!active) params.append(FILTER_PARAM, input);
  params.delete('cursor');
  return `?${params.toString()}`;
}

export function getPriceRangeUrl(
  searchParams: URLSearchParams,
  range: {min?: string; max?: string},
) {
  const params = new URLSearchParams(searchParams);
  if (range.min) params.set(PRICE_MIN_PARAM, range.min);
  else params.delete(PRICE_MIN_PARAM);
  if (range.max) params.set(PRICE_MAX_PARAM, range.max);
  else params.delete(PRICE_MAX_PARAM);
  params.delete('cursor');
  return `?${params.toString()}`;
}

export function getClearFiltersUrl(searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams);
  params.delete(FILTER_PARAM);
  params.delete(PRICE_MIN_PARAM);
  params.delete(PRICE_MAX_PARAM);
  params.delete('cursor');
  return `?${params.toString()}`;
}

export function hasActiveFilters(searchParams: URLSearchParams) {
  return (
    searchParams.getAll(FILTER_PARAM).length > 0 ||
    Boolean(searchParams.get(PRICE_MIN_PARAM)) ||
    Boolean(searchParams.get(PRICE_MAX_PARAM))
  );
}

export function getCurrentPriceRange(searchParams: URLSearchParams) {
  return {
    min: searchParams.get(PRICE_MIN_PARAM) ?? '',
    max: searchParams.get(PRICE_MAX_PARAM) ?? '',
  };
}

/** Drop the built-in price filter Shopify always returns — we render it as its own block. */
export function getListAndBooleanFilters(filters: Filter[] | undefined) {
  return (filters ?? []).filter((filter) => filter.type !== 'PRICE_RANGE');
}

export function getPriceFilter(filters: Filter[] | undefined) {
  return (filters ?? []).find((filter) => filter.type === 'PRICE_RANGE');
}

/** Shopify's PRICE_RANGE filter carries the catalog's min/max as its single value's `input`. */
export function getPriceBounds(priceFilter: Filter | undefined) {
  const fallback = {min: 0, max: 1000};
  const raw = priceFilter?.values?.[0]?.input;
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(String(raw)) as {price?: {min?: number; max?: number}};
    return {
      min: parsed.price?.min ?? fallback.min,
      max: parsed.price?.max ?? fallback.max,
    };
  } catch {
    return fallback;
  }
}

type LocalFilterableProduct = {
  selectedOrFirstAvailableVariant?: {availableForSale?: boolean} | null;
  priceRange: {minVariantPrice: {amount: string}};
};

/**
 * The Storefront API's top-level `products` field has no `filters` argument
 * (only `Collection.products` does), so the all-products page computes its own
 * Availability/Price facets from the fetched product set and filters locally.
 */
export function buildLocalFilters<T extends LocalFilterableProduct>(products: T[]): Filter[] {
  const inStock = products.filter((p) => p.selectedOrFirstAvailableVariant?.availableForSale).length;
  const outOfStock = products.length - inStock;
  const prices = products.map((p) => Number(p.priceRange.minVariantPrice.amount));
  const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const max = prices.length ? Math.ceil(Math.max(...prices)) : 1000;

  return [
    {
      id: 'availability',
      label: 'Availability',
      type: 'LIST',
      values: [
        {id: 'in-stock', label: 'In stock', count: inStock, input: JSON.stringify({available: true})},
        {id: 'out-of-stock', label: 'Out of stock', count: outOfStock, input: JSON.stringify({available: false})},
      ],
    },
    {
      id: 'price',
      label: 'Price',
      type: 'PRICE_RANGE',
      values: [
        {id: 'price-range', label: 'Price', count: products.length, input: JSON.stringify({price: {min, max}})},
      ],
    },
  ] as Filter[];
}

export function applyLocalFilters<T extends LocalFilterableProduct>(
  products: T[],
  searchParams: URLSearchParams,
): T[] {
  const filters = parseFiltersFromSearchParams(searchParams);
  if (filters.length === 0) return products;

  return products.filter((product) => {
    const price = Number(product.priceRange.minVariantPrice.amount);
    const available = Boolean(product.selectedOrFirstAvailableVariant?.availableForSale);

    return filters.every((filter) => {
      if (filter.available !== undefined) return available === filter.available;
      if (filter.price) {
        const {min: priceMin, max: priceMax} = filter.price;
        if (priceMin != null && price < priceMin) return false;
        if (priceMax != null && price > priceMax) return false;
      }
      return true;
    });
  });
}
