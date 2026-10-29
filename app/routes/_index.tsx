import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import type {
  HeroShowcaseQuery,
  PopularProductsQuery,
} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {ProductItem} from '~/components/ProductItem';
import {HeroCarousel} from '~/components/HeroCarousel';
import {CategoriesGrid, type Category} from '~/components/CategoriesGrid';
import {TexturesGrid} from '~/components/TexturesGrid';
import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {CraftmanshipProcess} from '~/components/CraftmanshipProcess';
import {ContactBanner} from '~/components/ContactBanner';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {ETSY_SHOP_RATING} from '~/data/etsy-ratings';
import {
  buildHomeContent,
  HOME_CONTENT_DEFAULTS,
  HOME_CONTENT_QUERY,
  type HomeContent,
} from '~/lib/homeContent';
import {
  compareCategories,
  shouldHideCollection,
  SITE_NAME,
} from '~/lib/site';
import {seoMeta} from '~/lib/seo';
import {organizationJsonLd, websiteJsonLd} from '~/lib/structuredData';
import {filterHiddenProducts} from '~/lib/upsells';
import {LANDING_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
import demoStyles from '~/styles/demo.css?url';

export const meta: Route.MetaFunction = ({data}) => {
  const seo = data?.content.seo ?? HOME_CONTENT_DEFAULTS.seo;
  return seoMeta({
    title: `${seo.title} | ${SITE_NAME}`,
    description: seo.description,
    path: '/',
    jsonLd: [organizationJsonLd(), websiteJsonLd()],
  });
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
  const collections = showcase?.collections.nodes ?? [];

  return collections
    .filter(
      (collection) =>
        !shouldHideCollection({
          handle: collection.handle,
          title: collection.title,
        }),
    )
    .sort(compareCategories)
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
  const {context, request} = args;
  const [
    heroShowcase,
    popularProducts,
    homeContent,
    pageContent,
  ] = await Promise.all([
    context.storefront.query(HERO_SHOWCASE_QUERY),
    context.storefront.query(POPULAR_PRODUCTS_QUERY),
    context.storefront.query(HOME_CONTENT_QUERY),
    // Inline copy overrides, read here rather than client-side so the copy a
    // shopper sees is server-rendered and the toolbar does not flash in.
    loadPageContentState(context, request, LANDING_SLUG),
  ]);

  const visiblePopularProducts = filterHiddenProducts<
    NonNullable<PopularProductsQuery['collection']>['products']['nodes'][number]
  >(popularProducts.collection?.products.nodes ?? []).slice(0, 8);

  // Headline rating: every review in the Etsy export (shop-wide).
  const reviewStats = ETSY_SHOP_RATING;

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    content: buildHomeContent(homeContent),
    categories: buildCategories(heroShowcase),
    popularProducts: visiblePopularProducts,
    reviewStats,
    pageContent,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const {content} = data;

  return (
    <EditToolbarProvider
      slug={LANDING_SLUG}
      initialState={data.pageContent}
      label="Homepage copy"
    >
      <div className="demo-page">
        {data.isShopLinked ? null : <MockShopNotice />}
        <HeroCarousel slides={content.heroSlides} rating={data.reviewStats} />
        <CategoriesGrid
          categories={data.categories}
          content={content.categories}
        />
        <PopularProductsSection
          products={data.popularProducts}
          content={content.popular}
        />
        {/* Cards stay curated (they are the ones with customer photos); the
          headline numbers come from every product's review metafield. */}
        <TestimonialsMarquee
          reviews={HOMEPAGE_REVIEWS}
          rating={data.reviewStats}
          heading={content.testimonials.heading}
        />
        <CraftmanshipProcess content={content.process} />
        <TexturesGrid categories={data.categories} content={content.textures} />
        <ContactBanner content={content.contact} />
      </div>
      <EditToolbar />
    </EditToolbarProvider>
  );
}

const MANTEL_NOTE_PREFIX = 'Fitting a fireplace? Start with our';
const MANTEL_NOTE_LINK = 'solid oak mantel beam';
const MANTEL_NOTE_SUFFIX = ', made to size in 30 sizes.';

function PopularProductsSection({
  products,
  content,
}: {
  products: NonNullable<
    PopularProductsQuery['collection']
  >['products']['nodes'];
  content: HomeContent['popular'];
}) {
  if (!products.length) return null;

  return (
    <section className="demo-popular">
      <div className="demo-popular-inner">
        <EditableText
          as="h2"
          className="demo-popular-heading"
          field="popular.heading"
        >
          {content.heading}
        </EditableText>

        <div className="pgrid">
          {products.map((product, index) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 4 ? 'eager' : undefined}
            />
          ))}
        </div>

        <p className="demo-popular-note">
          {MANTEL_NOTE_PREFIX}{' '}
          <Link to="/products/solid-oak-mantel-beam" prefetch="intent">
            {MANTEL_NOTE_LINK}
          </Link>
          {MANTEL_NOTE_SUFFIX}
        </p>

        <Link to="/collections/all" className="demo-btn demo-btn-outline-dark">
          <EditableText field="popular.ctaLabel">
            {content.ctaLabel}
          </EditableText>
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
    sortOrder: metafield(namespace: "custom", key: "sort_order") {
      value
    }
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
    collections(first: 20) {
      nodes {
        ...HeroShowcaseCollection
      }
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
    tags
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
