import {useState} from 'react';
import {Link} from 'react-router';
import {REVIEWS} from '~/lib/reviews';
import {Lightbox} from '~/components/Lightbox';

export type ProductReview = {
  author: string;
  rating: number;
  body: string;
  created_at: string;
  images?: string[];
  product?: string;
  productHandle?: string;
};

function StarRow({rating}: {rating: number}) {
  return (
    <div className="stars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
  );
}

function ProductReviewCard({review, ariaHidden}: {review: ProductReview; ariaHidden?: boolean}) {
  const photos = review.images ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="tcard rev-marquee-card" aria-hidden={ariaHidden || undefined}>
      <StarRow rating={review.rating} />
      <q>{review.body}</q>
      {photos.length > 0 && (
        <div className="rev-images">
          {photos.slice(0, 4).map((src, i) => (
            <button
              key={i}
              className="rev-img-btn"
              onClick={() => !ariaHidden && setOpenIndex(i)}
              tabIndex={ariaHidden ? -1 : 0}
              aria-label={`View review photo ${i + 1}`}
            >
              {/* Decorative: the wrapping button already carries the label. */}
              <img src={src} alt="" className="rev-img-thumb" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="who">
        <span className="av" />
        <div>
          <div className="nm">{review.author}</div>
          <div className="rl">
            {review.productHandle ? (
              <Link
                to={`/products/${review.productHandle}`}
                className="rev-product-link"
                tabIndex={ariaHidden ? -1 : 0}
              >
                {review.product || review.created_at}
              </Link>
            ) : (
              review.product || review.created_at
            )}
          </div>
        </div>
      </div>
      {openIndex !== null && !ariaHidden && (
        <Lightbox
          images={photos.slice(0, 4).map((src) => ({
            src,
            alt: `Photo from ${review.author}'s review`,
          }))}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}

function StaticReviewCard({r, ariaHidden}: {r: (typeof REVIEWS)[number]; ariaHidden?: boolean}) {
  return (
    <div className="tcard rev-marquee-card" aria-hidden={ariaHidden || undefined}>
      <div className="stars">{r.stars}</div>
      <q>{r.quote}</q>
      <div className="who">
        <span className="av" />
        <div>
          <div className="nm">{r.name}</div>
          <div className="rl">{r.product}</div>
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection({reviews}: {reviews?: ProductReview[]}) {
  const source = reviews && reviews.length > 0 ? reviews : null;

  // Ensure enough cards to fill the marquee by duplicating if needed
  const ensureFull = (arr: ProductReview[], min = 6): ProductReview[] => {
    if (arr.length >= min) return arr;
    const result = [...arr];
    while (result.length < min) result.push(...arr);
    return result;
  };

  if (source) {
    const full = ensureFull(source);
    const mid = Math.ceil(full.length / 2);
    const topRow = full.slice(0, mid);
    const bottomRow = full.slice(mid).length >= 3 ? full.slice(mid) : full.slice(0, mid);

    const avgRating = (source.reduce((s, r) => s + r.rating, 0) / source.length).toFixed(1);

    return (
      <section id="reviews" className="section-linen-cont">
        <div className="cwf-wrap">
          <div className="shead">
            <div>
              <h2 className="title">What our customers say</h2>
            </div>
            <div className="right">
              <div className="tgrid-rating">★★★★★</div>
              <span className="tgrid-count">
                {avgRating} · {source.length} reviews
              </span>
            </div>
          </div>
        </div>

        <div className="rev-marquee-section">
          {/* Row 1 — slides left */}
          <div className="rev-marquee-wrap">
            <div className="rev-marquee-track rev-marquee-left">
              {topRow.map((r, i) => (
                <ProductReviewCard key={`t-${i}`} review={r} />
              ))}
              {topRow.map((r, i) => (
                <ProductReviewCard key={`td-${i}`} review={r} ariaHidden />
              ))}
            </div>
          </div>
          {/* Row 2 — slides right */}
          <div className="rev-marquee-wrap">
            <div className="rev-marquee-track rev-marquee-right">
              {bottomRow.map((r, i) => (
                <ProductReviewCard key={`b-${i}`} review={r} />
              ))}
              {bottomRow.map((r, i) => (
                <ProductReviewCard key={`bd-${i}`} review={r} ariaHidden />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback — static REVIEWS marquee (no real reviews available)
  const mid = Math.ceil(REVIEWS.length / 2);
  const topRow = REVIEWS.slice(0, mid);
  const bottomRow = REVIEWS.slice(mid);

  return (
    <section id="reviews" className="section-linen-cont">
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <h2 className="title">What our customers say</h2>
          </div>
          <div className="right">
            <div className="tgrid-rating">★★★★★</div>
            <span className="tgrid-count">4.9 · 1,310 reviews</span>
          </div>
        </div>
      </div>

      <div className="rev-marquee-section">
        <div className="rev-marquee-wrap">
          <div className="rev-marquee-track rev-marquee-left">
            {topRow.map((r) => (
              <StaticReviewCard key={r.name + r.product} r={r} />
            ))}
            {topRow.map((r) => (
              <StaticReviewCard key={'d-' + r.name + r.product} r={r} ariaHidden />
            ))}
          </div>
        </div>
        <div className="rev-marquee-wrap">
          <div className="rev-marquee-track rev-marquee-right">
            {bottomRow.map((r) => (
              <StaticReviewCard key={r.name + r.product} r={r} />
            ))}
            {bottomRow.map((r) => (
              <StaticReviewCard key={'d-' + r.name + r.product} r={r} ariaHidden />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
