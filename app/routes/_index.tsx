import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import type {HeroShowcaseQuery, PopularProductsQuery} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';
import {ProductItem} from '~/components/ProductItem';
import {HeroCarousel, type HeroSlide} from '~/components/HeroCarousel';
import {CategoriesGrid, type Category} from '~/components/CategoriesGrid';
import {TexturesGrid} from '~/components/TexturesGrid';
import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {CraftmanshipProcess} from '~/components/CraftmanshipProcess';
import {ContactBanner} from '~/components/ContactBanner';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {SITE_NAME} from '~/lib/site';
import {EXCLUDE_HIDDEN_PRODUCTS_QUERY, filterHiddenProducts} from '~/lib/upsells';
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

const HERO_BLURBS: Record<string, string> = {
  'solid-oak-mantel-beams':
    'Precision-cut oak mantel beams, hand-finished to match your fireplace surround.',
  'solid-oak-coat-racks':
    'Solid oak coat racks with cast iron hooks — a lasting first impression for any hallway.',
  'solid-oak-door-stops':
    'Weighty, hand-finished oak door stops with twisted jute rope detailing.',
  'solid-oak-shelves':
    'Floating oak shelves, oiled and ready to install, built to hold real weight.',
  'solid-oak-fireplace-surrounds':
    'Hand-finished oak fireplace surrounds, cut to size for a perfect fit.',
  'solid-oak-cube-blocks':
    'Solid oak cube blocks — rustic side tables and stands, hand-finished.',
};

const BRAND_HERO_SLIDE: HeroSlide = {
  image: '/demo/hero-1.png',
  heading: ['Timeless Oak.', 'Made for Your Home.'],
  blurb:
    'Handcrafted coat racks, fireplace mantels, shelves and solid oak accents—made to bring warmth, function and character to every room.',
  primaryCta: {label: 'Shop All Products', to: '/collections/all'},
  secondaryCta: {label: 'Explore Collections', to: '/collections'},
};

function buildHeroSlides(showcase: HeroShowcaseQuery | undefined): HeroSlide[] {
  if (!showcase) return [BRAND_HERO_SLIDE];
  const collections = [
    showcase.mantelBeams,
    showcase.coatRacks,
    showcase.doorStops,
    showcase.surroundMantels,
    showcase.cubeBlocks,
    showcase.shelves,
  ];

  const collectionSlides = collections
    .filter((collection): collection is NonNullable<typeof collection> => Boolean(collection))
    .map((collection) => {
      const image = collection.image?.url ?? collection.products.nodes[0]?.featuredImage?.url;
      return {
        image: image ?? '/demo/hero-1.png',
        heading: [collection.title],
        blurb:
          HERO_BLURBS[collection.handle] ??
          'Handcrafted solid oak furniture, made to bring warmth and character to every room.',
        primaryCta: {
          label: `Shop ${collection.title}`,
          to: `/collections/${collection.handle}`,
        },
        secondaryCta: {label: 'Explore Collections', to: '/collections'},
      };
    });

  return [BRAND_HERO_SLIDE, ...collectionSlides];
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
    .filter((collection): collection is NonNullable<typeof collection> => Boolean(collection))
    .map((collection) => ({
      title: collection.title,
      image: collection.image?.url ?? collection.products.nodes[0]?.featuredImage?.url ?? null,
      to: `/collections/${collection.handle}`,
      count: collection.products.nodes.length,
    }));
}

export async function loader(args: Route.LoaderArgs) {
  const {context} = args;
  const [heroShowcase, popularProducts] = await Promise.all([
    context.storefront.query(HERO_SHOWCASE_QUERY),
    context.storefront.query(POPULAR_PRODUCTS_QUERY, {
      variables: {query: EXCLUDE_HIDDEN_PRODUCTS_QUERY},
    }),
  ]);

  const visiblePopularProducts = filterHiddenProducts<
    PopularProductsQuery['products']['nodes'][number]
  >(popularProducts.products.nodes).slice(0, 8);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    heroSlides: buildHeroSlides(heroShowcase),
    categories: buildCategories(heroShowcase),
    popularProducts: visiblePopularProducts,
  };
}

const HERO_RATING = {
  average: HOMEPAGE_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / HOMEPAGE_REVIEWS.length,
  count: HOMEPAGE_REVIEWS.length,
};

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="demo-page">
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroCarousel slides={data.heroSlides} rating={HERO_RATING} />
      <CategoriesGrid categories={data.categories} />
      <PopularProductsSection products={data.popularProducts} />
      <TestimonialsMarquee reviews={HOMEPAGE_REVIEWS} />
      <CraftmanshipProcess />
      <TexturesGrid categories={data.categories} />
      <ContactBanner />
    </div>
  );
}

function PopularProductsSection({
  products,
}: {
  products: PopularProductsQuery['products']['nodes'];
}) {
  if (!products.length) return null;

  return (
    <section className="demo-popular">
      <h2 className="demo-popular-heading">Most popular</h2>

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
        Explore Collections
      </Link>
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
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: 16, sortKey: BEST_SELLING, query: $query) {
      nodes {
        ...PopularProductItem
      }
    }
  }
` as const;
