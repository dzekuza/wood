import {Link} from 'react-router';
import {shopifyImageUrl, shopifySrcSet} from '~/lib/shopifyImage';

const CARD_WIDTHS = [240, 360, 480, 720] as const;

export interface Category {
  title: string;
  image: string | null;
  to: string;
  count?: number;
}

/**
 * The `.demo-cat-card` tile — square cutout on a neutral tile, hover-revealed
 * arrow badge, title and product count.
 *
 * Shared, not duplicated: the homepage carousel (`CategoriesGrid`) and the
 * all-categories page (`collections._index`) render the same card, so the two
 * cannot drift. It carries no layout of its own — the parent decides whether
 * it sits in a scroll-snap track or a grid cell — which is why the card's
 * `flex-basis` lives on `.demo-cat-card` in `demo.css` and is simply ignored
 * when the card is a grid item.
 */
export function CategoryCard({category}: {category: Category}) {
  return (
    <Link to={category.to} className="demo-cat-card" prefetch="intent">
      <span className="demo-cat-image">
        {category.image && (
          <img
            src={shopifyImageUrl(category.image, 480)}
            srcSet={shopifySrcSet(category.image, CARD_WIDTHS)}
            sizes="(min-width: 1024px) 25vw, 60vw"
            alt={category.title}
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="demo-cat-arrow" aria-hidden>
          <i className="ti ti-arrow-up-right" />
        </span>
      </span>
      <span className="demo-cat-title">{category.title}</span>
      {typeof category.count === 'number' && (
        <span className="demo-cat-count">
          {category.count} {category.count === 1 ? 'product' : 'products'}
        </span>
      )}
    </Link>
  );
}
