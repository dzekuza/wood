import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {ProductItem} from '~/components/ProductItem';
import type {PopularProductItemLandingOakFragment} from 'storefrontapi.generated';

const PER_PAGE = 4;

export interface ProductCarouselTab {
  key: string;
  label: string;
  products: PopularProductItemLandingOakFragment[];
}

export function ProductCarousel({
  heading,
  tabs,
  exploreTo = '/collections/all',
}: {
  heading: string;
  tabs: ProductCarouselTab[];
  exploreTo?: string;
}) {
  const populatedTabs = tabs.filter((tab) => tab.products.length > 0);
  const [activeKey, setActiveKey] = useState(populatedTabs[0]?.key);
  const activeTab = populatedTabs.find((tab) => tab.key === activeKey) ?? populatedTabs[0];
  const products = activeTab?.products ?? [];

  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(products.length / PER_PAGE));

  useEffect(() => {
    setPage(0);
    trackRef.current?.scrollTo({left: 0});
  }, [activeKey]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setPage(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goToPage(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    track.scrollTo({left: clamped * track.clientWidth, behavior: 'smooth'});
    setPage(clamped);
  }

  if (!populatedTabs.length) return null;

  return (
    <section className="demo-popular">
      <h2 className="demo-popular-heading">{heading}</h2>

      {populatedTabs.length > 1 && (
        <div className="demo-popular-tabs">
          {populatedTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`demo-popular-tab reset${tab.key === activeTab?.key ? ' is-active' : ''}`}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="demo-popular-carousel">
        <div className="demo-popular-track" ref={trackRef} onScroll={handleScroll}>
          {products.map((product, index) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < PER_PAGE ? 'eager' : undefined}
            />
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className="demo-popular-nav">
          <button
            type="button"
            className="demo-popular-arrow reset"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            aria-label="Previous products"
          >
            <i className="ti ti-chevron-left" />
          </button>

          <div className="demo-popular-dots">
            {Array.from({length: pageCount}).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`demo-popular-dot reset${i === page ? ' is-active' : ''}`}
                onClick={() => goToPage(i)}
                aria-label={`Show page ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="demo-popular-arrow reset"
            onClick={() => goToPage(page + 1)}
            disabled={page === pageCount - 1}
            aria-label="Next products"
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}

      <Link to={exploreTo} className="demo-btn demo-btn-outline-dark">
        Explore Collections
      </Link>
    </section>
  );
}
