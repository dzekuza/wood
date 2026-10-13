import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {HOMEPAGE_REVIEWS} from '~/lib/reviews';
import {STORE_REVIEW_COUNT} from '~/lib/site';

export type ProductReview = {
  author: string;
  rating: number;
  body: string;
  created_at: string;
  images?: string[];
  product?: string;
  productHandle?: string;
};

/** Shop-wide headline used when a product has no reviews of its own — the
 *  same figure the homepage shows. */
const SHOP_RATING = {average: 4.9, count: STORE_REVIEW_COUNT};

/** A marquee row needs enough cards to overflow the viewport, or the loop
 *  shows a gap; a product with two reviews repeats them until it does. */
const MIN_CARDS = 6;

function fillMarquee(reviews: ProductReview[]): ProductReview[] {
  const result = [...reviews];
  while (result.length < MIN_CARDS) result.push(...reviews);
  return result;
}

/**
 * PDP reviews — the homepage `TestimonialsMarquee`, fed this product's own
 * reviews when it has any, otherwise the curated shop reviews.
 */
export function ReviewsSection({reviews}: {reviews?: ProductReview[]}) {
  if (!reviews?.length) {
    return (
      <div id="reviews">
        <TestimonialsMarquee reviews={HOMEPAGE_REVIEWS} rating={SHOP_RATING} />
      </div>
    );
  }

  const rating = {
    average: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    count: reviews.length,
  };

  return (
    <div id="reviews">
      <TestimonialsMarquee reviews={fillMarquee(reviews)} rating={rating} />
    </div>
  );
}
