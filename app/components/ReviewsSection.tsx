import {REVIEWS} from '~/lib/reviews';

export function ReviewsSection() {
  return (
    <section className="section-linen-cont">
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
    </section>
  );
}
