import type {ProductVariantFragment} from 'storefrontapi.generated';
import {Image} from '@shopify/hydrogen';

export interface ProductImageProps {
  image: ProductVariantFragment['image'];
  /** Passed straight to `<Image sizes>`. Override wherever the image renders
   *  much smaller than the default half-viewport — the PDP thumbnail rail sits
   *  at 88px, and without this each thumb pulls a ~700px file. */
  sizes?: string;
  /** The page's LCP image: fetched eagerly at high priority instead of
   *  lazily. Use on the first visible gallery image only. */
  priority?: boolean;
}

export function ProductImage({
  image,
  sizes = '(min-width: 45em) 50vw, 100vw',
  priority = false,
}: ProductImageProps) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div className="product-image">
      <Image
        alt={image.altText || 'Product Image'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
      />
    </div>
  );
}
