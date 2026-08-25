import {useState} from 'react';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  ProductRecommendationsQuery,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {HeartFilledIcon, StarFilledIcon} from '~/components/Icons';

type ProductCardFragment =
  | CollectionItemFragment
  | ProductItemFragment
  | NonNullable<ProductRecommendationsQuery['productRecommendations']>[number];

type ParsedReview = {rating?: number};

function getRatingSummary(metafieldValue?: string | null) {
  if (!metafieldValue) return null;
  let reviews: ParsedReview[];
  try {
    reviews = JSON.parse(metafieldValue) as ParsedReview[];
  } catch {
    return null;
  }
  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === 'number');
  if (!ratings.length) return null;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return {average, count: ratings.length};
}

function getSaveAmount(product: ProductCardFragment) {
  const price = Number(product.priceRange.minVariantPrice.amount);
  const compareAt = Number(product.compareAtPriceRange?.minVariantPrice?.amount ?? 0);
  if (!compareAt || compareAt <= price) return null;

  const amount = compareAt - price;
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return null;
  }
}

function getSwatches(product: ProductCardFragment) {
  const swatchOption = product.options?.find((option) =>
    option.optionValues.some((value) => value.swatch?.color || value.swatch?.image),
  );
  if (!swatchOption) return [];

  return swatchOption.optionValues
    .filter((value) => value.swatch?.color || value.swatch?.image?.previewImage?.url)
    .slice(0, 6)
    .map((value) => ({
      name: value.name,
      color: value.swatch?.color ?? null,
      image: value.swatch?.image?.previewImage?.url ?? null,
    }));
}

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
  const rating = getRatingSummary(('metafield' in product && product.metafield?.value) || null);
  const swatches = getSwatches(product);
  const [isSaved, setIsSaved] = useState(false);
  const isSoldOut = product.selectedOrFirstAvailableVariant?.availableForSale === false;
  const saveAmount = isSoldOut ? null : getSaveAmount(product);

  return (
    <Link
      className={['pcard', isSoldOut && 'is-sold-out', className].filter(Boolean).join(' ')}
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="pcard-img">
        {isSoldOut ? (
          <span className="pbadge pbadge-sold-out">Sold out</span>
        ) : (
          saveAmount && <span className="pbadge pbadge-sale">Save {saveAmount}</span>
        )}
        {image && (
          <img
            src={image.url}
            alt={image.altText || product.title}
            loading={loading}
            className="pcard-img-frame active"
          />
        )}
        <button
          type="button"
          className={`pheart${isSaved ? ' is-active' : ''}`}
          aria-label={isSaved ? 'Remove from favourites' : 'Save to favourites'}
          aria-pressed={isSaved}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsSaved((value) => !value);
          }}
        >
          <i className="ti ti-heart" aria-hidden />
          <HeartFilledIcon className="pheart-filled" />
        </button>
      </div>

      <div className="pcard-body">
        <p className="pcard-name">{product.title}</p>

        <div
          className={`pcard-rating${rating ? '' : ' is-empty'}`}
          aria-hidden={rating ? undefined : true}
        >
          {rating && (
            <>
              <span>{rating.average.toFixed(1)}</span>
              <StarFilledIcon />
              <span className="pcard-rating-count">
                ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
              </span>
            </>
          )}
        </div>

        <div className="pcard-bottom-row">
          <div className="pcard-price-row">
            <span className="pcard-price-eyebrow">From</span>
            <span className="pcard-price-value">
              <Money data={price} />
            </span>
          </div>

          {swatches.length > 0 && (
            <div className="pcard-swatches" aria-hidden>
              {swatches.map((swatch, index) => (
                <span
                  key={swatch.name}
                  className={`pcard-swatch${index === 0 ? ' is-first' : ''}`}
                  style={{
                    backgroundColor: swatch.color ?? undefined,
                    backgroundImage: swatch.image ? `url(${swatch.image})` : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
