import type {Route} from './+types/collections.all';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {SortDropdown} from '~/components/SortDropdown';
import {SITE_NAME} from '~/lib/site';
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

const SORT_MAP: Record<SortValue, {sortKey: 'CREATED_AT' | 'PRICE'; reverse: boolean}> = {
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
    storefront.query(CATALOG_QUERY, {variables: {...paginationVariables, sortKey, reverse, query: EXCLUDE_HIDDEN_PRODUCTS_QUERY}, cache: storefront.CacheNone()}),
    storefront.query(ALL_COLLECTIONS_QUERY, {cache: storefront.CacheShort()}),
  ]);
  // The Storefront API silently ignores the `-handle:` search-query negation
  // above whenever a sortKey is also passed, so filter hidden products here too.
  return {
    products: {...products, nodes: filterHiddenProducts(products.nodes)},
    collections: collections.nodes,
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
  const {products, collections, sortParam} = useLoaderData<typeof loader>();

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
                const count = (col as {products?: {nodes: {id: string}[]}}).products?.nodes.length ?? 0;
                return (
                  <Link key={col.handle} to={`/collections/${col.handle}`} className="category-card">
                    {image && (
                      <span className="category-card-img">
                        <img src={image.url} alt={image.altText ?? col.title} loading="lazy" />
                      </span>
                    )}
                    <span className="category-card-text">
                      <span className="category-card-name">{col.title}</span>
                      <span className="category-card-count">
                        {count} {count === 1 ? 'product' : 'products'}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="shop-shell">
        <div className="archive-wrap">
          <div className="shop-toolbar">
            <span className="filter-bar-count">{products.nodes.length} pieces</span>
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
