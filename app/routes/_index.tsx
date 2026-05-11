import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedProductsQuery,
  FeaturedProductFragment,
  FeaturedCollectionsQuery,
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
    context.storefront.query(FEATURED_COLLECTIONS_QUERY),
  ]);
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollections: collections.nodes,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const featuredProducts = context.storefront
    .query(FEATURED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });
  return {featuredProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      {data.isShopLinked ? null : <MockShopNotice />}
      <HeroSection />
      <MarqueeStrip />
      <CollectionsSection collections={data.featuredCollections} />
      <ProductsSection products={data.featuredProducts} />
      <CraftSection />
      <ProcessSection />
      <FeaturesBar />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-grid">
        {/* Left copy */}
        <div className="hero-copy">
          <div className="top">
            <div className="hero-tag">
              <span className="bar" />
              Autumn collection · '26
            </div>
            <h1>
              Built by hand.<br />Made to <em>last a lifetime.</em>
            </h1>
            <p className="lede">
              Solid timber furniture, joined and finished by a small workshop in the Cotswolds. No flat-pack, no veneers — just timber, traditional joinery, and patience pressed into every piece.
            </p>
            <div className="hero-cta">
              <Link to="/collections/all" className="btn btn-primary">
                Shop the collection <i className="ti ti-arrow-right" />
              </Link>
              <Link to="/pages/about" className="btn btn-ghost">
                <i className="ti ti-player-play" /> Our story
              </Link>
            </div>
          </div>
          <div className="hero-meta">
            <div className="stat">
              <span className="num">28<sup style={{fontSize: '.5em'}}>yrs</sup></span>
              <span className="cap">Bench experience</span>
            </div>
            <div className="stat">
              <span className="num">04</span>
              <span className="cap">Master joiners</span>
            </div>
            <div className="stat">
              <span className="num">100<small style={{fontSize: '.5em'}}>%</small></span>
              <span className="cap">Solid timber</span>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="hero-visual">
          <div className="hero-image">
            <div className="placeholder">
              <img src="/images/hero.jpg" alt="Handcrafted oak furniture" />
            </div>
            <div className="hero-floater">
              <div>
                <div style={{fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--cwf-accent-deep)'}}>Featured</div>
                <div style={{fontWeight: 600, marginTop: 2}}>The Aldsworth Table</div>
              </div>
              <span className="price">€2,840</span>
            </div>
            <div className="hero-badge">
              <span className="icon"><i className="ti ti-certificate" /></span>
              <div>
                <div className="t1">25-year guarantee</div>
                <div className="t2">On every piece we make</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee strip ─────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  {icon: 'ti-tree', text: 'European white oak'},
  {icon: 'ti-hammer', text: 'Mortise & tenon joinery'},
  {icon: 'ti-flame', text: 'Hand-rubbed oils'},
  {icon: 'ti-leaf', text: 'FSC-certified timber'},
  {icon: 'ti-shield-check', text: '25-year guarantee'},
  {icon: 'ti-truck', text: 'White-glove delivery'},
];

function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="marquee-strip">
      <div className="marquee-row">
        {items.map((item, i) => (
          <span key={i}>
            <i className={`ti ${item.icon}`} />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Collections (bento) ────────────────────────────────────────────────────── */
const BENTO_CELLS = [
  {cls: 'cell-1 dark', label: 'Featured', title: 'Living\nRoom', count: '22 pieces', img: '/images/bento-1.jpg'},
  {cls: 'cell-2 dark', label: null, title: 'Mantels', count: '14 pieces', img: '/images/bento-2.jpg'},
  {cls: 'cell-3 primary', label: null, title: 'Media', count: '9 pieces', img: '/images/bento-3.jpg'},
  {cls: 'cell-4 light', label: null, title: 'Shelving', count: '18 pieces', img: '/images/bento-4.jpg'},
  {cls: 'cell-5 dark', label: null, title: 'Seating', count: '7 pieces', img: '/images/bento-1.jpg'},
];

function CollectionsSection({
  collections,
}: {
  collections: FeaturedCollectionsQuery['collections']['nodes'];
}) {
  return (
    <section style={{padding: '96px 0', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <div className="eyebrow">01 · Collections</div>
            <h2 className="title" style={{marginTop: 14}}>
              Six rooms.<br />Each one furnished in solid timber.
            </h2>
          </div>
          <div className="right">
            <Link to="/collections">Browse all rooms <i className="ti ti-arrow-right" /></Link>
          </div>
        </div>

        <div className="bento">
          {BENTO_CELLS.map((cell, i) => {
            const col = collections[i];
            return (
              <Link
                key={i}
                to={col ? `/collections/${col.handle}` : '/collections'}
                className={`cell ${cell.cls}`}
              >
                <div className="ph">
                  <img
                    src={col?.image?.url ?? cell.img}
                    alt={col?.image?.altText ?? cell.title}
                  />
                </div>
                <div className="cell-inner">
                  <div className="meta">
                    <span className="count">{col ? `${col.handle}` : cell.count}</span>
                    <i className="ti ti-arrow-up-right" style={{fontSize: 18}} />
                  </div>
                  <div>
                    {cell.label && (
                      <div className="label" style={{color: 'var(--cwf-accent)', fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase'}}>
                        {cell.label}
                      </div>
                    )}
                    <h3 style={{marginTop: cell.label ? 8 : 0}}>
                      {col ? col.title : cell.title}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Products ─────────────────────────────────────────────────────── */
function ProductsSection({
  products,
}: {
  products: Promise<FeaturedProductsQuery | null>;
}) {
  return (
    <section style={{paddingTop: 0, paddingBottom: '96px', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <div className="eyebrow">02 · This season</div>
            <h2 className="title" style={{marginTop: 14}}>
              Pieces from the bench, this month.
            </h2>
          </div>
          <div className="right">
            <Link to="/collections/all">Shop all new <i className="ti ti-arrow-right" /></Link>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="products-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="pcard" style={{aspectRatio: '1/1.3'}} />
              ))}
            </div>
          }
        >
          <Await resolve={products}>
            {(response) => {
              const items: FeaturedProductFragment[] = response?.products?.nodes ?? [];
              if (!items.length) return null;
              return (
                <div className="products-grid">
                  {items.map((product) => (
                    <Link
                      key={product.id}
                      className="pcard"
                      to={`/products/${product.handle}`}
                      prefetch="intent"
                    >
                      <div className="pcard-img">
                        {product.featuredImage && (
                          <Image
                            data={product.featuredImage}
                            sizes="(min-width: 45em) 25vw, 50vw"
                            alt={product.featuredImage.altText || product.title}
                          />
                        )}
                        <button
                          className="pcard-heart"
                          aria-label="Save"
                          onClick={(e) => e.preventDefault()}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                      </div>
                      <div className="pcard-body">
                        <div className="pcard-name">{product.title}</div>
                        <div className="pcard-row">
                          <span className="pcard-price">
                            <span className="pcard-from">From </span>
                            <Money data={product.priceRange.minVariantPrice} />
                          </span>
                          <span className="pcard-add" aria-label="Quick add">+</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}

/* ─── Craft section ─────────────────────────────────────────────────────────── */
function CraftSection() {
  return (
    <section className="craft" style={{padding: '96px 0'}}>
      <div className="cwf-wrap">
        <div className="craft-visual">
          <img src="/images/craft.jpg" alt="Craftsman at work" />
          <div className="craft-card">
            <span className="av" />
            <div>
              <div className="nm">Tom Whitfield</div>
              <div className="rl">Founder · master joiner, 28 years</div>
            </div>
          </div>
        </div>
        <div className="craft-copy">
          <div className="eyebrow">Our workshop</div>
          <h2>
            Four pairs of hands.<br /><em>One bench at a time.</em>
          </h2>
          <p>
            We make slowly, on purpose. A single dining table passes through every joiner in the workshop before it leaves us — rough-cut by Will, drawn by Tom, jointed by Iris, oiled by Sam. No two pieces look alike because no two trees do.
          </p>
          <p style={{marginTop: 14}}>
            If you ever damage a joint, we'll repair it. For twenty-five years. By the same hands that made it.
          </p>

          <div className="craft-stats">
            <div>
              <div className="num">120<sup style={{fontSize: '.45em'}}>+</sup></div>
              <div className="cap">Hours per dining table</div>
            </div>
            <div>
              <div className="num">25<sup style={{fontSize: '.45em'}}>yr</sup></div>
              <div className="cap">Repair guarantee</div>
            </div>
            <div>
              <div className="num">0</div>
              <div className="cap">Veneers · ever</div>
            </div>
            <div>
              <div className="num">3</div>
              <div className="cap">Counties of timber sourced</div>
            </div>
          </div>

          <div className="craft-signoff" style={{marginTop: 36}}>
            <Link to="/pages/about" className="btn" style={{background: 'var(--cwf-accent)', color: 'var(--cwf-primary)', borderRadius: 8, padding: '14px 22px', fontWeight: 600, fontSize: 14}}>
              Visit the workshop <i className="ti ti-arrow-right" />
            </Link>
            <span style={{fontSize: 13, color: 'rgba(243,239,234,.5)'}}>Saturdays · by appointment</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Process section ───────────────────────────────────────────────────────── */
const PROCESS_STEPS = [
  {num: '— 01', icon: 'ti-tree', title: 'Source', desc: 'We buy boards from three small estates within 90 miles. Slow-grown, air-dried, traceable to the stump.'},
  {num: '— 02', icon: 'ti-ruler-2', title: 'Draw', desc: 'Each piece is drawn at full scale on the workshop wall, then prototyped in poplar before timber is cut.'},
  {num: '— 03', icon: 'ti-hammer', title: 'Joint', desc: 'Mortise and tenon, dovetails, draw-bored pegs. No screws where a joint can hold instead.'},
  {num: '— 04', icon: 'ti-flame', title: 'Finish', desc: 'Three coats of food-safe hardwax oil, hand-rubbed between coats. Cured for seven days before delivery.'},
];

function ProcessSection() {
  return (
    <section style={{padding: '96px 0', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <div className="eyebrow">03 · How we work</div>
            <h2 className="title" style={{marginTop: 14}}>
              From standing tree to your hallway — in four steps.
            </h2>
          </div>
        </div>
        <div className="process">
          {PROCESS_STEPS.map((s) => (
            <div key={s.title} className="step">
              <div className="stepnum">{s.num}</div>
              <div className="ic"><i className={`ti ${s.icon}`} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features bar ──────────────────────────────────────────────────────────── */
const FEATURES = [
  {icon: 'ti-truck', title: 'White-glove delivery', desc: 'Two-person crew, room of choice, packaging removed.'},
  {icon: 'ti-certificate', title: '25-year guarantee', desc: 'Free repairs on any joint we made, for a quarter-century.'},
  {icon: 'ti-refresh', title: '30-day at-home trial', desc: "Live with it. If it isn't right, we collect and refund."},
  {icon: 'ti-leaf', title: 'FSC-certified timber', desc: 'Every board traced to a managed European forest.'},
];

function FeaturesBar() {
  return (
    <section style={{paddingTop: 0, paddingBottom: '96px', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="features">
          {FEATURES.map((f) => (
            <div key={f.title} className="f">
              <i className={`ti ${f.icon}`} />
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    stars: '★★★★★',
    quote: "The dining table arrived heavier than the man delivering it. Six years on, the grain has darkened to honey and the joints haven't shifted a millimetre.",
    name: 'Eleanor Ashworth',
    role: 'Aldsworth table · 2020',
  },
  {
    stars: '★★★★★',
    quote: "You can feel where the plane has been over the timber. It's not a piece of furniture, it's a piece of someone's working day.",
    name: 'Marcus Lin',
    role: 'Stow sideboard · 2023',
  },
  {
    stars: '★★★★★',
    quote: "Tom drove the chair down himself, sat in it for ten minutes, adjusted the back, and drove home. I've never been so politely fussed over.",
    name: 'Hannah Reeves',
    role: 'Burford armchair · 2024',
  },
];

function TestimonialsSection() {
  return (
    <section style={{paddingTop: 0, paddingBottom: '96px', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <div className="eyebrow">04 · From the people who live with it</div>
            <h2 className="title" style={{marginTop: 14}}>
              Bought once. Passed on twice.
            </h2>
          </div>
          <div className="right" style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{color: 'var(--cwf-accent)', fontSize: 14, letterSpacing: 2}}>★★★★★</div>
            <span style={{fontSize: 13, color: 'var(--cwf-accent-deep)', fontWeight: 600}}>4.94 · 612 reviews</span>
          </div>
        </div>
        <div className="tgrid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="tcard">
              <div className="stars">{t.stars}</div>
              <q>{t.quote}</q>
              <div className="who">
                <span className="av" />
                <div>
                  <div className="nm">{t.name}</div>
                  <div className="rl">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Newsletter ────────────────────────────────────────────────────────────── */
function NewsletterSection() {
  return (
    <section style={{paddingTop: 0, paddingBottom: '96px', background: 'var(--cwf-surface)'}}>
      <div className="cwf-wrap">
        <div className="news">
          <svg className="bg-mark" width="320" height="320" viewBox="0 0 192 192" aria-hidden>
            <path d="M173.985 182.506L165.126 191.365L111.969 138.209L104.542 145.635L141.413 182.506L132.554 191.365L95.6826 154.494L58.8125 191.365L49.9531 182.506L86.8232 145.635L79.3965 138.208L26.2393 191.365L17.3799 182.506L79.3965 120.489L95.6826 136.775L111.969 120.489L173.985 182.506Z" fill="#C9A27A"/>
            <path d="M70.876 79.3965L54.5889 95.6826L70.876 111.969L62.0166 120.829L8.85938 173.985L0 165.126L53.1562 111.969L45.7295 104.542L8.85938 141.413L0 132.554L36.8701 95.6826L0 58.8125L8.85938 49.9531L45.7295 86.8232L53.1572 79.3965L0 26.2393L8.85938 17.3799L70.876 79.3965Z" fill="#C9A27A"/>
            <path d="M191.365 26.2393L138.208 79.3965L145.635 86.8232L182.506 49.9531L191.365 58.8125L154.494 95.6826L191.365 132.554L182.506 141.413L145.635 104.542L138.209 111.969L191.365 165.126L182.506 173.985L120.489 111.97L136.775 95.6826L120.489 79.3965L182.506 17.3799L191.365 26.2393Z" fill="#C9A27A"/>
            <path d="M173.985 8.85938L120.828 62.0156L111.97 70.876L95.6826 54.5889L79.3965 70.876L17.3799 8.85938L26.2393 0L79.3965 53.1572L86.8232 45.7295L49.9531 8.85938L58.8125 0L95.6826 36.8701L132.554 0L141.413 8.85938L104.542 45.7295L111.969 53.1562L165.126 0L173.985 8.85938Z" fill="#C9A27A"/>
          </svg>
          <div style={{position: 'relative', zIndex: 1}}>
            <div className="eyebrow">The Journal</div>
            <h2 style={{marginTop: 14}}>
              A letter from the bench, <em>once a month.</em>
            </h2>
            <p>
              Notes on timber, the slow business of joinery, and quiet word when a new collection is opening for orders. No marketing, ever.
            </p>
          </div>
          <div style={{position: 'relative', zIndex: 1}}>
            <form className="news-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="your@address.com" required />
              <button type="submit">Subscribe</button>
            </form>
            <div className="tinyterms">~ 11 letters a year · unsubscribe in one click.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GraphQL ───────────────────────────────────────────────────────────────── */
const FEATURED_COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 5, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

const FEATURED_PRODUCTS_QUERY = `#graphql
  fragment FeaturedProduct on Product {
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
  query FeaturedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedProduct
      }
    }
  }
` as const;
