import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {SITE_NAME} from '~/lib/site';

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
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
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

const FILTER_CHIPS = ['All', 'Seating', 'Tables', 'Storage', 'Beds', 'Lighting'];
const WOOD_FILTERS = [['English Oak', 31], ['European Walnut', 18], ['Ash', 14], ['Reclaimed Beam', 12]] as const;
const LEAD_TIME_FILTERS = [['In stock', 12], ['4–6 weeks', 38], ['8–12 weeks', 24], ['Bespoke', 10]] as const;
const FINISH_SWATCHES = [
  {label: 'Oak', className: 'finish-swatch-oak'},
  {label: 'Walnut', className: 'finish-swatch-walnut'},
  {label: 'Dark Walnut', className: 'finish-swatch-dark-walnut'},
  {label: 'Whitewash', className: 'finish-swatch-whitewash'},
  {label: 'Ebonised', className: 'finish-swatch-ebonised'},
];

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <>
      {/* Dark page header */}
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/collections">Collections</Link>
            <span>/</span>
            <span>{collection.title}</span>
          </div>
          <div className="page-header-inner">
            <div>
              <h1>{collection.title}</h1>
              {collection.description && (
                <div className="blurb">{collection.description}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar-row">
          <div className="filter-chips">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                className={`filter-chip${chip === 'All' ? ' active' : ''}`}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="filter-bar-meta">
            <span className="filter-bar-count">
              {collection.products.nodes.length} pieces
            </span>
            <button type="button" className="sort-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cwf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l4-4 4 4"/><path d="M7 5v14"/><path d="M21 15l-4 4-4-4"/><path d="M17 19V5"/></svg> Newest first
            </button>
          </div>
        </div>
      </div>

      {/* Shell: sidebar + grid */}
      <div className="shop-shell">
        <div className="cwf-wrap">
          <div className="shop-inner">
          {/* Sidebar */}
          <aside className="shop-sidebar">
            <div className="fblock">
              <h4>Wood</h4>
              <ul>
                {WOOD_FILTERS.map(([name, ct]) => (
                  <li key={String(name)}>
                    <button type="button" className="filter-check-btn" aria-pressed="false">
                      <span className="check-row">
                        <span className="check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span className="filter-check-label">{name}</span>
                      </span>
                      <span className="ct">{ct}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fblock">
              <h4>Finish</h4>
              <div className="swatch-row">
                {FINISH_SWATCHES.map(({label, className}, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`sw ${className}${index === 0 ? ' on' : ''}`}
                    title={label}
                    aria-pressed={index === 0}
                  />
                ))}
              </div>
            </div>
            <div className="fblock">
              <h4>Price · €</h4>
              <div className="price-range">
                <input type="text" defaultValue="240" readOnly />
                <span>—</span>
                <input type="text" defaultValue="4,800" readOnly />
              </div>
            </div>
            <div className="fblock">
              <h4>Lead time</h4>
              <ul>
                {LEAD_TIME_FILTERS.map(([name, ct]) => (
                  <li key={String(name)}>
                    <button type="button" className="filter-check-btn" aria-pressed="false">
                      <span className="check-row">
                        <span className="check" />
                        <span className="filter-check-label">{name}</span>
                      </span>
                      <span className="ct">{ct}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product grid */}
          <div className="filter-main">
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

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </>
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
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
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
        after: $endCursor
      ) {
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
