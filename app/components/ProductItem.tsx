import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  ProductRecommendationsQuery,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

type ProductCardFragment =
  | CollectionItemFragment
  | ProductItemFragment
  | NonNullable<ProductRecommendationsQuery['productRecommendations']>[number];

export function ProductItem({
  product,
  loading,
  className,
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
  className?: string;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const price = product.priceRange.minVariantPrice;

  return (
    <Link
      className={className ? `pcard ${className}` : 'pcard'}
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="pcard-img">
        {image && (
          <img
            src={image.url}
            alt={image.altText || product.title}
            loading={loading}
            className="pcard-img-frame active"
          />
        )}
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{product.title}</p>
        <div className="pcard-price-row">
          <span className="pcard-price-eyebrow">From</span>
          <span className="pcard-price-value">
            <Money data={price} />
          </span>
        </div>
      </div>
    </Link>
  );
}
