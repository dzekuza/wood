import {useLoaderData} from 'react-router';
import type {Route} from './+types/landing-oak';
import type {HeroShowcaseLandingOakQuery, PopularProductsLandingOakQuery} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HeroCarousel, type HeroSlide} from '~/components/HeroCarousel';
import {ProductCarousel, type ProductCarouselTab} from '~/components/ProductCarousel';
import {FeaturedPicks} from '~/components/FeaturedPicks';
import {OakBenefits} from '~/components/OakBenefits';
import {CraftmanshipProcess} from '~/components/CraftmanshipProcess';
import {ValueMarquee} from '~/components/ValueMarquee';
import {ReviewQuoteGrid} from '~/components/ReviewQuoteGrid';
import {CraftStats} from '~/components/CraftStats';
import {FaqAccordion} from '~/components/FaqAccordion';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {SITE_NAME} from '~/lib/site';
import {EXCLUDE_HIDDEN_PRODUCTS_QUERY, filterHiddenProducts} from '~/lib/upsells';
import demoStyles from '~/styles/demo.css?url';

export const meta: Route.MetaFunction = () => {
  return [
    {title: `${SITE_NAME} | Solid oak, handcrafted for you`},
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
};

function buildHeroSlides(showcase: HeroShowcaseLandingOakQuery | undefined): HeroSlide[] {
  if (!showcase) return [];
  const collections = [
    showcase.mantelBeams,
    showcase.coatRacks,
    showcase.doorStops,
    showcase.shelves,
  ];

  return collections
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
}

function buildPopularTabs(
  showcase: HeroShowcaseLandingOakQuery | undefined,
  bestsellers: PopularProductsLandingOakQuery['products']['nodes'],
): ProductCarouselTab[] {
  const categoryTabs: ProductCarouselTab[] = [
    {key: 'mantel-beams', label: 'Mantel Beams', collection: showcase?.mantelBeams},
    {key: 'coat-racks', label: 'Coat Racks', collection: showcase?.coatRacks},
    {key: 'door-stops', label: 'Door Stops', collection: showcase?.doorStops},
    {key: 'shelves', label: 'Shelves', collection: showcase?.shelves},
  ].map(({key, label, collection}): ProductCarouselTab => ({
    key,
    label,
    products: collection
      ? filterHiddenProducts<PopularProductsLandingOakQuery['products']['nodes'][number]>(
          collection.products.nodes,
        ).slice(0, 8)
      : [],
  }));

  return [{key: 'all', label: 'All', products: bestsellers}, ...categoryTabs];
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
    PopularProductsLandingOakQuery['products']['nodes'][number]
  >(popularProducts.products.nodes);
  const bestsellers = visiblePopularProducts.slice(0, 8);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    heroSlides: buildHeroSlides(heroShowcase),
    popularTabs: buildPopularTabs(heroShowcase, bestsellers),
    featuredProducts: bestsellers.slice(0, 3),
  };
}

export default function LandingOak() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="demo-page">
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroCarousel slides={data.heroSlides} />
      <ProductCarousel heading="Most popular" tabs={data.popularTabs} exploreTo="/collections/all" />
      <FeaturedPicks products={data.featuredProducts} />
      <OakBenefits />
      <CraftmanshipProcess />
      <div className="demo-fullbleed">
        <img src="/demo/hero-1.png" alt="Solid oak furniture styled in a Cotswolds home" loading="lazy" />
      </div>
      <ValueMarquee />
      <ReviewQuoteGrid reviews={HOMEPAGE_REVIEWS} />
      <CraftStats />
      <FaqAccordion />
      <section className="demo-brand-mark">
        <img src="/darkwood.svg" alt="Craft Wood Furniture" loading="lazy" />
      </section>
    </div>
  );
}

/* ─── GraphQL ───────────────────────────────────────────────────────────────── */
const POPULAR_PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyPopularProductLandingOak on MoneyV2 {
    amount
    currencyCode
  }
  fragment PopularProductItemLandingOak on Product {
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
      minVariantPrice { ...MoneyPopularProductLandingOak }
      maxVariantPrice { ...MoneyPopularProductLandingOak }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyPopularProductLandingOak }
    }
    metafield(namespace: "reviews", key: "product_reviews") {
      value
    }
  }
` as const;

const HERO_SHOWCASE_COLLECTION_FIELDS = `#graphql
  fragment HeroShowcaseCollectionLandingOak on Collection {
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    products(first: 8) {
      nodes {
        ...PopularProductItemLandingOak
      }
    }
  }
  ${POPULAR_PRODUCT_ITEM_FRAGMENT}
` as const;

const HERO_SHOWCASE_QUERY = `#graphql
  query HeroShowcaseLandingOak($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    doorStops: collection(handle: "solid-oak-door-stops") {
      ...HeroShowcaseCollectionLandingOak
    }
    shelves: collection(handle: "solid-oak-shelves") {
      ...HeroShowcaseCollectionLandingOak
    }
    mantelBeams: collection(handle: "solid-oak-mantel-beams") {
      ...HeroShowcaseCollectionLandingOak
    }
    coatRacks: collection(handle: "solid-oak-coat-racks") {
      ...HeroShowcaseCollectionLandingOak
    }
  }
  ${HERO_SHOWCASE_COLLECTION_FIELDS}
` as const;

const POPULAR_PRODUCTS_QUERY = `#graphql
  ${POPULAR_PRODUCT_ITEM_FRAGMENT}
  query PopularProductsLandingOak(
    $country: CountryCode
    $language: LanguageCode
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(first: 16, sortKey: BEST_SELLING, query: $query) {
      nodes {
        ...PopularProductItemLandingOak
      }
    }
  }
` as const;
