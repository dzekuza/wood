import {useState, useEffect, useMemo, useRef} from 'react';
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {motion} from 'motion/react';
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
import {ProductModel3D} from '~/components/ProductModel3D';
import {ProductForm} from '~/components/ProductForm';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {SITE_NAME} from '~/lib/site';
import {ProductItem} from '~/components/ProductItem';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ReviewsSection, type ProductReview} from '~/components/ReviewsSection';
import {UPSELL_GROUPS, resolveUpsellGroupsForProduct} from '~/lib/upsells';
import {Reveal} from '~/components/animate-ui/Reveal';
import {StaggerGroup, StaggerItem} from '~/components/animate-ui/StaggerGroup';
import {DURATION, EASE_OUT} from '~/lib/motion';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.product.title ?? 'Product'} | ${SITE_NAME}`},
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

  const upsellHandlesQuery = UPSELL_GROUPS.map(
    (group) => `handle:${group.surchargeProductHandle}`,
  ).join(' OR ');

  const [{product}, {products: surchargeProducts}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      cache: storefront.CacheNone(),
    }),
    upsellHandlesQuery
      ? storefront.query(UPSELL_SURCHARGES_QUERY, {
          variables: {query: upsellHandlesQuery},
          cache: storefront.CacheShort(),
        })
      : Promise.resolve({products: {nodes: []}}),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const {productRecommendations} = await storefront.query(PRODUCT_RECOMMENDATIONS_QUERY, {
    variables: {productId: product.id},
    cache: storefront.CacheShort(),
  });

  const surchargeVariantsByHandle = new Map(
    (surchargeProducts?.nodes ?? []).map((p) => [p.handle, p.variants.nodes]),
  );

  const applicableUpsellGroups = resolveUpsellGroupsForProduct(
    product.addonGroupsMetafield?.value,
  );

  const upsellGroupsData = applicableUpsellGroups.map((group) => {
    const variants = surchargeVariantsByHandle.get(group.surchargeProductHandle) ?? [];
    return {
      group,
      options: [
        {
          option: {key: group.defaultOptionKey, label: group.defaultOptionLabel},
          variant: null,
        },
        // Every other paid option comes straight from the surcharge product's
        // live variants — the variant title is both its label and its price
        // lookup key, so adding/renaming/repricing a variant in Shopify admin
        // shows up here with no code change.
        ...variants.map((variant) => ({
          option: {key: variant.id, label: variant.title, variantTitle: variant.title},
          variant,
        })),
      ],
    };
  });

  return {
    product,
    recommendations: productRecommendations?.slice(0, 4) ?? [],
    upsellGroupsData,
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
  const {product, recommendations, upsellGroupsData} = useLoaderData<typeof loader>();

  const productReviews: ProductReview[] = (() => {
    try {
      return JSON.parse(product.metafield?.value ?? '[]') as ProductReview[];
    } catch {
      return [];
    }
  })();

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

  const {title, descriptionHtml} = product;

  const [quantity, setQuantity] = useState(1);

  const [selectedUpsells, setSelectedUpsells] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        upsellGroupsData.map(({group}) => [group.id, group.defaultOptionKey]),
      ),
  );

  function handleUpsellChange(groupId: string, optionKey: string) {
    setSelectedUpsells((prev) => ({...prev, [groupId]: optionKey}));
  }

  const selectedUpsellEntries = upsellGroupsData.map(({group, options}) => {
    const selected =
      options.find((o) => o.option.key === selectedUpsells[group.id]) ??
      options[0];
    return {group, selected};
  });

  const cartLines = selectedVariant
    ? [
        {
          merchandiseId: selectedVariant.id,
          quantity,
          selectedVariant,
          attributes: selectedUpsellEntries.map(({group, selected}) => ({
            key: group.label,
            value: selected.option.label,
          })),
        },
        ...selectedUpsellEntries.flatMap(({group, selected}) =>
          selected.variant
            ? [
                {
                  merchandiseId: selected.variant.id,
                  quantity,
                  selectedVariant: selected.variant,
                  attributes: [
                    {key: 'Upsell group', value: group.label},
                    {key: 'Upsell option', value: selected.option.label},
                    {key: 'Surcharge for', value: title},
                  ],
                },
              ]
            : [],
        ),
      ]
    : [];

  const galleryItems = useMemo(() => {
    const mediaNodes = product.media?.nodes ?? [];
    const mediaImages = mediaNodes
      .filter(
        (m): m is Extract<typeof mediaNodes[number], {__typename: 'MediaImage'}> =>
          m.__typename === 'MediaImage' && !!m.image,
      )
      .map((m) => ({
        __typename: 'Image' as const,
        id: m.id,
        url: m.image!.url,
        altText: m.image!.altText,
        width: m.image!.width,
        height: m.image!.height,
      }));
    const modelMedia = mediaNodes.filter(
      (m): m is Extract<typeof mediaNodes[number], {__typename: 'Model3d'}> =>
        m.__typename === 'Model3d' && !!m.sources?.length,
    );

    const galleryImages = [
      ...(selectedVariant?.image ? [selectedVariant.image] : []),
      ...mediaImages.filter((img) => img.url !== selectedVariant?.image?.url),
    ];

    return [
      ...galleryImages.map((image) => ({
        type: 'image' as const,
        key: image.id ?? image.url,
        image,
      })),
      ...modelMedia.map((m) => ({type: 'model' as const, key: m.id, alt: m.alt, sources: m.sources})),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.media, selectedVariant?.image?.id, selectedVariant?.image?.url]);

  type GalleryItem = (typeof galleryItems)[number];
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(galleryItems[0] ?? null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [viewingCount, setViewingCount] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const {open} = useAside();

  useEffect(() => {
    if (selectedVariant?.image) {
      const image = selectedVariant.image;
      setActiveItem({type: 'image', key: image.id ?? image.url, image});
    }
  }, [selectedVariant?.id, selectedVariant?.image]);

  useEffect(() => {
    setViewingCount(Math.floor(Math.random() * 14) + 8);
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    // Only stick once the CTA has scrolled above the viewport — "not intersecting"
    // is also true before the user has scrolled down to it at all (e.g. a tall
    // options form pushes it below the fold on load), which would show the bar
    // immediately instead of only after the real button scrolls out of view.
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      {threshold: 0},
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function scrollToSlide(i: number) {
    const track = carouselRef.current;
    if (!track) return;
    const start = track.scrollLeft;
    const target = track.clientWidth * i;
    const distance = target - start;
    const duration = 420;
    let startTime: number | null = null;

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      track!.scrollLeft = start + distance * easeInOutCubic(progress);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function handleCarouselScroll() {
    const track = carouselRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setCarouselIndex(index);
  }

  return (
    <div className="archive-page">
      <Breadcrumbs
        items={[
          {label: 'Collections', to: '/collections/all'},
          {label: title},
        ]}
      />

      {/* PDP */}
      <section className="pdp">
        <div className="pdp-wrap">
          <motion.div
            key={product.id}
            className="pdp-grid"
            initial={{opacity: 0, transform: 'translateY(16px)'}}
            animate={{opacity: 1, transform: 'translateY(0px)'}}
            transition={{duration: DURATION, ease: EASE_OUT}}
          >
            {/* Gallery slider */}
            <div className="pdp-carousel">
              <div className="pdp-carousel-stage">
              <div
                className="pdp-carousel-track"
                ref={carouselRef}
                onScroll={handleCarouselScroll}
              >
                {galleryItems.map((item) => (
                  <div key={item.key} className="pdp-carousel-slide">
                    {item.type === 'model' ? (
                      <ProductModel3D sources={item.sources} alt={item.alt ?? title} />
                    ) : (
                      <ProductImage image={item.image} />
                    )}
                    {selectedVariant?.availableForSale === false && (
                      <span className="pdp-ribbon">Sold Out</span>
                    )}
                  </div>
                ))}
              </div>
              {galleryItems.length > 1 && (
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
                      onClick={() => scrollToSlide(Math.min(galleryItems.length - 1, carouselIndex + 1))}
                      aria-label="Next image"
                      disabled={carouselIndex === galleryItems.length - 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </>
              )}
              </div>
              {galleryItems.length > 1 && (
                <div className="pdp-carousel-dots">
                  {galleryItems.map((item, i) => (
                    <button
                      key={item.key}
                      className={`pdp-carousel-dot${carouselIndex === i ? ' active' : ''}`}
                      onClick={() => scrollToSlide(i)}
                      aria-label={item.type === 'model' ? '3D model' : `Image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Gallery — desktop only */}
            <div className="pdp-gallery">
              <div className="pdp-thumbs">
                {galleryItems.map((item) => (
                  <button
                    key={item.key}
                    className={`pdp-thumb${activeItem?.key === item.key ? ' active' : ''}`}
                    onClick={() => setActiveItem(item)}
                  >
                    {item.type === 'model' ? (
                      <>
                        <ProductModel3D
                          sources={item.sources}
                          alt={item.alt ?? title}
                          interactive={false}
                        />
                        <span className="pdp-thumb-3d" aria-hidden="true">
                          <i className="ti ti-cube" />
                        </span>
                      </>
                    ) : (
                      <ProductImage image={item.image} sizes="88px" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pdp-main-img">
                {activeItem?.type === 'model' ? (
                  <ProductModel3D sources={activeItem.sources} alt={activeItem.alt ?? title} />
                ) : (
                  <ProductImage image={activeItem?.image ?? selectedVariant?.image} />
                )}
                {selectedVariant?.availableForSale === false && (
                  <span className="pdp-ribbon">Sold Out</span>
                )}
              </div>
            </div>

            {/* Info */}
            <StaggerGroup className="pdp-info">
              <StaggerItem className="pdp-rating-row">
                <span className="pdp-rating-stars">★★★★★</span>
                <span>4.9 / 5</span>
                <span className="pdp-rating-sep">·</span>
                <a href="#reviews" className="pdp-rating-link">See reviews</a>
                {viewingCount !== null && (
                  <>
                    <span className="pdp-rating-sep">·</span>
                    <span className="pdp-viewing">
                      <span className="pdp-viewing-dot" />
                      {viewingCount} viewing now
                    </span>
                  </>
                )}
              </StaggerItem>
              <StaggerItem>
                <h1>{title}</h1>
              </StaggerItem>
              <StaggerItem className="pdp-highlights">
                <span className="pdp-highlight-item">
                  <i className="ti ti-tree" aria-hidden="true" />
                  Solid hardwood, no MDF
                </span>
                <span className="pdp-highlight-item">
                  <i className="ti ti-certificate" aria-hidden="true" />
                  25-year joinery guarantee
                </span>
                <span className="pdp-highlight-item">
                  <i className="ti ti-package" aria-hidden="true" />
                  White-glove delivery included
                </span>
              </StaggerItem>
              <StaggerItem className="pdp-price-big">
                <ProductPrice
                  price={selectedVariant?.price}
                  compareAtPrice={selectedVariant?.compareAtPrice}
                />
              </StaggerItem>
              {descriptionHtml && (
                <StaggerItem className={`pdp-sub-wrap${descExpanded ? ' pdp-sub-expanded' : ''}`}>
                  <div className="pdp-sub" dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                  <button
                    className="pdp-sub-toggle"
                    onClick={() => setDescExpanded(v => !v)}
                    aria-expanded={descExpanded}
                  >
                    {descExpanded ? 'Show less' : 'Show more'}
                  </button>
                </StaggerItem>
              )}

              <StaggerItem className="pdp-urgency">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Made to order · 3 workshop slots left this month
              </StaggerItem>

              <StaggerItem>
                <div ref={ctaRef}>
                  <ProductForm
                    productOptions={productOptions}
                    selectedVariant={selectedVariant}
                    product={product}
                    lines={cartLines}
                    upsellGroupsData={upsellGroupsData}
                    selectedUpsells={selectedUpsells}
                    onUpsellChange={handleUpsellChange}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                  />
                </div>
              </StaggerItem>

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
                    Wipe with a soft cloth; re-oil every 18 months. 25-year guarantee on joinery and frame. We&rsquo;ll re-cover any piece for cost of materials only, for life.
                  </div>
                </details>
              </div>
            </StaggerGroup>
          </motion.div>

          {/* Main benefits */}
            <div className="pdp-specs">
              <Reveal className="pdp-specs-head">
                <div>
                  <h2 className="pdp-specs-title">The honest specifications.</h2>
                </div>
              </Reveal>
            <StaggerGroup className="pdp-specs-grid">
              <StaggerItem className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M17 8l-5-6-5 6h3l-3 4h4l-3 4h8l-3-4h4l-3-4z"/></svg>
                <div className="pdp-spec-label">Wood</div>
                <div className="pdp-spec-val">Solid Hardwood</div>
                <div className="pdp-spec-sub">No MDF or particleboard</div>
              </StaggerItem>
              <StaggerItem className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                <div className="pdp-spec-label">Guarantee</div>
                <div className="pdp-spec-val">25 Years</div>
                <div className="pdp-spec-sub">Joints and frame</div>
              </StaggerItem>
              <StaggerItem className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div className="pdp-spec-label">Delivery</div>
                <div className="pdp-spec-val">White Glove</div>
                <div className="pdp-spec-sub">Assembled in your room</div>
              </StaggerItem>
              <StaggerItem className="pdp-spec-card">
                <svg className="pdp-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                <div className="pdp-spec-label">Sourcing</div>
                <div className="pdp-spec-val">FSC Certified</div>
                <div className="pdp-spec-sub">Responsibly managed</div>
              </StaggerItem>
            </StaggerGroup>
          </div>

          {/* Maker strip */}
          <Reveal className="maker">
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
          </Reveal>

        </div>
      </section>

      <ReviewsSection reviews={productReviews.length > 0 ? productReviews : undefined} />

      {/* Related */}
      {recommendations.length > 0 && (
        <div className="pdp-related">
          <Reveal className="related-head">
            <div>
              <h2>Recommended for you.</h2>
            </div>
            <Link to="/collections/all">
              Browse all pieces <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </Reveal>
          <StaggerGroup className="pgrid">
            {recommendations.map((rec) => (
              <StaggerItem key={rec.id}>
                <ProductItem product={rec} loading="lazy" />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      )}

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
              className="btn btn-primary btn-pill pdp-atc-btn"
              disabled={!selectedVariant || !selectedVariant.availableForSale}
              onClick={() => open('cart')}
              lines={cartLines}
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
    </div>
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
    media(first: 25) {
      nodes {
        __typename
        ... on MediaImage {
          id
          image {
            url
            altText
            width
            height
          }
        }
        ... on Model3d {
          id
          alt
          sources {
            url
            format
            mimeType
            filesize
          }
        }
      }
    }
    metafield(namespace: "reviews", key: "product_reviews") {
      value
    }
    addonGroupsMetafield: metafield(namespace: "custom", key: "addon_groups") {
      value
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
      featuredImage { id altText url width height }
      images(first: 4) {
        nodes { id url altText width height }
      }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      metafield(namespace: "reviews", key: "product_reviews") { value }
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

const UPSELL_SURCHARGES_QUERY = `#graphql
  query UpsellSurcharges($query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 20, query: $query) {
      nodes {
        handle
        variants(first: 20) {
          nodes {
            ...ProductVariant
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;
