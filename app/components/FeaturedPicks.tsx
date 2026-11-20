import {Link} from 'react-router';
import type {PopularProductItemLandingOakFragment} from 'storefrontapi.generated';
import {EditableText} from '~/components/EditableText';
import {shopifyImageUrl, shopifySrcSet} from '~/lib/shopifyImage';

const CARD_WIDTHS = [240, 360, 480, 720] as const;

const THEMES = ['sage', 'oak', 'walnut'] as const;

export function FeaturedPicks({
  products,
}: {
  products: PopularProductItemLandingOakFragment[];
}) {
  if (!products.length) return null;

  return (
    <section className="demo-featured">
      <EditableText as="h2" className="demo-popular-heading" field="featured.heading">
        Most popular
      </EditableText>

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
                    src={shopifyImageUrl(product.featuredImage.url, 480)}
                    srcSet={shopifySrcSet(product.featuredImage.url, CARD_WIDTHS)}
                    sizes="(min-width: 1080px) 25vw, 50vw"
                    alt={product.featuredImage.altText || product.title}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="demo-featured-body">
                <EditableText as="p" className="demo-featured-eyebrow" field="featured.eyebrow">
                  Handcrafted in solid oak
                </EditableText>
                <p className="demo-featured-title">{product.title}</p>
                <EditableText
                  as="span"
                  className="demo-btn demo-btn-outline-light demo-btn-sm"
                  field="featured.ctaLabel"
                >
                  Shop now
                </EditableText>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
