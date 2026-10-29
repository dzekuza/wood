/** Average and count behind a star rating. Ratings come from the Etsy review
 *  export (`app/data/etsy-ratings.ts`), one entry per product page. */
export interface RatingSummary {
  average: number;
  count: number;
}

/**
 * Compact display for a review count — `1400` reads as `1.4k`. Four figures of
 * reviews in full is noise in a one-line badge, and the trailing `.0` is
 * dropped so a round 2000 shows as `2k`.
 */
export function formatReviewCount(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}
