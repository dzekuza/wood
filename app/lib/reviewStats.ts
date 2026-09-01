/**
 * Ratings live in each product's `reviews.product_reviews` metafield as a JSON
 * array. This module owns reading that shape — both the per-card star rating
 * and the store-wide aggregate behind the homepage headline go through here, so
 * a card and the homepage can never disagree about what a product scores.
 */

type ParsedReview = {rating?: number};

export interface RatingSummary {
  average: number;
  count: number;
}

/** A product carrying the reviews metafield, however the query aliased it. */
export interface ReviewedProduct {
  metafield?: {value?: string | null} | null;
}

/**
 * Ratings for one product. Returns `null` — not a zero summary — when there is
 * nothing to show, so callers can tell "no reviews yet" apart from "rated 0",
 * which the product card renders differently.
 */
export function getRatingSummary(
  metafieldValue?: string | null,
): RatingSummary | null {
  const ratings = parseRatings(metafieldValue);
  if (!ratings.length) return null;

  return {
    average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
    count: ratings.length,
  };
}

/**
 * One summary across many products, for the homepage hero badge and the
 * testimonials heading.
 *
 * The average is over every individual review, not over the per-product
 * averages — a product with 40 reviews should pull the store number harder than
 * one with 2, which averaging averages would not do.
 */
export function aggregateRatings(
  products: ReviewedProduct[],
): RatingSummary | null {
  let sum = 0;
  let count = 0;

  for (const product of products) {
    for (const rating of parseRatings(product.metafield?.value)) {
      sum += rating;
      count += 1;
    }
  }

  return count ? {average: sum / count, count} : null;
}

/** Tolerates malformed or non-array metafield values by returning nothing. */
function parseRatings(metafieldValue?: string | null): number[] {
  if (!metafieldValue) return [];

  let reviews: ParsedReview[];
  try {
    reviews = JSON.parse(metafieldValue) as ParsedReview[];
  } catch {
    return [];
  }
  if (!Array.isArray(reviews)) return [];

  return reviews
    .map((review) => review?.rating)
    .filter((rating): rating is number => typeof rating === 'number');
}
