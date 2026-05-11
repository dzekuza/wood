import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Craft Wood Furniture | Handcrafted Pieces'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroSection />
      <div className="section">
        <FeaturedCollection collection={data.featuredCollection} />
        <RecommendedProducts products={data.recommendedProducts} />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="hero-section">
      <h1>Crafted with&nbsp;Precision</h1>
      <p>
        Handmade wood furniture built to last generations. Each piece is a
        unique expression of artisan craftsmanship and natural beauty.
      </p>
      <div className="hero-ctas">
        <Link to="/collections/all" className="btn btn-primary">
          Shop All
        </Link>
        <Link to="/pages/about" className="btn btn-secondary">
          Our Story
        </Link>
      </div>
    </section>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <div style={{marginBottom: '3rem'}}>
      <h2 className="section-title">{collection.title}</h2>
      <Link
        className="featured-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <div className="featured-collection-image">
            <Image
              data={image}
              sizes="100vw"
              alt={image.altText || collection.title}
            />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
          }}
        >
          <span className="btn btn-ghost">Browse Collection →</span>
        </div>
      </Link>
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section aria-labelledby="recommended-products-heading">
      <h2 className="section-title" id="recommended-products-heading">
        Featured Pieces
      </h2>
      <Suspense
        fallback={
          <div className="recommended-products-grid">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="product-card"
                style={{height: '300px', opacity: 0.4}}
              />
            ))}
          </div>
        }
      >
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <Link
                      key={product.id}
                      className="product-card"
                      to={`/products/${product.handle}`}
                      prefetch="intent"
                    >
                      {product.featuredImage && (
                        <Image
                          data={product.featuredImage}
                          aspectRatio="4/3"
                          sizes="(min-width: 45em) 25vw, 50vw"
                          alt={
                            product.featuredImage.altText || product.title
                          }
                          style={{borderRadius: 0}}
                        />
                      )}
                      <div className="product-card-body">
                        <p className="product-card-title">{product.title}</p>
                        <Money
                          className="product-card-price"
                          data={product.priceRange.minVariantPrice}
                        />
                      </div>
                    </Link>
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
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
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
