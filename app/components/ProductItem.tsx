import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
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

export function ProductItem({
  product,
  loading,
}: {
  product: CollectionItemFragment | ProductItemFragment;
  loading?: 'eager' | 'lazy';
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
      className="pcard"
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
        <div className="pcard-price">
          <Money data={price} />
          {showCompareAt && compareAtPrice && (
            <span className="pcard-compare-at">
              <Money data={compareAtPrice} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
