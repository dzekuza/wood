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
import {getSwatchTone} from '~/lib/swatches';

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
  // Featured image first, then the rest of the gallery (deduped) — this is
  // the set the hover nav scrubs through, capped so the dots stay compact.
  const galleryImages = [
    image,
    ...(product.images?.nodes?.filter((node) => node.id !== image?.id) ?? []),
  ]
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .slice(0, 5);
  const price = product.priceRange.minVariantPrice;
  const rating = getRatingSummary(('metafield' in product && product.metafield?.value) || null);
  const swatches = getSwatches(product);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const isSoldOut = product.selectedOrFirstAvailableVariant?.availableForSale === false;
  const saveAmount = isSoldOut ? null : getSaveAmount(product);

  function goToImage(event: React.MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((index + galleryImages.length) % galleryImages.length);
  }

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
        {galleryImages.map((node, index) => (
          <img
            key={node.id}
            src={node.url}
            alt={index === 0 ? node.altText || product.title : ''}
            aria-hidden={index !== 0}
            loading={index === 0 ? loading : 'lazy'}
            className={`pcard-img-frame${index === activeImage ? ' is-active' : ''}`}
          />
        ))}
        {galleryImages.length > 1 && (
          <div className="pcard-img-nav">
            <button
              type="button"
              className="pcard-img-arrow reset"
              onClick={(event) => goToImage(event, activeImage - 1)}
              aria-label="Previous image"
            >
              <i className="ti ti-chevron-left" aria-hidden />
            </button>

            <div className="pcard-img-dots">
              {galleryImages.map((node, index) => (
                <button
                  key={node.id}
                  type="button"
                  className={`pcard-img-dot reset${index === activeImage ? ' is-active' : ''}`}
                  onClick={(event) => goToImage(event, index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                />
              ))}
            </div>

            <button
              type="button"
              className="pcard-img-arrow reset"
              onClick={(event) => goToImage(event, activeImage + 1)}
              aria-label="Next image"
            >
              <i className="ti ti-chevron-right" aria-hidden />
            </button>
          </div>
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
        {/* Two blocks: what the product is (name + rating), then what it costs
            (price + swatches). Grouping them lets the card space the two apart
            independently of the rhythm inside each. */}
        <div className="pcard-heading">
          <p className="pcard-name">{product.title}</p>

          {/* A product with no reviews shows an explicit 0.0 (0 reviews) rather
              than a blank gap — the star is muted so a filled gold star never
              sits next to a zero score. */}
          <div className={`pcard-rating${rating ? '' : ' is-zero'}`}>
            <span>{(rating?.average ?? 0).toFixed(1)}</span>
            <StarFilledIcon />
            <span className="pcard-rating-count">
              ({rating?.count ?? 0} {rating?.count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
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
              {swatches.map((swatch) => (
                <span
                  key={swatch.name}
                  className={`pcard-swatch${swatch.image ? ' pcard-swatch-has-image' : ` ${getSwatchTone(swatch.name, swatch.color)}`}`}
                >
                  {swatch.image && <img src={swatch.image} alt="" />}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
