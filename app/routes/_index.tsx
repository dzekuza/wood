import {Await, useFetcher, useLoaderData, Link, data} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense, useEffect, useRef, useState} from 'react';
import {motion, type Variants} from 'motion/react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  HeroShowcaseQuery,
  SaleProductsQuery,
  SaleProductFragment,
} from 'storefrontapi.generated';
import {MockShopNotice} from '~/components/MockShopNotice';
import {Lightbox, type LightboxImage} from '~/components/Lightbox';
import {ReviewsSection} from '~/components/ReviewsSection';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {AnimateIcon} from '~/components/animate-ui/icons/icon';
import {AxeIcon} from '~/components/animate-ui/icons/axe';
import {BrushIcon} from '~/components/animate-ui/icons/brush';
import {PaintbrushIcon} from '~/components/animate-ui/icons/paintbrush';
import {FrameIcon} from '~/components/animate-ui/icons/frame';
import {Reveal} from '~/components/animate-ui/Reveal';
import {StaggerGroup, StaggerItem} from '~/components/animate-ui/StaggerGroup';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DURATION, EASE_OUT} from '~/lib/motion';
import {
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeEmailToNewsletter,
} from '~/lib/newsletter.server';
import {SITE_NAME} from '~/lib/site';
import {EXCLUDE_HIDDEN_PRODUCTS_QUERY} from '~/lib/upsells';


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

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const rawEmail = String(formData.get('email') ?? '');
  const email = normalizeNewsletterEmail(rawEmail);
  const env = context.env as unknown as Record<string, string | undefined>;

  if (intent !== 'newsletter-subscribe') {
    return data(
      {
        status: 'error' as const,
        message: 'We could not understand that request.',
      },
      {status: 400},
    );
  }

  if (!isValidNewsletterEmail(email)) {
    return data(
      {
        status: 'error' as const,
        message: 'Enter a valid email address to join the newsletter.',
      },
      {status: 400},
    );
  }

  try {
    const result = await subscribeEmailToNewsletter({
      adminToken: env.SHOPIFY_ADMIN_TOKEN,
      email,
      storeDomain: env.PUBLIC_STORE_DOMAIN,
    });

    return data(result, {
      status: result.status === 'error' ? 500 : 200,
    });
  } catch (error) {
    return data(
      {
        status: 'error' as const,
        message:
          error instanceof Error
            ? error.message
            : 'We could not save your subscription right now. Please try again shortly.',
      },
      {status: 500},
    );
  }
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{blogs}, heroShowcase] = await Promise.all([
    context.storefront.query(FEATURED_ARTICLES_QUERY),
    context.storefront.query(HERO_SHOWCASE_QUERY),
  ]);
  const articles = blogs.nodes[0]?.articles.nodes ?? [];
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredArticles: articles,
    heroShowcase,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const saleProducts = context.storefront
    .query(SALE_PRODUCTS_QUERY, {
      variables: {query: EXCLUDE_HIDDEN_PRODUCTS_QUERY},
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });
  return {saleProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroSection showcase={data.heroShowcase} />
      <SaleShowcaseSection products={data.saleProducts} />
      <WorkshopStepsSection />
      <SaleSpotlightSection products={data.saleProducts} />
      <CraftLightSection />
      <GallerySection />
      <ReviewsSection reviews={HOMEPAGE_REVIEWS} />
      <ArticlesSection articles={data.featuredArticles} />
      <NewsletterSection />
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
type HeroShowcaseCollection = NonNullable<
  HeroShowcaseQuery['doorStops'] | HeroShowcaseQuery['shelves']
>;

function heroShowcaseImage(collection: HeroShowcaseCollection | null | undefined) {
  return collection?.image ?? collection?.products.nodes[0]?.featuredImage ?? null;
}

function HeroSection({showcase}: {showcase: HeroShowcaseQuery | undefined}) {
  const doorStops = showcase?.doorStops;
  const shelves = showcase?.shelves;
  const mantelBeams = showcase?.mantelBeams;
  const coatRacks = showcase?.coatRacks;

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-head">
          <Reveal>
            <h1>
              Built by hand.
              <br />
              Made to <em>last a lifetime.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08} className="hero-cta">
            <Link to="/collections/all" className="btn btn-primary btn-pill">
              Shop the collection
            </Link>
            <Link to="/about" className="btn btn-line btn-pill">
              Our story
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.16} className="hero-showcase">
          <HeroShowcaseCard collection={doorStops} />
          <HeroShowcaseCard collection={shelves} />
          <div className="hero-showcase-wide">
            <HeroShowcaseRow collection={mantelBeams} />
            <HeroShowcaseRow collection={coatRacks} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HeroShowcaseCard({
  collection,
}: {
  collection: HeroShowcaseCollection | null | undefined;
}) {
  if (!collection) return null;
  const image = heroShowcaseImage(collection);

  return (
    <div className="hero-showcase-card">
      {image ? (
        <img src={image.url} alt={image.altText ?? collection.title} />
      ) : (
        <div className="hero-showcase-image-placeholder" />
      )}
      <p>{collection.title}</p>
      <Link to={`/collections/${collection.handle}`} className="btn btn-pill hero-showcase-link">
        Explore now
      </Link>
    </div>
  );
}

function HeroShowcaseRow({
  collection,
}: {
  collection: HeroShowcaseCollection | null | undefined;
}) {
  if (!collection) return null;
  const image = heroShowcaseImage(collection);

  return (
    <div className="hero-showcase-row">
      {image ? (
        <img src={image.url} alt={image.altText ?? collection.title} />
      ) : (
        <div className="hero-showcase-image-placeholder" />
      )}
      <div className="hero-showcase-row-copy">
        <p>{collection.title}</p>
        <Link to={`/collections/${collection.handle}`} className="btn btn-pill hero-showcase-link">
          Explore now
        </Link>
      </div>
    </div>
  );
}

/* ─── Sale showcase (carousel) ───────────────────────────────────────────────── */
function pickSaleProducts(
  products: SaleProductFragment[],
): {items: SaleProductFragment[]; isSale: boolean} {
  const onSale = products.filter((product) => {
    const price = Number(product.priceRange.minVariantPrice.amount);
    const compareAt = Number(
      product.compareAtPriceRange?.minVariantPrice.amount ?? 0,
    );
    return compareAt > price;
  });
  if (onSale.length >= 3) return {items: onSale.slice(0, 8), isSale: true};
  return {items: products.slice(0, 6), isSale: false};
}

function SaleShowcaseSection({
  products,
}: {
  products: Promise<SaleProductsQuery | null>;
}) {
  return (
    <section className="sale-showcase">
      <div className="sale-showcase-inner">
        <Reveal>
          <h2 className="sale-showcase-title">On sale this month.</h2>
        </Reveal>

        <Suspense fallback={null}>
          <Await resolve={products}>
            {(response) => {
              const all = response?.products?.nodes ?? [];
              if (!all.length) return null;
              const {items, isSale} = pickSaleProducts(all);
              if (!items.length) return null;
              return <SaleShowcaseCarousel items={items} isSale={isSale} />;
            }}
          </Await>
        </Suspense>

        <Link to="/collections/all" className="btn btn-line btn-pill cta-center">
          View all products
        </Link>
      </div>
    </section>
  );
}

function SaleShowcaseCarousel({
  items,
  isSale,
}: {
  items: SaleProductFragment[];
  isSale: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const measure = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setPageCount(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  const handleScroll = () => measure();

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({left: dir * el.clientWidth, behavior: 'smooth'});
  };

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div className="sale-carousel">
      <StaggerGroup ref={trackRef} className="sale-carousel-track" onScroll={handleScroll}>
        {items.map((product) => (
          <StaggerItem key={product.id}>
            <SaleProductCard product={product} isSale={isSale} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      {pageCount > 1 && (
        <div className="sale-carousel-nav">
          <button
            type="button"
            className="sale-carousel-arrow reset"
            onClick={() => scrollByPage(-1)}
            disabled={page === 0}
            aria-label="Previous"
          >
            <i className="ti ti-chevron-left" />
          </button>
          <div className="sale-carousel-dots">
            {Array.from({length: pageCount}).map((_, i) => (
              <span key={i} className={`sale-carousel-dot${i === page ? ' active' : ''}`} />
            ))}
          </div>
          <button
            type="button"
            className="sale-carousel-arrow reset"
            onClick={() => scrollByPage(1)}
            disabled={page >= pageCount - 1}
            aria-label="Next"
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}

function SaleProductCard({
  product,
  isSale,
}: {
  product: SaleProductFragment;
  isSale: boolean;
}) {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const showCompareAt =
    isSale && compareAt && Number(compareAt.amount) > Number(price.amount);
  const saveAmount = showCompareAt
    ? (Number(compareAt.amount) - Number(price.amount)).toFixed(2)
    : null;

  const gallery = product.images.nodes.length ? product.images.nodes : product.featuredImage
    ? [product.featuredImage]
    : [];
  const [imageIndex, setImageIndex] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycling = () => {
    if (gallery.length < 2 || hoverTimer.current) return;
    hoverTimer.current = setInterval(() => {
      setImageIndex((i) => (i + 1) % gallery.length);
    }, 700);
  };

  const stopCycling = () => {
    if (hoverTimer.current) {
      clearInterval(hoverTimer.current);
      hoverTimer.current = null;
    }
    setImageIndex(0);
  };

  useEffect(() => () => stopCycling(), []);

  return (
    <Link
      to={`/products/${product.handle}`}
      className="sale-card"
      prefetch="intent"
      onMouseEnter={startCycling}
      onMouseLeave={stopCycling}
    >
      <div className="sale-card-img">
        {gallery.length ? (
          gallery.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt={img.altText ?? product.title}
              loading="lazy"
              className={`sale-card-img-frame${i === imageIndex ? ' active' : ''}`}
            />
          ))
        ) : (
          <div className="sale-card-image-placeholder" />
        )}
        {gallery.length > 1 && (
          <div className="sale-card-dots">
            {gallery.map((img, i) => (
              <span
                key={img.id}
                className={`sale-card-dot${i === imageIndex ? ' active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
      {saveAmount && (
        <span className="sale-card-badge">
          Save <Money data={{amount: saveAmount, currencyCode: price.currencyCode}} />
        </span>
      )}
      <p className="sale-card-title">{product.title}</p>
      <div className="sale-card-price">
        <Money data={price} />
        {showCompareAt && compareAt && (
          <span className="sale-card-compare-at">
            <Money data={compareAt} />
          </span>
        )}
      </div>
    </Link>
  );
}

/* ─── Workshop steps ──────────────────────────────────────────────────────────── */
const WORKSHOP_STEPS = [
  {
    Icon: AxeIcon,
    title: 'Rough-cut',
    desc: 'Every board starts as rough-sawn timber, hand-selected by Will for grain and character.',
  },
  {
    Icon: BrushIcon,
    title: 'Drawn & marked',
    desc: 'Tom draws each joint by hand before a single cut is made — no two pieces are ever identical.',
  },
  {
    Icon: FrameIcon,
    title: 'Jointed by hand',
    desc: "Iris cuts and fits every joint on the bench, the same way it's been done for generations.",
  },
  {
    Icon: PaintbrushIcon,
    title: 'Oiled & finished',
    desc: 'Sam hand-oils each piece, backed by our 25-year repair guarantee.',
  },
];

function WorkshopStepsSection() {
  return (
    <section className="workshop">
      <div className="cwf-wrap">
        <Reveal>
          <h2 className="workshop-title">
            Every piece passes through
            <br />
            four pairs of hands.
          </h2>
        </Reveal>
        <div className="workshop-grid">
          <Reveal delay={0.1} className="workshop-photo">
            <img src="/images/bento-1.jpg" alt="Craftsman shaping timber in the workshop" />
          </Reveal>
          <StaggerGroup className="workshop-cards">
            {WORKSHOP_STEPS.map((step) => (
              <StaggerItem key={step.title}>
                <AnimateIcon animateOnHover asChild>
                  <div className="workshop-card">
                    <step.Icon className="ic" size={64} />
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                </AnimateIcon>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}

/* ─── Sale spotlight ──────────────────────────────────────────────────────────── */
function SaleSpotlightSection({
  products,
}: {
  products: Promise<SaleProductsQuery | null>;
}) {
  return (
    <section className="spotlight">
      <div className="cwf-wrap">
        <Reveal>
          <h2 className="spotlight-title">
            Fresh off the bench.
            <br />
            Ready to bring home.
          </h2>
        </Reveal>
        <div className="spotlight-grid">
          <Reveal delay={0.1} className="spotlight-photo">
            <img src="/images/bento-2.jpg" alt="A finished piece styled in a home" />
          </Reveal>
          <div className="spotlight-panel">
            <Suspense fallback={null}>
              <Await resolve={products}>
                {(response) => {
                  const all = response?.products?.nodes ?? [];
                  if (!all.length) return null;
                  const {items, isSale} = pickSaleProducts(all);
                  if (!items.length) return null;
                  return <SaleSpotlightCarousel items={items} isSale={isSale} />;
                }}
              </Await>
            </Suspense>
          </div>
        </div>
        <Link to="/collections/all" className="btn btn-line btn-pill cta-center">
          View all products
        </Link>
      </div>
    </section>
  );
}

function SaleSpotlightCarousel({
  items,
  isSale,
}: {
  items: SaleProductFragment[];
  isSale: boolean;
}) {
  const [page, setPage] = useState(0);
  const perPage = 2;
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const current = items.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      <StaggerGroup className="spotlight-cards">
        {current.map((product) => (
          <StaggerItem key={product.id}>
            <SaleProductCard product={product} isSale={isSale} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      {pageCount > 1 && (
        <div className="sale-carousel-nav">
          <button
            type="button"
            className="sale-carousel-arrow reset"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous"
          >
            <i className="ti ti-chevron-left" />
          </button>
          <div className="sale-carousel-dots">
            {Array.from({length: pageCount}).map((_, i) => (
              <span key={i} className={`sale-carousel-dot${i === page ? ' active' : ''}`} />
            ))}
          </div>
          <button
            type="button"
            className="sale-carousel-arrow reset"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            aria-label="Next"
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}

/* ─── Craft (light card variant) ─────────────────────────────────────────────── */
const CRAFT_LIGHT_IMAGES: LightboxImage[] = [
  {src: '/images/bento-3.jpg', alt: 'Craftsman at work in the workshop'},
  {src: '/images/bento-4.jpg', alt: 'Craftsman at work in the workshop'},
  {src: '/images/bento-5.jpg', alt: 'Craftsman at work in the workshop'},
];
const CRAFT_LIGHT_STATS = [
  {num: '120+', cap: 'Hours per dining table'},
  {num: '25yr', cap: 'Repair guarantee'},
  {num: '0', cap: 'Veneers · ever'},
  {num: '3', cap: 'Counties of timber sourced'},
];

function CraftLightSection() {
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const craftCopyLocalRef = useRef<HTMLDivElement>(null);
  const craftVisualLocalRef = useRef<HTMLDivElement>(null);
  const {ref: craftCopyRef, isInView: craftCopyInView} = useIsInView<HTMLDivElement>(
    craftCopyLocalRef,
    {inViewOnce: true},
  );
  const {ref: craftVisualRef, isInView: craftVisualInView} = useIsInView<HTMLDivElement>(
    craftVisualLocalRef,
    {inViewOnce: true},
  );

  return (
    <section className="craft-light">
      <div className="cwf-wrap">
        <div className="craft-light-top">
          <motion.div
            ref={craftCopyRef}
            className="craft-light-copy"
            initial={{opacity: 0, transform: 'translateX(-20px)'}}
            animate={craftCopyInView ? {opacity: 1, transform: 'translateX(0px)'} : undefined}
            transition={{duration: DURATION, ease: EASE_OUT}}
          >
            <h2>
              Four pairs of hands.
              <br />
              One bench at a time.
            </h2>
            <p>
              We make slowly, on purpose. A single dining table passes through every joiner in the workshop before it leaves us — rough-cut by Will, drawn by Tom, jointed by Iris, oiled by Sam. No two pieces look alike because no two trees do.
            </p>
            <p>
              If you ever damage a joint, we&rsquo;ll repair it. For twenty-five years. By the same hands that made it.
            </p>
          </motion.div>
          <motion.div
            ref={craftVisualRef}
            className="craft-light-visual"
            initial={{opacity: 0, transform: 'translateX(20px)'}}
            animate={craftVisualInView ? {opacity: 1, transform: 'translateX(0px)'} : undefined}
            transition={{duration: DURATION, ease: EASE_OUT}}
          >
            <img
              src={CRAFT_LIGHT_IMAGES[imageIndex].src}
              alt={CRAFT_LIGHT_IMAGES[imageIndex].alt}
              onClick={() => setLightboxOpen(true)}
            />
            <button
              type="button"
              className="craft-light-arrow prev reset"
              onClick={() =>
                setImageIndex((i) => (i - 1 + CRAFT_LIGHT_IMAGES.length) % CRAFT_LIGHT_IMAGES.length)
              }
              aria-label="Previous image"
            >
              <i className="ti ti-chevron-left" />
            </button>
            <button
              type="button"
              className="craft-light-arrow next reset"
              onClick={() => setImageIndex((i) => (i + 1) % CRAFT_LIGHT_IMAGES.length)}
              aria-label="Next image"
            >
              <i className="ti ti-chevron-right" />
            </button>
          </motion.div>
        </div>

        <StaggerGroup className="craft-light-stats">
          {CRAFT_LIGHT_STATS.map((stat) => (
            <StaggerItem key={stat.cap} className="craft-light-stat">
              <div className="num">{stat.num}</div>
              <div className="cap">{stat.cap}</div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={CRAFT_LIGHT_IMAGES}
          index={imageIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setImageIndex}
        />
      )}
    </section>
  );
}

/* ─── Workshop gallery (bento) ────────────────────────────────────────────────── */
const GALLERY_IMAGES: LightboxImage[] = [
  {src: '/images/hero.jpg', alt: 'Workshop bench with tools laid out'},
  {src: '/images/bento-1.jpg', alt: 'Finished furniture piece styled in a home'},
  {src: '/images/bento-2.jpg', alt: 'Close-up of joinery detail'},
  {src: '/images/bento-3.jpg', alt: 'Craftsman shaping timber'},
  {src: '/images/bento-4.jpg', alt: 'Oiled timber grain detail'},
  {src: '/images/bento-5.jpg', alt: 'Workshop tools on the bench'},
  {src: '/images/craft.jpg', alt: 'Craftsman at work'},
];

function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryItemVariants: Variants = {
    hidden: {opacity: 0, transform: 'scale(0.96)'},
    visible: {
      opacity: 1,
      transform: 'scale(1)',
      transition: {duration: DURATION, ease: EASE_OUT},
    },
  };

  return (
    <section className="gallery">
      <div className="cwf-wrap">
        <StaggerGroup className="gallery-top">
          <StaggerItem className="gallery-large" variants={galleryItemVariants}>
            <img
              src={GALLERY_IMAGES[0].src}
              alt={GALLERY_IMAGES[0].alt}
              onClick={() => setLightboxIndex(0)}
            />
          </StaggerItem>
          <div className="gallery-quad">
            {GALLERY_IMAGES.slice(1, 5).map((img, i) => (
              <StaggerItem key={img.src} className="gallery-quad-item" variants={galleryItemVariants}>
                <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 1)} />
              </StaggerItem>
            ))}
          </div>
        </StaggerGroup>
        <StaggerGroup className="gallery-bottom">
          {GALLERY_IMAGES.slice(5).map((img, i) => (
            <StaggerItem key={img.src} className="gallery-bottom-item" variants={galleryItemVariants}>
              <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 5)} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={GALLERY_IMAGES}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────────────────── */

/* ─── Articles ──────────────────────────────────────────────────────────────── */
type ArticleNode = {
  title: string;
  handle: string;
  excerpt?: string | null;
  publishedAt: string;
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
  blog: {handle: string};
};

function ArticlesSection({articles}: {articles: ArticleNode[]}) {
  if (!articles.length) return null;

  return (
    <section className="section-linen art-section">
      <div className="cwf-wrap">
        <Reveal className="shead">
          <div>
            <div className="eyebrow">From the Journal</div>
            <h2 className="title">Thoughts from the bench</h2>
          </div>
          <Link to="/blogs/journal" className="btn btn-line">
            All articles <i className="ti ti-arrow-right" />
          </Link>
        </Reveal>
        <div className="art-grid">
          {articles.map((a) => (
            <Link
              key={a.handle}
              to={`/blogs/${a.blog.handle}/${a.handle}`}
              prefetch="intent"
              className="art-card"
            >
              {a.image && (
                <div className="art-card-img">
                  <Image
                    data={a.image}
                    aspectRatio="16/9"
                    sizes="(max-width: 767px) 100vw, 400px"
                  />
                </div>
              )}
              <div className="art-card-body">
                <div className="art-card-date">
                  {new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(a.publishedAt))}
                </div>
                <h3 className="art-card-title">{a.title}</h3>
                {a.excerpt && <p className="art-card-excerpt">{a.excerpt}</p>}
                <span className="art-card-cta">Read more <i className="ti ti-arrow-right" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Newsletter ────────────────────────────────────────────────────────────── */
function NewsletterSection() {
  const newsletter = useFetcher<typeof action>();
  const message = newsletter.data;

  return (
    <section className="section-linen-cont">
      <div className="cwf-wrap">
        <div className="news">
          <svg className="bg-mark" width="320" height="320" viewBox="0 0 192 192" aria-hidden>
            <path d="M173.985 182.506L165.126 191.365L111.969 138.209L104.542 145.635L141.413 182.506L132.554 191.365L95.6826 154.494L58.8125 191.365L49.9531 182.506L86.8232 145.635L79.3965 138.208L26.2393 191.365L17.3799 182.506L79.3965 120.489L95.6826 136.775L111.969 120.489L173.985 182.506Z" fill="currentColor"/>
            <path d="M70.876 79.3965L54.5889 95.6826L70.876 111.969L62.0166 120.829L8.85938 173.985L0 165.126L53.1562 111.969L45.7295 104.542L8.85938 141.413L0 132.554L36.8701 95.6826L0 58.8125L8.85938 49.9531L45.7295 86.8232L53.1572 79.3965L0 26.2393L8.85938 17.3799L70.876 79.3965Z" fill="currentColor"/>
            <path d="M191.365 26.2393L138.208 79.3965L145.635 86.8232L182.506 49.9531L191.365 58.8125L154.494 95.6826L191.365 132.554L182.506 141.413L145.635 104.542L138.209 111.969L191.365 165.126L182.506 173.985L120.489 111.97L136.775 95.6826L120.489 79.3965L182.506 17.3799L191.365 26.2393Z" fill="currentColor"/>
            <path d="M173.985 8.85938L120.828 62.0156L111.97 70.876L95.6826 54.5889L79.3965 70.876L17.3799 8.85938L26.2393 0L79.3965 53.1572L86.8232 45.7295L49.9531 8.85938L58.8125 0L95.6826 36.8701L132.554 0L141.413 8.85938L104.542 45.7295L111.969 53.1562L165.126 0L173.985 8.85938Z" fill="currentColor"/>
          </svg>
          <Reveal className="news-content">
            <div className="eyebrow">The Journal</div>
            <h2 className="title">
              A letter from the bench, <em>once a month.</em>
            </h2>
            <p>
              Notes on timber, the slow business of joinery, and quiet word when a new collection is opening for orders. No marketing, ever.
            </p>
          </Reveal>
          <div className="news-form-wrap">
            <newsletter.Form className="news-form" method="post">
              <input type="hidden" name="intent" value="newsletter-subscribe" />
              <input type="email" name="email" placeholder="your@address.com" required />
              <button type="submit" disabled={newsletter.state !== 'idle'}>
                {newsletter.state === 'submitting' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </newsletter.Form>
            {message?.message ? (
              <p className={`news-status news-status-${message.status}`} role="status">
                {message.message}
              </p>
            ) : null}
            <div className="tinyterms">~ 11 letters a year · unsubscribe in one click.</div>
          </div>
        </div>
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
    products(first: 1) {
      nodes {
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
  }
  ${HERO_SHOWCASE_COLLECTION_FIELDS}
` as const;

const FEATURED_ARTICLES_QUERY = `#graphql
  query FeaturedArticles($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blogs(first: 1, sortKey: HANDLE) {
      nodes {
        handle
        articles(first: 3, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            title
            handle
            excerpt
            publishedAt
            image {
              url
              altText
              width
              height
            }
            blog {
              handle
            }
          }
        }
      }
    }
  }
` as const;

const SALE_PRODUCTS_QUERY = `#graphql
  fragment SaleProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
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
    images(first: 4) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query SaleProducts($country: CountryCode, $language: LanguageCode, $query: String)
    @inContext(country: $country, language: $language) {
    products(first: 24, sortKey: UPDATED_AT, reverse: true, query: $query) {
      nodes {
        ...SaleProduct
      }
    }
  }
` as const;
