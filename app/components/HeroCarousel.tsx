import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {StarFilledIcon} from '~/components/Icons';
import {HOME_CONTENT_DEFAULTS, type HomeHeroSlide} from '~/lib/homeContent';

export type HeroSlide = HomeHeroSlide;

export interface HeroRating {
  average: number;
  count: number;
}

/** Autoplay dwell per slide. Kept in sync with `--demo-hero-slide-duration`
 *  in demo.css, which drives the active dot's fill animation. */
const SLIDE_DURATION_MS = 3000;

/** Slides come from the `home_page` metaobject; this only covers a storefront
 *  that has not been seeded yet. */
const FALLBACK_SLIDES: HeroSlide[] = HOME_CONTENT_DEFAULTS.heroSlides;

export function HeroCarousel({
  slides,
  rating,
}: {
  slides?: HeroSlide[];
  rating?: HeroRating;
}) {
  const activeSlides = slides?.length ? slides : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    setActive((index + activeSlides.length) % activeSlides.length);
  }

  // Advance on a timer. Keying the effect on `active` means any manual
  // arrow/dot click restarts the dwell rather than cutting it short.
  useEffect(() => {
    if (activeSlides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % activeSlides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [active, activeSlides.length]);

  return (
    <>
      <div className="demo-hero">
        {activeSlides.map((slide, index) => (
          <div
            key={index}
            className={`demo-hero-slide${index === active ? ' is-active' : ''}`}
            style={{backgroundImage: `url(${slide.image})`}}
            aria-hidden={index !== active}
          >
            <div className="demo-hero-content">
              {/* Rating, heading and blurb are one block so the 24px rhythm
                  between them is independent of the 48px gap to the CTAs. */}
              <div className="demo-hero-copy">
                {rating && (
                  <div className="demo-hero-rating">
                    <span className="demo-hero-stars" aria-hidden>
                      {Array.from({length: 5}).map((_, i) => (
                        <StarFilledIcon key={i} />
                      ))}
                    </span>
                    <span>
                      {rating.average.toFixed(1)} ({rating.count}) reviews from
                      Etsy customers
                    </span>
                  </div>
                )}

                <h1>
                  {slide.heading.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < slide.heading.length - 1 && <br />}
                    </span>
                  ))}
                </h1>

                <p className="demo-hero-blurb">{slide.blurb}</p>
              </div>

              <div className="demo-hero-ctas">
                <Link
                  to={slide.primaryCta.to}
                  className="demo-btn demo-btn-solid"
                >
                  {slide.primaryCta.label}
                </Link>
                <Link
                  to={slide.secondaryCta.to}
                  className="demo-btn demo-btn-outline"
                >
                  {slide.secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No controls for a single slide — the arrows would just re-render the
          same slide and the lone dot reads as a broken carousel. */}
      {activeSlides.length > 1 && (
        <div className="demo-hero-nav">
          <button
            type="button"
            className="demo-hero-arrow reset"
            onClick={() => goTo(active - 1)}
            aria-label="Previous slide"
          >
            <i className="ti ti-chevron-left" />
          </button>

          <div className="demo-hero-dots">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`demo-hero-dot reset${index === active ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === active}
              />
            ))}
          </div>

          <button
            type="button"
            className="demo-hero-arrow reset"
            onClick={() => goTo(active + 1)}
            aria-label="Next slide"
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}
