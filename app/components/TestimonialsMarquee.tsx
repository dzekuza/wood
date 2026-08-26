import type {ProductReview} from '~/components/ReviewsSection';
import {StarFilledIcon} from '~/components/Icons';

function ReviewCard({review}: {review: ProductReview}) {
  return (
    <article className="demo-review-card">
      <div className="demo-review-stars" aria-hidden>
        {Array.from({length: review.rating}).map((_, i) => (
          <StarFilledIcon key={i} />
        ))}
      </div>
      <p className="demo-review-quote">{review.body}</p>
      {review.images && review.images.length > 0 && (
        <div className="demo-review-photos">
          {review.images.map((photo) => (
            <span className="demo-review-photo" key={photo}>
              <img src={photo} alt="" loading="lazy" />
            </span>
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
    </article>
  );
}

function MarqueeRow({reviews, reverse}: {reviews: ProductReview[]; reverse?: boolean}) {
  return (
    <div className={`demo-review-row${reverse ? ' is-reverse' : ''}`}>
      <div className="demo-review-track">
        {[...reviews, ...reviews].map((review, i) => (
          <ReviewCard review={review} key={`${review.author}-${i}`} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsMarquee({reviews}: {reviews: ProductReview[]}) {
  if (!reviews.length) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
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
          <span>{average.toFixed(1)} · {reviews.length} reviews</span>
        </div>
        <h2>What our customers say</h2>
      </div>

      <div className="demo-review-rows">
        <MarqueeRow reviews={row1} />
        {row2.length > 0 && <MarqueeRow reviews={row2} reverse />}
      </div>
    </section>
  );
}
