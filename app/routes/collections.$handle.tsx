import {redirect, useLoaderData} from 'react-router';
import {useState} from 'react';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {SortDropdown} from '~/components/SortDropdown';
import {CollectionFilters} from '~/components/CollectionFilters';
import {CollectionCategoryNav} from '~/components/CollectionCategoryNav';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {parseFiltersFromSearchParams} from '~/lib/collectionFilters';
import {SITE_NAME, shouldHideCollection} from '~/lib/site';
import type {ProductItemFragment} from 'storefrontapi.generated';
import type {SortValue} from '~/components/SortDropdown';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `${data?.collection.title ?? 'Collection'} | ${SITE_NAME}`}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
// 'featured' passes no explicit sortKey to the Storefront API, which defaults
// to `COLLECTION_DEFAULT` — i.e. whatever sort order (manual, best-selling,
// etc.) the merchant configured for this collection in Shopify Admin.
const SORT_MAP: Record<SortValue, {sortKey: 'COLLECTION_DEFAULT' | 'CREATED' | 'PRICE'; reverse: boolean}> = {
  featured: {sortKey: 'COLLECTION_DEFAULT', reverse: false},
  newest: {sortKey: 'CREATED', reverse: true},
  'price-high': {sortKey: 'PRICE', reverse: true},
  'price-low': {sortKey: 'PRICE', reverse: false},
};

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const url = new URL(request.url);
  const sortParam = (url.searchParams.get('sort') ?? 'featured') as SortValue;
  const {sortKey, reverse} = SORT_MAP[sortParam] ?? SORT_MAP.featured;
  const filters = parseFiltersFromSearchParams(url.searchParams);

  const [{collection}, {collections}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables, sortKey, reverse, filters},
      cache: storefront.CacheNone(),
    }),
    storefront.query(SIDEBAR_CATEGORIES_QUERY, {cache: storefront.CacheShort()}),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

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
    collection,
    sidebarCategories,
    sortParam,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}


export default function Collection() {
  const {collection, sidebarCategories, sortParam} = useLoaderData<typeof loader>();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filters = collection.products.filters ?? [];

  return (
    <div className="archive-page">
      <Breadcrumbs
        items={[
          {label: 'Collections', to: '/collections/all'},
          {label: collection.title},
        ]}
      />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">{collection.title}</h1>
          </div>
          {collection.description && (
            <p className="archive-hero-blurb">{collection.description}</p>
          )}
        </div>
      </div>

      <div className="shop-shell">
        <div className="archive-wrap">
          <div className="shop-layout">
            <aside className="shop-sidebar">
              <CollectionFilters
                filters={filters}
                categoriesSlot={
                  <CollectionCategoryNav
                    categories={sidebarCategories}
                    activeHandle={collection.handle}
                  />
                }
              />
            </aside>

            <div>
              <div className="shop-toolbar">
                <div className="shop-toolbar-left">
                  <span className="filter-bar-count">
                    {collection.products.nodes.length} products
                  </span>
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

              <PaginatedResourceSection<ProductItemFragment>
                connection={collection.products}
                resourcesClassName="pgrid"
              >
                {({node: product, index}) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    loading={index < 8 ? 'eager' : undefined}
                  />
                )}
              </PaginatedResourceSection>
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
                resultCount={collection.products.nodes.length}
                categoriesSlot={
                  <CollectionCategoryNav
                    categories={sidebarCategories}
                    activeHandle={collection.handle}
                  />
                }
              />
            </div>
            <div className="mob-filter-footer">
              <button className="btn btn-primary btn-pill" onClick={() => setMobileFiltersOpen(false)}>
                Show {collection.products.nodes.length} products
              </button>
            </div>
          </aside>
        </div>
      )}

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
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
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
    }
    metafield(namespace: "reviews", key: "product_reviews") {
      value
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse,
        filters: $filters
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

const SIDEBAR_CATEGORIES_QUERY = `#graphql
  query SiblingCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
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
