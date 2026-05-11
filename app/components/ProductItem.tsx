import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';

const DIMENSION_KEYWORDS = ['size', 'width', 'height', 'length', 'depth', 'thickness', 'diameter'];
const STYLE_KEYWORDS = ['finish', 'color', 'colour', 'material', 'style', 'wood', 'stain'];

function getVariantBadges(options?: {name: string}[]): string[] {
  if (!options) return [];
  return options
    .filter(o => o.name.toLowerCase() !== 'title')
    .map(o => {
      const lower = o.name.toLowerCase();
      if (DIMENSION_KEYWORDS.some(k => lower.includes(k))) return `Customisable ${o.name.toLowerCase()}`;
      if (STYLE_KEYWORDS.some(k => lower.includes(k))) return `Choice of ${o.name.toLowerCase()}`;
      return null;
    })
    .filter((b): b is string => b !== null);
}
import type {
  ProductItemFragment,
  CollectionItemFragment,
  FeaturedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {useFavourites} from '~/hooks/useFavourites';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | FeaturedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const vendor = (product as {vendor?: string}).vendor;
  const options = (product as {options?: {name: string}[]}).options;
  const badges = getVariantBadges(options);
  const {isFavourite, toggleFavourite} = useFavourites();
  const saved = isFavourite(product.id);

  return (
    <Link className="pcard" key={product.id} prefetch="intent" to={variantUrl}>
      <div className="pcard-img">
        {image && (
          <Image
            alt={image.altText || product.title}
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        <button
          className={`pcard-heart${saved ? ' saved' : ''}`}
          aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
          onClick={(e) => {
            e.preventDefault();
            toggleFavourite({
              id: product.id,
              handle: product.handle,
              title: product.title,
              image: image ? {url: image.url, altText: image.altText, width: image.width, height: image.height} : undefined,
              price: product.priceRange.minVariantPrice,
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="pcard-body">
        {(vendor || badges.length > 0) && (
          <div className="pcard-tags">
            {vendor && <span className="pcard-tag">{vendor}</span>}
            {badges.map(b => (
              <span key={b} className="pcard-tag pcard-tag--custom">{b}</span>
            ))}
          </div>
        )}
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
  );
}
