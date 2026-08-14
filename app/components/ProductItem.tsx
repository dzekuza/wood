import {useEffect, useRef, useState} from 'react';
import {Link, useFetcher} from 'react-router';
import {CartForm, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  SaleProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {useFavourites} from '~/hooks/useFavourites';

type GalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type ProductCardFragment =
  | CollectionItemFragment
  | ProductItemFragment
  | SaleProductFragment;

const COLOR_OPTION_NAMES = ['color', 'colour', 'finish', 'tone'];

function getSwatchOption(product: ProductCardFragment) {
  const options = product.options ?? [];
  const withSwatches = options.find((option) =>
    option.optionValues.some((value) => value.swatch),
  );
  if (withSwatches) return withSwatches;
  return options.find((option) =>
    COLOR_OPTION_NAMES.includes(option.name.toLowerCase()),
  );
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
  const {isFavourite, toggleFavourite} = useFavourites();
  const saved = isFavourite(product.id);

  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = (product as {compareAtPriceRange?: {minVariantPrice: typeof price}}).compareAtPriceRange?.minVariantPrice;
  const showCompareAt = compareAtPrice && Number(compareAtPrice.amount) > Number(price.amount);
  const saveAmount = showCompareAt
    ? (Number(compareAtPrice.amount) - Number(price.amount)).toFixed(2)
    : null;

  const reviewsRaw = (product as {metafield?: {value: string} | null}).metafield?.value;
  const reviewStats = (() => {
    if (!reviewsRaw) return null;
    try {
      const reviews = JSON.parse(reviewsRaw) as {rating: number}[];
      if (!reviews.length) return null;
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return {avg: avg.toFixed(1), count: reviews.length};
    } catch { return null; }
  })();

  const galleryImages = (product as {images?: {nodes: GalleryImage[]}}).images?.nodes;
  const gallery = galleryImages?.length ? galleryImages : image ? [image] : [];
  const [imageIndex, setImageIndex] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const swatchOption = getSwatchOption(product);
  const swatchValues = swatchOption?.optionValues.slice(0, 6) ?? [];

  const quickAddVariant = product.selectedOrFirstAvailableVariant;
  const cartFetcher = useFetcher({key: `quick-add-${product.id}`});
  const addingToCart = cartFetcher.state !== 'idle';

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!quickAddVariant?.id || !quickAddVariant.availableForSale || addingToCart) return;
    const formData = new FormData();
    formData.append(
      CartForm.INPUT_NAME,
      JSON.stringify({
        action: CartForm.ACTIONS.LinesAdd,
        inputs: {lines: [{merchandiseId: quickAddVariant.id, quantity: 1}]},
      }),
    );
    void cartFetcher.submit(formData, {method: 'post', action: '/cart'});
  }

  const startCycling = () => {
    if (gallery.length < 2 || hoverTimer.current) return;
    hoverTimer.current = setInterval(() => {
      setImageIndex((i) => (i + 1) % gallery.length);
    }, 700);
  };

  const stopCycling = () => {
    if (hoverTimer.current) {
      clearInterval(hoverTimer.current);
      hoverTimer.current = null;
    }
    setImageIndex(0);
  };

  useEffect(() => () => stopCycling(), []);

  return (
    <Link
      className={className ? `pcard ${className}` : 'pcard'}
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      onMouseEnter={startCycling}
      onMouseLeave={stopCycling}
    >
      <div className="pcard-img">
        {gallery.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.altText || product.title}
            loading={loading}
            className={`pcard-img-frame${i === imageIndex ? ' active' : ''}`}
          />
        ))}
        {saveAmount && (
          <span className="pcard-badge">
            Save <Money data={{amount: saveAmount, currencyCode: price.currencyCode}} />
          </span>
        )}
        {reviewStats && (
          <div className="pcard-rating">
            <span className="pcard-rating-star">★</span>
            <span className="pcard-rating-avg">{reviewStats.avg}</span>
            <span className="pcard-rating-count">({reviewStats.count})</span>
          </div>
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
              price,
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        {gallery.length > 1 && (
          <div className="pcard-dots">
            {gallery.map((img, i) => (
              <span key={img.id} className={`pcard-dot${i === imageIndex ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{product.title}</p>
        {swatchValues.length > 0 && (
          <div className="pcard-swatches">
            {swatchValues.map((value, i) => {
              const swatchImage = value.swatch?.image?.previewImage?.url;
              const swatchColor = value.swatch?.color;
              return (
                <span
                  key={value.name}
                  className={`pcard-swatch${i === 0 ? ' active' : ''}`}
                  title={value.name}
                  style={
                    !swatchImage && swatchColor
                      ? {backgroundColor: swatchColor}
                      : undefined
                  }
                >
                  {swatchImage && <img src={swatchImage} alt="" />}
                </span>
              );
            })}
          </div>
        )}
        <div className="pcard-price-row">
          <div className="pcard-price">
            <span className="pcard-price-eyebrow">From</span>
            <span className="pcard-price-value">
              <Money data={price} />
              {showCompareAt && compareAtPrice && (
                <span className="pcard-compare-at">
                  <Money data={compareAtPrice} />
                </span>
              )}
            </span>
          </div>
          {quickAddVariant?.availableForSale && (
            <button
              type="button"
              className="pcard-quickadd"
              aria-label={`Quick add ${product.title}`}
              disabled={addingToCart}
              onClick={handleQuickAdd}
            >
              <i className="ti ti-plus" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
