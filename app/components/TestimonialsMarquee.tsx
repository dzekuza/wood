interface Review {
  name: string;
  product: string;
  quote: string;
  photos: string[];
}

const ROW_1: Review[] = [
  {
    name: 'Pam',
    product: 'Floating Oak Shelf',
    quote: 'The 2 shelves I bought are excellent quality and look great on the wall.',
    photos: ['/demo/review-1a.jpg'],
  },
  {
    name: 'Sarah',
    product: 'Floating Oak Shelf',
    quote: 'The 2 shelves I bought are excellent quality and look wonderful on the wall.',
    photos: ['/demo/review-1a.jpg', '/demo/review-1b.jpg'],
  },
  {
    name: 'Emily',
    product: 'Oak Coat Rack with Shelf',
    quote:
      'The quality is incredible and the craftsmanship. I ended up buying another one for my utility room. Love them — highly recommend.',
    photos: ['/demo/review-2a.jpg', '/demo/review-2b.jpg'],
  },
  {
    name: 'Rebecca',
    product: 'Oak Fireplace Beam Mantel',
    quote: 'Fantastic beam that arrived on time and is high quality. I would highly recommend.',
    photos: ['/demo/review-3a.jpg'],
  },
];

const ROW_2: Review[] = [
  {
    name: 'JS',
    product: 'Oak Coat Rack with Shelf',
    quote:
      'Arrived as stated. Great build quality, materials, spec and packaging. Excellent communication from seller. Would use again, have recommended to family.',
    photos: ['/demo/review-4a.jpg'],
  },
  {
    name: 'Claire',
    product: 'Oak Coat Rack with Shelf',
    quote: 'Helpful and accommodating seller. Item high quality and as described.',
    photos: ['/demo/review-5a.jpg', '/demo/review-5b.jpg'],
  },
  {
    name: 'Tom',
    product: 'Oak Mantle Beam',
    quote: 'Excellent product and great service.',
    photos: ['/demo/review-6a.jpg', '/demo/review-6b.jpg'],
  },
  {
    name: 'Amy',
    product: 'Oak Coat Rack Shelf',
    quote:
      'Really happy with my new coat rack! Goes perfectly in my porch and looks great. So many people have complemented it!',
    photos: ['/demo/review-7a.jpg', '/demo/review-7b.jpg'],
  },
];

function ReviewCard({review}: {review: Review}) {
  return (
    <article className="demo-review-card">
      <div className="demo-review-stars" aria-hidden>
        {Array.from({length: 5}).map((_, i) => (
          <i key={i} className="ti ti-star-filled" />
        ))}
      </div>
      <p className="demo-review-quote">{review.quote}</p>
      {review.photos.length > 0 && (
        <div className="demo-review-photos">
          {review.photos.map((photo, i) => (
            <span className="demo-review-photo" key={i}>
              <img src={photo} alt="" loading="lazy" />
            </span>
          ))}
        </div>
      )}
      <div className="demo-review-author">
        <span className="demo-review-avatar" aria-hidden />
        <span className="demo-review-author-text">
          <span className="demo-review-name">{review.name}</span>
          <span className="demo-review-product">{review.product}</span>
        </span>
      </div>
    </article>
  );
}

function MarqueeRow({reviews, reverse}: {reviews: Review[]; reverse?: boolean}) {
  return (
    <div className={`demo-review-row${reverse ? ' is-reverse' : ''}`}>
      <div className="demo-review-track">
        {[...reviews, ...reviews].map((review, i) => (
          <ReviewCard review={review} key={i} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <section className="demo-testimonials">
      <div className="demo-testimonials-head">
        <h2>What our real customers say</h2>
        <div className="demo-testimonials-rating">
          <span className="demo-testimonials-stars" aria-hidden>
            {Array.from({length: 5}).map((_, i) => (
              <i key={i} className="ti ti-star-filled" />
            ))}
          </span>
          <span>4.9 · 1237 reviews</span>
        </div>
      </div>

      <div className="demo-review-rows">
        <MarqueeRow reviews={ROW_1} />
        <MarqueeRow reviews={ROW_2} reverse />
      </div>
    </section>
  );
}
