import {useState, useEffect, useCallback} from 'react';
import {Link} from 'react-router';
import {REVIEWS} from '~/lib/reviews';

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

function ImageLightbox({src, onClose}: {src: string; onClose: () => void}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="rev-lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <button className="rev-lightbox-close" onClick={onClose} aria-label="Close image">✕</button>
      <img
        src={src}
        alt="Review photo"
        className="rev-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function ProductReviewCard({review}: {review: ProductReview}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const close = useCallback(() => setLightboxSrc(null), []);

  return (
    <div className="tcard">
      <StarRow rating={review.rating} />
      <q>{review.body}</q>
      {review.images && review.images.length > 0 && (
        <div className="rev-images">
          {review.images.slice(0, 4).map((src, i) => (
            <button key={i} className="rev-img-btn" onClick={() => setLightboxSrc(src)} aria-label={`View review photo ${i + 1}`}>
              <img src={src} alt={`Review photo ${i + 1}`} className="rev-img-thumb" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="who">
        <span className="av" />
        <div>
          <div className="nm">{review.author}</div>
          <div className="rl">
            {review.productHandle
              ? <Link to={`/products/${review.productHandle}`} className="rev-product-link">{review.product || review.created_at}</Link>
              : (review.product || review.created_at)
            }
          </div>
        </div>
      </div>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={close} />}
    </div>
  );
}

function StaticReviewCard({r}: {r: (typeof REVIEWS)[number]}) {
  return (
    <div className="tcard rev-marquee-card" aria-hidden="true">
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
  // PDP mode — real product reviews from metafield
  if (reviews && reviews.length > 0) {
    const totalReviews = reviews.length;
    const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1);
    return (
      <section id="reviews" className="section-linen-cont">
        <div className="cwf-wrap">
          <div className="shead">
            <div>
              <div className="eyebrow">Verified Etsy reviews</div>
              <h2 className="title">What our customers say</h2>
            </div>
            <div className="right">
              <div className="tgrid-rating">★★★★★</div>
              <span className="tgrid-count">{avgRating} · {totalReviews} reviews</span>
            </div>
          </div>
          <div className="tgrid">
            {reviews.map((r, i) => (
              <ProductReviewCard key={i} review={r} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Homepage / fallback — static marquee
  const useMarquee = REVIEWS.length >= 6;
  const mid = Math.ceil(REVIEWS.length / 2);
  const topRow = REVIEWS.slice(0, mid);
  const bottomRow = REVIEWS.slice(mid);

  return (
    <section id="reviews" className="section-linen-cont">
      <div className="cwf-wrap">
        <div className="shead">
          <div>
            <div className="eyebrow">Verified Etsy reviews</div>
            <h2 className="title">What our customers say</h2>
          </div>
          <div className="right">
            <div className="tgrid-rating">★★★★★</div>
            <span className="tgrid-count">4.9 · 1,310 reviews</span>
          </div>
        </div>
      </div>

      {useMarquee ? (
        <div className="rev-marquee-section">
          {/* Row 1 — slides left */}
          <div className="rev-marquee-wrap">
            <div className="rev-marquee-track rev-marquee-left">
              {topRow.map((r) => <StaticReviewCard key={r.name + r.product} r={r} />)}
              {topRow.map((r) => <StaticReviewCard key={'b-' + r.name + r.product} r={r} />)}
            </div>
          </div>
          {/* Row 2 — slides right */}
          <div className="rev-marquee-wrap">
            <div className="rev-marquee-track rev-marquee-right">
              {bottomRow.map((r) => <StaticReviewCard key={r.name + r.product} r={r} />)}
              {bottomRow.map((r) => <StaticReviewCard key={'b-' + r.name + r.product} r={r} />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="cwf-wrap">
          <div className="tgrid">
            {REVIEWS.map((r) => (
              <div key={r.name + r.product} className="tcard">
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
