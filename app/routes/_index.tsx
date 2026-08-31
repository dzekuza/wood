import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import type {
  HeroShowcaseQuery,
  PopularProductsQuery,
} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';
import {ProductItem} from '~/components/ProductItem';
import {HeroCarousel} from '~/components/HeroCarousel';
import {CategoriesGrid, type Category} from '~/components/CategoriesGrid';
import {TexturesGrid} from '~/components/TexturesGrid';
import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {CraftmanshipProcess} from '~/components/CraftmanshipProcess';
import {ContactBanner} from '~/components/ContactBanner';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {
  buildHomeContent,
  HOME_CONTENT_QUERY,
  type HomeContent,
} from '~/lib/homeContent';
import {SITE_NAME} from '~/lib/site';
import {filterHiddenProducts} from '~/lib/upsells';
import demoStyles from '~/styles/demo.css?url';

export const meta: Route.MetaFunction = () => {
  return [
    {title: `${SITE_NAME} | Handcrafted solid timber furniture`},
    {
      name: 'description',
      content:
        'Solid timber furniture, made by hand in a small Cotswolds workshop. No flat-pack, no veneers, just patient joinery and pieces built to last.',
    },
  ];
};

export function links() {
  return [
    {rel: 'stylesheet', href: demoStyles},
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap',
    },
  ];
}

function buildCategories(showcase: HeroShowcaseQuery | undefined): Category[] {
  if (!showcase) return [];
  const collections = [
    showcase.mantelBeams,
    showcase.coatRacks,
    showcase.doorStops,
    showcase.surroundMantels,
    showcase.cubeBlocks,
    showcase.shelves,
  ];

  return collections
    .filter((collection): collection is NonNullable<typeof collection> =>
      Boolean(collection),
    )
    .map((collection) => ({
      title: collection.title,
      image:
        collection.image?.url ??
        collection.products.nodes[0]?.featuredImage?.url ??
        null,
      to: `/collections/${collection.handle}`,
      count: collection.products.nodes.length,
    }));
}

export async function loader(args: Route.LoaderArgs) {
  const {context} = args;
  const [heroShowcase, popularProducts, homeContent] = await Promise.all([
    context.storefront.query(HERO_SHOWCASE_QUERY),
    context.storefront.query(POPULAR_PRODUCTS_QUERY),
    context.storefront.query(HOME_CONTENT_QUERY),
  ]);

  const visiblePopularProducts = filterHiddenProducts<
    NonNullable<PopularProductsQuery['collection']>['products']['nodes'][number]
  >(popularProducts.collection?.products.nodes ?? []).slice(0, 8);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    content: buildHomeContent(homeContent),
    categories: buildCategories(heroShowcase),
    popularProducts: visiblePopularProducts,
  };
}

const HERO_RATING = {
  average:
    HOMEPAGE_REVIEWS.reduce((sum, r) => sum + r.rating, 0) /
    HOMEPAGE_REVIEWS.length,
  count: HOMEPAGE_REVIEWS.length,
};

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const {content} = data;

  return (
    <div className="demo-page">
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroCarousel slides={content.heroSlides} rating={HERO_RATING} />
      <CategoriesGrid
        categories={data.categories}
        content={content.categories}
      />
      <PopularProductsSection
        products={data.popularProducts}
        content={content.popular}
      />
      <TestimonialsMarquee
        reviews={HOMEPAGE_REVIEWS}
        heading={content.testimonials.heading}
      />
      <CraftmanshipProcess content={content.process} />
      <TexturesGrid categories={data.categories} content={content.textures} />
      <ContactBanner content={content.contact} />
    </div>
  );
}

function PopularProductsSection({
  products,
  content,
}: {
  products: NonNullable<PopularProductsQuery['collection']>['products']['nodes'];
  content: HomeContent['popular'];
}) {
  if (!products.length) return null;

  return (
    <section className="demo-popular">
      <div className="demo-popular-inner">
        <h2 className="demo-popular-heading">{content.heading}</h2>

        <div className="pgrid">
          {products.map((product, index) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 4 ? 'eager' : undefined}
            />
          ))}
        </div>

        <Link to="/collections/all" className="demo-btn demo-btn-outline-dark">
          {content.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

/* ─── GraphQL ───────────────────────────────────────────────────────────────── */
const HERO_SHOWCASE_COLLECTION_FIELDS = `#graphql
  fragment HeroShowcaseCollection on Collection {
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
        featuredImage {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

const HERO_SHOWCASE_QUERY = `#graphql
  query HeroShowcase($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    doorStops: collection(handle: "solid-oak-door-stops") {
      ...HeroShowcaseCollection
    }
    shelves: collection(handle: "solid-oak-shelves") {
      ...HeroShowcaseCollection
    }
    mantelBeams: collection(handle: "solid-oak-mantel-beams") {
      ...HeroShowcaseCollection
    }
    coatRacks: collection(handle: "solid-oak-coat-racks") {
      ...HeroShowcaseCollection
    }
    surroundMantels: collection(handle: "solid-oak-fireplace-surrounds") {
      ...HeroShowcaseCollection
    }
    cubeBlocks: collection(handle: "solid-oak-cube-blocks") {
      ...HeroShowcaseCollection
    }
  }
  ${HERO_SHOWCASE_COLLECTION_FIELDS}
` as const;

const POPULAR_PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyPopularProduct on MoneyV2 {
    amount
    currencyCode
  }
  fragment PopularProductItem on Product {
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
      minVariantPrice { ...MoneyPopularProduct }
      maxVariantPrice { ...MoneyPopularProduct }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyPopularProduct }
    }
    metafield(namespace: "reviews", key: "product_reviews") {
      value
    }
  }
` as const;

const POPULAR_PRODUCTS_QUERY = `#graphql
  ${POPULAR_PRODUCT_ITEM_FRAGMENT}
  query PopularProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: "most-popular") {
      products(first: 16) {
        nodes {
          ...PopularProductItem
        }
      }
    }
  }
` as const;
