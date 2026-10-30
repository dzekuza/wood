import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CategoryCard} from '~/components/CategoryCard';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {COLLECTIONS_INDEX_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
import {compareCategories, shouldHideCollection, SITE_NAME} from '~/lib/site';
import {seoMeta} from '~/lib/seo';
import {breadcrumbJsonLd, collectionPageJsonLd} from '~/lib/structuredData';
import demoStyles from '~/styles/demo.css?url';

/** The cards are `.demo-cat-card`, which lives in `demo.css` — the homepage's
 *  stylesheet, route-scoped rather than global, so this route has to ask for it
 *  too or the tiles render unstyled. */
export function links() {
  return [{rel: 'stylesheet', href: demoStyles}];
}

const COLLECTIONS_DESCRIPTION =
  'Browse every Craft Wood Furniture category: solid oak mantel beams, shelves, fireplace surrounds, console tables, coat racks and door stops, all handmade.';

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: `Shop by Category | ${SITE_NAME}`,
    description: COLLECTIONS_DESCRIPTION,
    path: '/collections',
    jsonLd: [
      collectionPageJsonLd({
        name: 'Shop by Category',
        description: COLLECTIONS_DESCRIPTION,
        path: '/collections',
      }),
      breadcrumbJsonLd([{name: 'Categories', path: '/collections'}]),
    ],
  });

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const pageContent = await loadPageContentState(
    args.context,
    args.request,
    COLLECTIONS_INDEX_SLUG,
  );

  return {...deferredData, ...criticalData, pageContent};
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
      // Sorted within the page (12 per page) — the shop has well under a
      // page of categories, so this is the full merchant-set order.
      nodes: collections.nodes
        .filter(
          (collection) =>
            !shouldHideCollection({
              handle: collection.handle,
              title: collection.title,
            }),
        )
        .sort(compareCategories),
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
  const {collections, pageContent} = useLoaderData<typeof loader>();

  return (
    <EditToolbarProvider
      slug={COLLECTIONS_INDEX_SLUG}
      initialState={pageContent}
      label="Categories page copy"
    >
      <div className="archive-page">
        <Breadcrumbs items={[{label: 'Categories'}]} />
        {/* Hero */}
        <div className="archive-hero">
          <div className="archive-wrap">
            <div className="archive-hero-inner">
              <EditableText as="h1" className="archive-hero-title" field="collections.hero.heading">
                Browse Categories
              </EditableText>
            </div>
            <EditableText as="p" className="archive-hero-blurb" field="collections.hero.blurb">
              Every piece of furniture, sorted by room. All solid wood, all made in our workshop.
            </EditableText>
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
            <section className="collections-index-intro">
              <h2>Solid oak furniture, made by hand</h2>
              <p>
                Every piece in the shop is made from solid oak by our workshop team, not
                veneer or board. Start with{' '}
                <Link to="/collections/solid-oak-mantel-beams">oak mantel beams</Link> and{' '}
                <Link to="/collections/solid-oak-fireplace-surrounds">fireplace surrounds</Link>{' '}
                for the chimney breast, add{' '}
                <Link to="/collections/solid-oak-shelves">floating shelves</Link> for the
                walls, or tidy the hallway with a{' '}
                <Link to="/collections/solid-oak-coat-racks">solid oak coat rack</Link> and a{' '}
                <Link to="/collections/console-tables">console table</Link>.
              </p>
              <p>
                Most pieces can be made to your own size and finished in your choice of
                oil colour. Read{' '}
                <Link to="/about">more about the workshop</Link> or{' '}
                <Link to="/contact">get in touch</Link> if you need help choosing.
              </p>
            </section>
          </div>
        </div>
      </div>
      <EditToolbar />
    </EditToolbarProvider>
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
    sortOrder: metafield(namespace: "custom", key: "sort_order") {
      value
    }
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
