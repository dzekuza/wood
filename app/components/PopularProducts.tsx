import {useState} from 'react';
import {Link} from 'react-router';

interface DemoProduct {
  title: string;
  price: string;
  image: string;
  to: string;
}

const PAGE_1: DemoProduct[] = [
  {title: 'Oak Mantle Beam', price: '€34.51', image: '/demo/product-1.png', to: '/products'},
  {title: 'Coat Rack — Five Hook', price: '€34.51', image: '/demo/product-2.png', to: '/products'},
  {title: 'Rope Door Stop', price: '€34.51', image: '/demo/product-3.png', to: '/products'},
  {title: 'Floating Oak Shelf', price: '€34.51', image: '/demo/product-4.png', to: '/products'},
  {title: 'Fireplace Surround', price: '€34.51', image: '/demo/product-5.png', to: '/products'},
  {title: 'Live Edge Side Table', price: '€34.51', image: '/demo/product-6.png', to: '/products'},
  {title: 'Coat Rack — Four Hook', price: '€34.51', image: '/demo/product-7.png', to: '/products'},
  {title: 'Wood Stove Mantel', price: '€34.51', image: '/demo/product-8.png', to: '/products'},
];

const PAGE_2: DemoProduct[] = [
  {title: 'Reclaimed Oak Beam', price: '€38.90', image: '/demo/product-5.png', to: '/products'},
  {title: 'Walnut Coat Rack', price: '€41.20', image: '/demo/product-6.png', to: '/products'},
  {title: 'Cast Iron Door Stop', price: '€28.00', image: '/demo/product-7.png', to: '/products'},
  {title: 'Corner Oak Shelf', price: '€29.75', image: '/demo/product-8.png', to: '/products'},
  {title: 'Arched Mantel Surround', price: '€52.40', image: '/demo/product-1.png', to: '/products'},
  {title: 'Cube Block Table', price: '€33.10', image: '/demo/product-2.png', to: '/products'},
  {title: 'Wall Coat Hooks — Set of 3', price: '€22.60', image: '/demo/product-3.png', to: '/products'},
  {title: 'Slim Stove Mantel', price: '€47.85', image: '/demo/product-4.png', to: '/products'},
];

const PAGES = [PAGE_1, PAGE_2];

export function PopularProducts() {
  const [page, setPage] = useState(0);

  function goTo(index: number) {
    setPage((index + PAGES.length) % PAGES.length);
  }

  return (
    <section className="demo-popular">
      <h2 className="demo-popular-heading">Most popular</h2>

      <div className="demo-product-grid">
        {PAGES[page].map((product, index) => (
          <article key={`${page}-${index}`} className="demo-product-card">
            <div className="demo-product-image">
              <img src={product.image} alt={product.title} loading="lazy" />
              <button
                type="button"
                className="demo-product-fav reset"
                aria-label={`Save ${product.title} to favourites`}
              >
                <i className="ti ti-heart" />
              </button>
            </div>

            <div className="demo-product-info">
              <Link to={product.to} className="demo-product-title">
                {product.title}
              </Link>
              <div className="demo-product-row">
                <div className="demo-product-price">
                  <span className="demo-product-price-label">From</span>
                  <span className="demo-product-price-value">{product.price}</span>
                </div>
                <button
                  type="button"
                  className="demo-product-add reset"
                  aria-label={`Quick add ${product.title}`}
                >
                  <i className="ti ti-plus" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="demo-popular-nav">
        <button
          type="button"
          className="demo-popular-arrow reset"
          onClick={() => goTo(page - 1)}
          aria-label="Previous products"
        >
          <i className="ti ti-chevron-left" />
        </button>

        <div className="demo-popular-dots">
          {PAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`demo-popular-dot reset${index === page ? ' is-active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Show product page ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="demo-popular-arrow reset"
          onClick={() => goTo(page + 1)}
          aria-label="Next products"
        >
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      <Link to="/collections" className="demo-btn demo-btn-outline-dark">
        Explore Collections
      </Link>
    </section>
  );
}
