import type {SearchSuggestionsQuery} from 'storefrontapi.generated';
import {EXCLUDE_HIDDEN_PRODUCTS_QUERY, filterHiddenProducts} from '~/lib/upsells';

export type SearchSuggestionProduct =
  SearchSuggestionsQuery['products']['nodes'][number];

/** Best-selling products shown under "Featured Products" when the header
 *  search is focused but empty — capped after filtering hidden pricing-helper
 *  products so the row still has enough real items. */
export function buildFeaturedSearchProducts(
  data: SearchSuggestionsQuery | null,
): SearchSuggestionProduct[] {
  if (!data) return [];
  return filterHiddenProducts(data.products.nodes).slice(0, 4);
}

export const SEARCH_SUGGESTIONS_QUERY = `#graphql
  fragment SearchSuggestionProduct on Product {
    id
    handle
    title
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query SearchSuggestions(
    $country: CountryCode
    $language: LanguageCode
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING, query: $query) {
      nodes {
        ...SearchSuggestionProduct
      }
    }
  }
` as const;
