import {REVIEWS} from '~/lib/reviews';

function ReviewCard({r}: {r: (typeof REVIEWS)[number]}) {
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

export function ReviewsSection() {
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
              {topRow.map((r) => <ReviewCard key={r.name + r.product} r={r} />)}
              {topRow.map((r) => <ReviewCard key={'b-' + r.name + r.product} r={r} />)}
            </div>
          </div>
          {/* Row 2 — slides right */}
          <div className="rev-marquee-wrap">
            <div className="rev-marquee-track rev-marquee-right">
              {bottomRow.map((r) => <ReviewCard key={r.name + r.product} r={r} />)}
              {bottomRow.map((r) => <ReviewCard key={'b-' + r.name + r.product} r={r} />)}
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
