import type {Route} from './+types/collections.all';
import {useLoaderData, Link, NavLink} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {SITE_NAME} from '~/lib/site';

export const meta: Route.MetaFunction = () => [
  {title: `All Products | ${SITE_NAME}`},
];

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 48});
  const [{products}, {collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {variables: {...paginationVariables}, cache: storefront.CacheNone()}),
    storefront.query(ALL_COLLECTIONS_QUERY, {cache: storefront.CacheNone()}),
  ]);
  return {products, collections: collections.nodes};
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function AllProducts() {
  const {products, collections} = useLoaderData<typeof loader>();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <>
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/collections">Collections</Link>
            <span>/</span>
            <span>All Products</span>
          </div>
          <div className="page-header-inner">
            <div>
              <h1>Every piece, every <em>room</em>.</h1>
              <p className="blurb">
                Solid-timber furniture made to outlast the trends. Browse the full range or filter by what you need.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar-row">
          <div className="filter-chips">
            <NavLink to="/collections/all" className="filter-chip active" end>
              All
            </NavLink>
            {collections.map((col) => (
              <NavLink
                key={col.handle}
                to={`/collections/${col.handle}`}
                className="filter-chip"
              >
                {col.title}
              </NavLink>
            ))}
          </div>
          <div className="filter-bar-meta">
            <button className="filter-mobile-btn" onClick={() => setMobileFiltersOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
              Filters
            </button>
            <button className="sort-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cwf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l4-4 4 4" /><path d="M7 5v14" />
                <path d="M21 15l-4 4-4-4" /><path d="M17 19V5" />
              </svg>
              Newest first
            </button>
          </div>
        </div>
      </div>

      {/* Shell: sidebar + grid */}
      <div className="shop-shell">
        <div className="cwf-wrap">
          <div className="shop-inner">
            <aside className="shop-sidebar">
              <div className="fblock">
                <h4>Price · £</h4>
                <div className="price-range">
                  <input type="text" defaultValue="240" readOnly />
                  <span>—</span>
                  <input type="text" defaultValue="4,800" readOnly />
                </div>
              </div>
            </aside>

            {/* Product grid */}
            <div className="filter-main">
              <span className="filter-bar-count filter-bar-count-block">{products.nodes.length} pieces</span>
              <div className="pgrid">
                {products.nodes.map((product, index) => (
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

      {/* Mobile filter drawer */}
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
              <div className="fblock">
                <h4>Price · £</h4>
                <div className="price-range">
                  <input type="text" defaultValue="240" readOnly />
                  <span>—</span>
                  <input type="text" defaultValue="4,800" readOnly />
                </div>
              </div>
            </div>
            <div className="mob-filter-footer">
              <button className="btn btn-primary" onClick={() => setMobileFiltersOpen(false)}>Show {products.nodes.length} pieces</button>
            </div>
          </aside>
        </div>
      )}
    </>
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
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice { ...MoneyCollectionItem }
      maxVariantPrice { ...MoneyCollectionItem }
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
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
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
