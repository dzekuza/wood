import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  FeaturedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

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
          className="pcard-heart"
          aria-label="Save"
          onClick={(e) => e.preventDefault()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="pcard-body">
        {vendor && (
          <div className="pcard-tags">
            <span className="pcard-tag">{vendor}</span>
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
