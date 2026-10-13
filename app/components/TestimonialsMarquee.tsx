import {useEffect, useRef, useState} from 'react';
import type {ProductReview} from '~/components/ReviewsSection';
import {StarFilledIcon} from '~/components/Icons';
import {EditableText} from '~/components/EditableText';
import {Lightbox} from '~/components/Lightbox';
import {HOME_CONTENT_DEFAULTS} from '~/lib/homeContent';
import {formatReviewCount, type RatingSummary} from '~/lib/reviewStats';
import {ETSY_REVIEWS_URL, STORE_REVIEW_COUNT} from '~/lib/site';

function ReviewCard({
  review,
  ariaHidden,
}: {
  review: ProductReview;
  ariaHidden?: boolean;
}) {
  const photos = review.images ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <article className="demo-review-card" aria-hidden={ariaHidden || undefined}>
      <div className="demo-review-stars" aria-hidden>
        {Array.from({length: review.rating}).map((_, i) => (
          <StarFilledIcon key={i} />
        ))}
      </div>
      <p className="demo-review-quote">{review.body}</p>
      {photos.length > 0 && (
        <div className="demo-review-photos">
          {photos.map((photo, i) => (
            <button
              type="button"
              className="demo-review-photo reset"
              key={photo}
              onClick={() => setOpenIndex(i)}
              /* Marquee clones are duplicates of a card that is already in the
                 a11y tree, so they stay clickable but out of the tab order. */
              tabIndex={ariaHidden ? -1 : 0}
              aria-label={`View photo ${i + 1} of ${photos.length} from ${review.author}'s review`}
            >
              <img src={photo} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="demo-review-author">
        <span className="demo-review-author-text">
          <span className="demo-review-name">{review.author}</span>
          {review.product && (
            <span className="demo-review-product">{review.product}</span>
          )}
        </span>
      </div>

      {openIndex !== null && (
        <Lightbox
          images={photos.map((src) => ({
            src,
            alt: `Photo from ${review.author}'s review`,
          }))}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </article>
  );
}

function MarqueeRow({
  reviews,
  reverse,
}: {
  reviews: ProductReview[];
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // The loop length grows with the card count, so the duration has to as well
  // or a long row (a PDP with 40 reviews) races past. CSS turns the count into
  // a per-card duration — see `--demo-review-cards` in demo.css.
  useEffect(() => {
    trackRef.current?.style.setProperty(
      '--demo-review-cards',
      String(reviews.length),
    );
  }, [reviews.length]);

  return (
    <div className={`demo-review-row${reverse ? ' is-reverse' : ''}`}>
      <div className="demo-review-track" ref={trackRef}>
        {[...reviews, ...reviews].map((review, i) => (
          <ReviewCard
            review={review}
            ariaHidden={i >= reviews.length}
            key={`${review.author}-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

export interface TestimonialsMarqueeProps {
  reviews: ProductReview[];
  /**
   * Headline rating for the section. Covers the whole catalogue, so it is
   * deliberately *not* derived from `reviews` — those are a curated handful
   * chosen for their photos. Falls back to summarising the cards when a caller
   * has no store-wide figure.
   */
  rating?: RatingSummary | null;
  heading?: string;
}

export function TestimonialsMarquee({
  reviews,
  rating,
  heading = HOME_CONTENT_DEFAULTS.testimonials.heading,
}: TestimonialsMarqueeProps) {
  if (!reviews.length) return null;

  const summary = rating ?? {
    average:
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    count: reviews.length,
  };
  const rowSplit = Math.ceil(reviews.length / 2);
  const row1 = reviews.slice(0, rowSplit);
  const row2 = reviews.slice(rowSplit);

  return (
    <section className="demo-testimonials">
      <div className="demo-testimonials-head">
        <div className="demo-testimonials-rating">
          <span className="demo-testimonials-stars" aria-hidden>
            {Array.from({length: 5}).map((_, i) => (
              <StarFilledIcon key={i} />
            ))}
          </span>
          <span>
            {summary.average.toFixed(1)} · {formatReviewCount(summary.count)}{' '}
            reviews
          </span>
        </div>
        <EditableText as="h2" field="testimonials.heading">
          {heading}
        </EditableText>
      </div>

      <div className="demo-review-rows">
        <MarqueeRow reviews={row1} />
        {row2.length > 0 && <MarqueeRow reviews={row2} reverse />}
      </div>

      <div className="demo-testimonials-cta">
        <a
          className="btn btn-line btn-pill"
          href={ETSY_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* Always the shop-wide Etsy total, not `summary` — on a PDP that is
              only this product's reviews. */}
          Read all {formatReviewCount(STORE_REVIEW_COUNT)} reviews on Etsy
          <i className="ti ti-arrow-right" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
