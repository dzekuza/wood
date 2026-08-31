import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {SortDropdown} from '~/components/SortDropdown';
import {CollectionFilters} from '~/components/CollectionFilters';
import {CollectionCategoryNav} from '~/components/CollectionCategoryNav';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {applyLocalFilters, buildLocalFilters} from '~/lib/collectionFilters';
import {SITE_NAME, shouldHideCollection} from '~/lib/site';
import type {SortValue} from '~/components/SortDropdown';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {EXCLUDE_HIDDEN_PRODUCTS_QUERY, filterHiddenProducts} from '~/lib/upsells';

export const meta: Route.MetaFunction = () => [
  {title: `All Products | ${SITE_NAME}`},
];

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

// This page aggregates the whole catalog via the top-level `products` field,
// not a single collection, so there's no merchant-configured manual order to
// fall back on — 'featured' maps to BEST_SELLING as the closest equivalent,
// same as Shopify's own default themes use for a catalog-wide view.
const SORT_MAP: Record<SortValue, {sortKey: 'BEST_SELLING' | 'CREATED_AT' | 'PRICE'; reverse: boolean}> = {
  featured: {sortKey: 'BEST_SELLING', reverse: false},
  newest: {sortKey: 'CREATED_AT', reverse: true},
  'price-high': {sortKey: 'PRICE', reverse: true},
  'price-low': {sortKey: 'PRICE', reverse: false},
};

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  // Fetch the full catalog (not a real page) so Availability/Price facets and
  // local filtering below have the complete product set to work from — the
  // Storefront API's top-level `products` field has no `filters` argument.
  const paginationVariables = getPaginationVariables(request, {pageBy: 250});

  const url = new URL(request.url);
  const sortParam = (url.searchParams.get('sort') ?? 'featured') as SortValue;
  const {sortKey, reverse} = SORT_MAP[sortParam] ?? SORT_MAP.featured;

  const [{products}, {collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {variables: {...paginationVariables, sortKey, reverse, query: EXCLUDE_HIDDEN_PRODUCTS_QUERY}, cache: storefront.CacheNone()}),
    storefront.query(ALL_COLLECTIONS_QUERY, {cache: storefront.CacheShort()}),
  ]);
  // The Storefront API silently ignores the `-handle:` search-query negation
  // above whenever a sortKey is also passed, so filter hidden products here too.
  const allProducts = filterHiddenProducts(products.nodes);
  const filters = buildLocalFilters(allProducts);
  const filteredProducts = applyLocalFilters(allProducts, url.searchParams);

  const sidebarCategories = collections.nodes
    .filter(
      (node) => !shouldHideCollection({handle: node.handle, title: node.title}),
    )
    .slice(0, 8)
    .map((node) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      image: node.image,
      count: node.products.nodes.length,
    }));

  return {
    products: {...products, nodes: filteredProducts},
    filters,
    sidebarCategories,
    sortParam,
  };
}

const FAQ_ITEMS = [
  {
    question: 'What wood do you use?',
    answer: 'Every piece is made from solid oak, hand-selected for grain and durability — no veneers, no MDF.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Most orders ship within 5–10 business days. Larger made-to-order pieces can take up to 4 weeks — exact estimates are shown at checkout.',
  },
  {
    question: 'Do you offer a warranty?',
    answer: 'Yes, every piece comes with a 5-year structural warranty covering joinery and hardware.',
  },
  {
    question: 'Can pieces be customised?',
    answer: 'Many of our pieces support custom dimensions and finish options — look for the "Customisable" tag on the product page.',
  },
  {
    question: 'How do I care for solid wood furniture?',
    answer: 'Dust with a dry cloth and avoid direct sunlight or damp. A light oil treatment once a year keeps the finish looking new.',
  },
];

// ── page ──────────────────────────────────────────────────────────────────────

export default function AllProducts() {
  const {products, filters, sidebarCategories, sortParam} = useLoaderData<typeof loader>();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'All Products'}]} />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">Products</h1>
          </div>
        </div>
      </div>

      <div className="shop-shell">
        <div className="archive-wrap">
          <div className="shop-layout">
            <aside className="shop-sidebar">
              <CollectionFilters
                filters={filters}
                categoriesSlot={<CollectionCategoryNav categories={sidebarCategories} />}
              />
            </aside>

            <div>
              <div className="shop-toolbar">
                <div className="shop-toolbar-left">
                  <span className="filter-bar-count">{products.nodes.length} pieces</span>
                  <button
                    type="button"
                    className="filter-mobile-btn"
                    onClick={() => setMobileFiltersOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                      <line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                      <line x1="4" y1="18" x2="20" y2="18" /><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
                    </svg>
                    Filters
                  </button>
                </div>
                <div className="shop-toolbar-right">
                  <SortDropdown current={sortParam} />
                </div>
              </div>

              <div className="pgrid">
                {(products.nodes as CollectionItemFragment[]).map((product, index) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    loading={index < 12 ? 'eager' : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="mob-filter-overlay" role="presentation">
          <button
            type="button"
            className="mob-filter-backdrop"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <aside
            className="mob-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
          >
            <div className="mob-filter-header">
              <span className="eyebrow" id="mobile-filter-title">Filters</span>
              <button className="mob-filter-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="mob-filter-body">
              <CollectionFilters
                filters={filters}
                resultCount={products.nodes.length}
                categoriesSlot={<CollectionCategoryNav categories={sidebarCategories} />}
              />
            </div>
            <div className="mob-filter-footer">
              <button className="btn btn-primary btn-pill" onClick={() => setMobileFiltersOpen(false)}>
                Show {products.nodes.length} products
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="archive-faq">
        <div className="archive-wrap">
          <h2 className="archive-faq-title">Still have questions?</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <div className="faq-item-body">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    options {
      name
      optionValues {
        name
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true) {
      id
      availableForSale
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 4) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice { ...MoneyCollectionItem }
      maxVariantPrice { ...MoneyCollectionItem }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyCollectionItem }
    }
    metafield(namespace: "reviews", key: "product_reviews") {
      value
    }
  }
` as const;

const ALL_COLLECTIONS_QUERY = `#graphql
  query AllCollectionsAll {
    collections(first: 20, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
        products(first: 250) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${COLLECTION_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes { ...CollectionItem }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
