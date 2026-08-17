import {useState} from 'react';
import {Link} from 'react-router';

export interface HeroSlide {
  image: string;
  heading: string[];
  blurb: string;
  primaryCta: {label: string; to: string};
  secondaryCta: {label: string; to: string};
}

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    image: '/demo/hero-1.png',
    heading: ['Timeless Oak.', 'Made for Your Home.'],
    blurb:
      'Handcrafted coat racks, fireplace mantels, shelves and solid oak accents—made to bring warmth, function and character to every room.',
    primaryCta: {label: 'Shop All Products', to: '/collections/all'},
    secondaryCta: {label: 'Explore Collections', to: '/collections'},
  },
];

export function HeroCarousel({slides}: {slides?: HeroSlide[]}) {
  const activeSlides = slides?.length ? slides : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    setActive((index + activeSlides.length) % activeSlides.length);
  }

  return (
    <div className="demo-hero">
      {activeSlides.map((slide, index) => (
        <div
          key={index}
          className={`demo-hero-slide${index === active ? ' is-active' : ''}`}
          style={{backgroundImage: `url(${slide.image})`}}
          aria-hidden={index !== active}
        >
          <div className="demo-hero-content">
            <h1>
              {slide.heading.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < slide.heading.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="demo-hero-blurb">{slide.blurb}</p>

            <div className="demo-hero-ctas">
              <Link to={slide.primaryCta.to} className="demo-btn demo-btn-solid">
                {slide.primaryCta.label}
              </Link>
              <Link to={slide.secondaryCta.to} className="demo-btn demo-btn-outline">
                {slide.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      ))}

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
    </div>
  );
}
