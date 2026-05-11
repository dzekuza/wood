import {useState, useEffect} from 'react';
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
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
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
  const {product} = useLoaderData<typeof loader>();

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
  useEffect(() => {
    if (selectedVariant?.image) setActiveImage(selectedVariant.image);
  }, [selectedVariant?.id]);

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
        <div className="pdp-wrap">
          <div className="pdp-grid">
            {/* Gallery */}
            <div className="pdp-gallery">
              <div className="pdp-thumbs">
                {allImages.map((img) => (
                  <button
                    key={img.id}
                    className={`pdp-thumb${activeImage?.id === img.id ? ' active' : ''}`}
                    onClick={() => setActiveImage(img)}
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
              <div className="ey eyebrow">{vendor || 'Craft Wood Furniture'}</div>
              <h1>{title}</h1>
              {product.description && (
                <p className="sub" style={{marginTop: 14, fontSize: 16, lineHeight: 1.65, color: 'rgba(74,47,31,.7)', maxWidth: 480}}>
                  {product.description}
                </p>
              )}
              <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, fontSize: 13, color: 'rgba(74,47,31,.65)'}}>
                <span style={{color: 'var(--cwf-accent)', fontSize: 14, letterSpacing: 2}}>★★★★★</span>
                <span>4.9 / 5</span>
                <span style={{color: 'rgba(74,47,31,.3)'}}>·</span>
                <a href="#reviews" style={{color: 'var(--cwf-accent-deep)', fontWeight: 600, borderBottom: '1px solid var(--cwf-accent)', paddingBottom: 2}}>128 reviews</a>
              </div>

              <div className="pdp-priceblock">
                <span className="pdp-price-from">From</span>
                <span className="pdp-price-big">
                  <ProductPrice
                    price={selectedVariant?.price}
                    compareAtPrice={selectedVariant?.compareAtPrice}
                  />
                </span>
                <span style={{fontSize: 12, color: 'rgba(74,47,31,.5)', letterSpacing: '.04em', marginLeft: 'auto', alignSelf: 'center'}}>Incl. VAT</span>
              </div>

              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
              />

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
          </div>
        </div>
      </section>

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
