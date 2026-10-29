import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {ETSY_SHOP_RATING} from '~/data/etsy-ratings';
import type {RatingSummary} from '~/lib/reviewStats';

export type ProductReview = {
  author: string;
  rating: number;
  body: string;
  created_at: string;
  images?: string[];
  product?: string;
  productHandle?: string;
};

/**
 * PDP reviews — the homepage `TestimonialsMarquee`, fed this product's own
 * Etsy reviews and rating when it has any, otherwise the shop's Etsy reviews
 * (headlined as the shop-wide rating, never as this product's).
 */
export function ReviewsSection({
  reviews,
  rating,
}: {
  reviews?: ProductReview[];
  rating?: RatingSummary | null;
}) {
  if (!reviews?.length || !rating) {
    return (
      <div id="reviews">
        <TestimonialsMarquee reviews={HOMEPAGE_REVIEWS} rating={ETSY_SHOP_RATING} />
      </div>
    );
  }

  return (
    <div id="reviews">
      <TestimonialsMarquee reviews={reviews} rating={rating} />
    </div>
  );
}
