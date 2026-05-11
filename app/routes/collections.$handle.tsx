import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
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
              <div className="eyebrow">
                {collection.handle} · {collection.products.nodes.length} pieces
              </div>
              <h1>
                Pieces for the rooms<br />you actually <em>live in</em>.
              </h1>
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
          <div style={{display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: 'var(--cwf-accent-deep)'}}>
            <span style={{color: 'rgba(74,47,31,.6)'}}>
              {collection.products.nodes.length} pieces
            </span>
            <button style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '.5px solid var(--cwf-line)', borderRadius: 99, background: '#fff', cursor: 'pointer', fontWeight: 600, color: 'var(--cwf-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13}}>
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
                {[['English Oak', 31], ['European Walnut', 18], ['Ash', 14], ['Reclaimed Beam', 12]].map(([name, ct]) => (
                  <li key={String(name)}>
                    <label>
                      <span style={{display: 'flex', alignItems: 'center'}}>
                        <span className="check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                        {name}
                      </span>
                      <span className="ct">{ct}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fblock">
              <h4>Finish</h4>
              <div className="swatch-row">
                <span className="sw on" style={{background: '#c9a27a'}} title="Oak" />
                <span className="sw" style={{background: '#7a5a3a'}} title="Walnut" />
                <span className="sw" style={{background: '#4a2f1f'}} title="Dark Walnut" />
                <span className="sw" style={{background: '#e8dfd1'}} title="Whitewash" />
                <span className="sw" style={{background: '#2a2a2a'}} title="Ebonised" />
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
                {[['In stock', 12], ['4–6 weeks', 38], ['8–12 weeks', 24], ['Bespoke', 10]].map(([name, ct]) => (
                  <li key={String(name)}>
                    <label>
                      <span style={{display: 'flex', alignItems: 'center'}}>
                        <span className="check" />
                        {name}
                      </span>
                      <span className="ct">{ct}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product grid */}
          <div style={{minWidth: 0}}>
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
