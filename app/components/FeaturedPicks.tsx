import {Link} from 'react-router';
import type {PopularProductItemLandingOakFragment} from 'storefrontapi.generated';

const THEMES = ['sage', 'oak', 'walnut'] as const;

export function FeaturedPicks({
  products,
}: {
  products: PopularProductItemLandingOakFragment[];
}) {
  if (!products.length) return null;

  return (
    <section className="demo-featured">
      <h2 className="demo-popular-heading">Most popular</h2>

      <div className="demo-featured-grid">
        {products.map((product, index) => {
          const theme = THEMES[index % THEMES.length];
          return (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className={`demo-featured-card demo-featured-${theme}`}
            >
              <div className="demo-featured-image">
                {product.featuredImage && (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="demo-featured-body">
                <p className="demo-featured-eyebrow">Handcrafted in solid oak</p>
                <p className="demo-featured-title">{product.title}</p>
                <span className="demo-btn demo-btn-outline-light demo-btn-sm">Shop now</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
