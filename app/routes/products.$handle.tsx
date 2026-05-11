import {useState, useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);
import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
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

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      cache: storefront.CacheNone(),
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const {productRecommendations} = await storefront.query(PRODUCT_RECOMMENDATIONS_QUERY, {
    variables: {productId: product.id},
    cache: storefront.CacheShort(),
  });

  return {
    product,
    recommendations: productRecommendations?.slice(0, 4) ?? [],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product, recommendations} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, vendor} = product;

  const productImages = product.images?.nodes ?? [];
  const allImages = [
    ...(selectedVariant?.image ? [selectedVariant.image] : []),
    ...productImages.filter((img) => img.id !== selectedVariant?.image?.id),
  ];
  const [activeImage, setActiveImage] = useState<typeof allImages[0] | null>(allImages[0] ?? null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [viewingCount, setViewingCount] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pdpRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const {open} = useAside();

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({defaults: {ease: 'power2.out'}});
      tl.from('.pdp-gallery, .pdp-carousel', {autoAlpha: 0, x: -20, duration: 0.8})
        .from('.pdp-info > *', {y: 22, autoAlpha: 0, stagger: 0.09, duration: 0.65}, '-=0.5');

      gsap.from('.pdp-assure-item', {y: 16, autoAlpha: 0, stagger: 0.07, duration: 0.5, ease: 'power2.out', scrollTrigger: {trigger: '.pdp-assure', start: 'top 90%'}});
      gsap.from('.pdp-spec-card', {y: 20, autoAlpha: 0, scale: 0.97, stagger: 0.06, duration: 0.5, ease: 'power2.out', scrollTrigger: {trigger: '.pdp-specs', start: 'top 88%'}});
      gsap.from('.rev-card', {y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out', scrollTrigger: {trigger: '.rev-list', start: 'top 88%'}});
    });
  }, {scope: pdpRef});

  useEffect(() => {
    if (selectedVariant?.image) setActiveImage(selectedVariant.image);
  }, [selectedVariant?.id]);

  useEffect(() => {
    setViewingCount(Math.floor(Math.random() * 14) + 8);
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), {threshold: 0});
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function scrollToSlide(i: number) {
    const track = carouselRef.current;
    if (!track) return;
    track.scrollTo({left: track.clientWidth * i, behavior: 'smooth'});
  }

  function handleCarouselScroll() {
    const track = carouselRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setCarouselIndex(index);
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="crumbbar">
        <div className="cwf-wrap">
          <div className="crumb">
            <Link to="/">Home</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <Link to="/collections/all">Collections</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="crumb-here">{title}</span>
          </div>
        </div>
      </div>

      {/* PDP */}
      <section className="pdp">
        <div className="pdp-wrap" ref={pdpRef}>
          <div className="pdp-grid">
            {/* Gallery slider */}
            <div className="pdp-carousel">
              <div
                className="pdp-carousel-track"
                ref={carouselRef}
                onScroll={handleCarouselScroll}
              >
                {allImages.map((img) => (
                  <div key={img.id} className="pdp-carousel-slide">
                    <ProductImage image={img} />
                    {selectedVariant?.availableForSale === false && (
                      <span className="pdp-ribbon">Sold Out</span>
                    )}
                  </div>
                ))}
              </div>
              {allImages.length > 1 && (
                <>
                  <div className="pdp-carousel-arrows">
                    <button
                      className="pdp-carousel-arrow"
                      onClick={() => scrollToSlide(Math.max(0, carouselIndex - 1))}
                      aria-label="Previous image"
                      disabled={carouselIndex === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                      className="pdp-carousel-arrow"
                      onClick={() => scrollToSlide(Math.min(allImages.length - 1, carouselIndex + 1))}
                      aria-label="Next image"
                      disabled={carouselIndex === allImages.length - 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                  <div className="pdp-carousel-dots">
                    {allImages.map((img, i) => (
                      <button
                        key={img.id}
                        className={`pdp-carousel-dot${carouselIndex === i ? ' active' : ''}`}
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gallery — desktop only */}
            <div className="pdp-gallery">
              <div className="pdp-thumbs">
                {allImages.map((img) => (
                  <button
                    key={img.id}
                    className={`pdp-thumb${activeImage?.id === img.id ? ' active' : ''}`}
                    onClick={() => {
                      gsap.fromTo('.pdp-main-img', {autoAlpha: 0.3}, {autoAlpha: 1, duration: 0.3, ease: 'power2.out'});
                      setActiveImage(img);
                    }}
                  >
                    <ProductImage image={img} />
                  </button>
                ))}
              </div>
              <div className="pdp-main-img">
                <ProductImage image={activeImage ?? selectedVariant?.image} />
                {selectedVariant?.availableForSale === false && (
                  <span className="pdp-ribbon">Sold Out</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="pdp-info">
              <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 13, color: 'rgba(74,47,31,.65)', flexWrap: 'wrap'}}>
                <span style={{color: 'var(--cwf-accent)', fontSize: 14, letterSpacing: 2}}>★★★★★</span>
                <span>4.9 / 5</span>
                <span style={{color: 'rgba(74,47,31,.3)'}}>·</span>
                <a href="#reviews" style={{color: 'var(--cwf-accent-deep)', fontWeight: 600, borderBottom: '1px solid var(--cwf-accent)', paddingBottom: 2}}>128 reviews</a>
                {viewingCount !== null && (
                  <>
                    <span style={{color: 'rgba(74,47,31,.3)'}}>·</span>
                    <span className="pdp-viewing">
                      <span className="pdp-viewing-dot" />
                      {viewingCount} viewing now
                    </span>
                  </>
                )}
              </div>
              <h1>{title}</h1>
              <div className="pdp-price-big">
                <ProductPrice
                  price={selectedVariant?.price}
                  compareAtPrice={selectedVariant?.compareAtPrice}
                />
              </div>
              {descriptionHtml && (
                <div className={`pdp-sub-wrap${descExpanded ? ' pdp-sub-expanded' : ''}`}>
                  <div className="pdp-sub" dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                  <button
                    className="pdp-sub-toggle"
                    onClick={() => setDescExpanded(v => !v)}
                    aria-expanded={descExpanded}
                  >
                    {descExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}

              <div className="pdp-urgency">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Made to order · 3 workshop slots left this month
              </div>

              <div ref={ctaRef}>
                <ProductForm
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                  product={product}
                />
              </div>

              <div className="pdp-guarantee">
                <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Secure checkout</span>
                <span className="pdp-guarantee-sep">·</span>
                <span>30-day returns</span>
                <span className="pdp-guarantee-sep">·</span>
                <span>Free white-glove delivery</span>
              </div>

              {/* Assurances */}
              <div className="pdp-assure">
                <div className="pdp-assure-item">
                  <svg className="pdp-assure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <div>
                    <strong className="pdp-assure-strong">4–6 week lead</strong>
                    <small className="pdp-assure-small">Joined to order</small>
                  </div>
                </div>
                <div className="pdp-assure-item">
                  <svg className="pdp-assure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                  <div>
                    <strong className="pdp-assure-strong">25-yr guarantee</strong>
                    <small className="pdp-assure-small">Joints and frame</small>
                  </div>
                </div>
                <div className="pdp-assure-item">
                  <svg className="pdp-assure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <div>
                    <strong className="pdp-assure-strong">White-glove delivery</strong>
                    <small className="pdp-assure-small">Placed, levelled, signed</small>
                  </div>
                </div>
                <div className="pdp-assure-item">
                  <svg className="pdp-assure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                  <div>
                    <strong className="pdp-assure-strong">FSC sourced</strong>
                    <small className="pdp-assure-small">Single-supplier mill</small>
                  </div>
                </div>
              </div>

              {/* Accordion */}
              <div className="pdp-accordion">
                <details className="pdp-acc" open>
                  <summary>
                    Product Details <svg className="pdp-acc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </summary>
                  <div className="pdp-acc-body" dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                </details>
                <details className="pdp-acc">
                  <summary>
                    Delivery &amp; Assembly <svg className="pdp-acc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </summary>
                  <div className="pdp-acc-body">
                    Joined to order in our workshop. Two-person white-glove delivery across the UK and EU; we place, level, and remove packaging. Shipped fully assembled — no flatpacks, no allen keys.
                  </div>
                </details>
                <details className="pdp-acc">
                  <summary>
                    Care &amp; Warranty <svg className="pdp-acc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </summary>
                  <div className="pdp-acc-body">
                    Wipe with a soft cloth; re-oil every 18 months. 25-year guarantee on joinery and frame. We'll re-cover any piece for cost of materials only, for life.
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Maker strip */}
          <div className="maker">
            <div className="ph">
              {selectedVariant?.image && (
                <ProductImage image={selectedVariant.image} />
              )}
            </div>
            <div>
              <div className="ey">The maker</div>
              <h2>
                Crafted with <em>care and precision</em>.
              </h2>
              <p>
                Each piece passes through our workshop from rough boards to final wax. The mortice-and-tenon joints are draw-bored — a peg driven through offset holes that pulls the joint tighter the longer it sits. No screws, no metal in the frame.
              </p>
              <div className="sig">— Craft Wood Furniture</div>
              <div className="by">Oxfordshire workshop</div>
            </div>
          </div>

          {/* Specs */}
          <div className="pdp-specs">
            <div className="pdp-specs-head">
              <div>
                <div className="ey eyebrow">By the numbers</div>
                <h2 style={{marginTop: 10}}>The honest specifications.</h2>
              </div>
            </div>
            <div className="pdp-specs-grid">
              <div className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M17 8l-5-6-5 6h3l-3 4h4l-3 4h8l-3-4h4l-3-4z"/></svg>
                <div className="pdp-spec-label">Wood</div>
                <div className="pdp-spec-val">Solid Hardwood</div>
                <div className="pdp-spec-sub">No MDF or particleboard</div>
              </div>
              <div className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                <div className="pdp-spec-label">Guarantee</div>
                <div className="pdp-spec-val">25 Years</div>
                <div className="pdp-spec-sub">Joints and frame</div>
              </div>
              <div className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div className="pdp-spec-label">Delivery</div>
                <div className="pdp-spec-val">White Glove</div>
                <div className="pdp-spec-sub">Assembled in your room</div>
              </div>
              <div className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                <div className="pdp-spec-label">Sourcing</div>
                <div className="pdp-spec-val">FSC Certified</div>
                <div className="pdp-spec-sub">Responsibly managed</div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="pdp-reviews" id="reviews">
            <div className="rhead">
              <div className="ey">128 owner reviews</div>
              <h2>From the people<br />who sit in it daily.</h2>
            </div>
            <div className="rev-top">
              <div className="rev-score">
                <div className="rev-score-left">
                  <div className="big">4.9</div>
                  <div className="stars">★★★★★</div>
                  <div className="count">Based on 128 verified reviews</div>
                </div>
                <div className="rev-bars">
                  {[['5 stars', 92], ['4 stars', 6], ['3 stars', 1.5], ['2 stars', 0], ['1 star', 0]].map(([lab, pct]) => (
                    <div key={String(lab)} className="rev-bar">
                      <span className="lab">{lab}</span>
                      <span className="track"><span className="fill" style={{width: `${pct}%`}} /></span>
                      <span>{Math.round(Number(pct) * 1.28)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rev-list">
              {[
                {stars: '★★★★★', headline: 'Sits low, sits long.', body: 'We bought a pair for the sitting room. Two winters in and the walnut has darkened to something honestly better than the catalogue photos.', who: 'Eleanor M.', when: 'Verified · Sept 2025'},
                {stars: '★★★★★', headline: 'The joints are obvious.', body: "You can see the draw-bore pegs from underneath. That's a level of 'look at how I'm made' that I really respect in a chair.", who: 'Daniel R.', when: 'Verified · July 2025'},
                {stars: '★★★★★', headline: 'White-glove was worth it.', body: 'Two chaps brought it in, placed it where I asked, took the wrapping back with them. No flat-pack guilt.', who: 'Priya K.', when: 'Verified · May 2025'},
                {stars: '★★★★☆', headline: 'Bouclé sheds for a week.', body: 'Lovely chair, but the natural bouclé does shed for the first week — worth knowing if you have a dark rug. Settled completely after.', who: 'Mark T.', when: 'Verified · March 2025'},
              ].map((r) => (
                <div key={r.who} className="rev-card">
                  <div className="stars">{r.stars}</div>
                  <span className="headline">{r.headline}</span>
                  <div className="body">{r.body}</div>
                  <div className="who">
                    <strong>{r.who}</strong>
                    <span>{r.when}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related */}
          {recommendations.length > 0 && (
            <div className="pdp-related">
              <div className="related-head">
                <div>
                  <div className="ey">Pairs well with</div>
                  <h2>From the same bench.</h2>
                </div>
                <Link to="/collections/all">
                  Browse all pieces <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
              <div className="pgrid">
                {recommendations.map((rec) => (
                  <Link key={rec.id} to={`/products/${rec.handle}`} className="pcard">
                    <div className="pcard-img">
                      {rec.images.nodes[0] && (
                        <img src={rec.images.nodes[0].url} alt={rec.images.nodes[0].altText || rec.title} width={rec.images.nodes[0].width || 400} height={rec.images.nodes[0].height || 400} loading="lazy" />
                      )}
                    </div>
                    <div className="pcard-body">
                      <div className="pname">{rec.title}</div>
                      <div className="pdp-price-big" style={{fontSize: 18, marginTop: 6}}>
                        {rec.priceRange.minVariantPrice.currencyCode === 'EUR' ? '€' : rec.priceRange.minVariantPrice.currencyCode}
                        {parseFloat(rec.priceRange.minVariantPrice.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className={`pdp-sticky-bar${showSticky ? ' visible' : ''}`} aria-hidden={!showSticky}>
        <div className="pdp-sticky-inner">
          <div className="pdp-sticky-info">
            <span className="pdp-sticky-title">{title}</span>
            <span className="pdp-sticky-price">
              <ProductPrice price={selectedVariant?.price} compareAtPrice={selectedVariant?.compareAtPrice} />
            </span>
          </div>
          <div className="pdp-atc-wrap">
            <AddToCartButton
              disabled={!selectedVariant || !selectedVariant.availableForSale}
              onClick={() => open('cart')}
              lines={selectedVariant ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}] : []}
            >
              {selectedVariant?.availableForSale ? 'Order now' : 'Sold out'}
            </AddToCartButton>
          </div>
        </div>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
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
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    images(first: 10) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations($productId: ID!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      images(first: 1) {
        nodes { url altText width height }
      }
    }
  }
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
