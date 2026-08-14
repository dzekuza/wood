import type {Route} from './+types/collections.all';
import {useLoaderData, Link} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {SITE_NAME} from '~/lib/site';
import type {SortValue} from '~/components/SortDropdown';
import type {CollectionItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () => [
  {title: `All Products | ${SITE_NAME}`},
];

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

const SORT_MAP: Record<SortValue, {sortKey: string; reverse: boolean}> = {
  newest: {sortKey: 'CREATED_AT', reverse: true},
  'price-high': {sortKey: 'PRICE', reverse: true},
  'price-low': {sortKey: 'PRICE', reverse: false},
};

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 48});

  const url = new URL(request.url);
  const sortParam = (url.searchParams.get('sort') ?? 'newest') as SortValue;
  const {sortKey, reverse} = SORT_MAP[sortParam] ?? SORT_MAP.newest;

  const [{products}, {collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {variables: {...paginationVariables, sortKey, reverse}, cache: storefront.CacheNone()}),
    storefront.query(ALL_COLLECTIONS_QUERY, {cache: storefront.CacheNone()}),
  ]);
  return {products, collections: collections.nodes, sortParam};
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
  const {products, collections, sortParam} = useLoaderData<typeof loader>();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="archive-page">
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">Products</h1>
          </div>

          {collections.length > 0 && (
            <div className="category-row">
              {collections.slice(0, 4).map((col) => {
                const image = (col as {image?: {url: string; altText: string | null}}).image;
                return (
                  <Link key={col.handle} to={`/collections/${col.handle}`} className="category-card">
                    {image && (
                      <div className="category-card-img">
                        <img src={image.url} alt={image.altText ?? col.title} loading="lazy" />
                      </div>
                    )}
                    <span className="category-card-name">{col.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="shop-shell">
        <div className="archive-wrap">
          <span className="filter-bar-count filter-bar-count-block">{products.nodes.length} pieces</span>
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
              <button className="btn btn-primary btn-pill" onClick={() => setMobileFiltersOpen(false)}>Show {products.nodes.length} pieces</button>
            </div>
          </aside>
        </div>
      )}
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
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: $sortKey, reverse: $reverse) {
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
