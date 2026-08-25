import type {ProductReview} from '~/components/ReviewsSection';

const FEATURED_AUTHORS = ['Emily', 'Annie', 'JS'];

export function ReviewQuoteGrid({reviews}: {reviews: ProductReview[]}) {
  const featured = FEATURED_AUTHORS.map((name) =>
    reviews.find((review) => review.author === name),
  ).filter((review): review is ProductReview => Boolean(review?.images?.length));

  if (!featured.length) return null;

  return (
    <section className="demo-quotes">
      <div className="demo-quotes-grid">
        {featured.map((review) => (
          <article className="demo-quote-card" key={review.author}>
            <div className="demo-quote-photo">
              <img src={review.images![0]} alt="" loading="lazy" />
            </div>
            <div className="demo-quote-body">
              <p className="demo-quote-attr">
                {review.author.toUpperCase()}
                <span> — verified buyer, {review.product}</span>
              </p>
              <p className="demo-quote-text">&ldquo;{review.body}&rdquo;</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
