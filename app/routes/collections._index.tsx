import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CategoryCard} from '~/components/CategoryCard';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {shouldHideCollection} from '~/lib/site';
import demoStyles from '~/styles/demo.css?url';

/** The cards are `.demo-cat-card`, which lives in `demo.css` — the homepage's
 *  stylesheet, route-scoped rather than global, so this route has to ask for it
 *  too or the tiles render unstyled. */
export function links() {
  return [{rel: 'stylesheet', href: demoStyles}];
}

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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  // A multiple of the 4-column grid, so a page never ends on a ragged row.
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    collections: {
      ...collections,
      nodes: collections.nodes.filter(
        (collection) =>
          !shouldHideCollection({
            handle: collection.handle,
            title: collection.title,
          }),
      ),
    },
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

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'Categories'}]} />
      {/* Hero */}
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">
              Browse <em>Categories</em>
            </h1>
          </div>
          <p className="archive-hero-blurb">
            Every piece of furniture, sorted by room. All solid wood, all made in our workshop.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="collections-index-shell">
        <div className="archive-wrap">
          <PaginatedResourceSection<CollectionFragment>
            connection={collections}
            resourcesClassName="category-grid-4"
          >
            {({node: collection}) => (
              <CategoryCard
                key={collection.id}
                category={toCategory(collection)}
              />
            )}
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

/**
 * Same shape the homepage builds in `_index.tsx`'s `buildCategories()`: the
 * collection's own image, falling back to its first product's featured image so
 * a collection with no artwork set in Admin still shows a tile rather than an
 * empty square.
 */
function toCategory(collection: CollectionFragment) {
  return {
    title: collection.title,
    image:
      collection.image?.url ??
      collection.products.nodes[0]?.featuredImage?.url ??
      null,
    to: `/collections/${collection.handle}`,
    count: collection.products.nodes.length,
  };
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 250) {
      nodes {
        id
        featuredImage {
          url
          altText
          width
          height
        }
      }
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
