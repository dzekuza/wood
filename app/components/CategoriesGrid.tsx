import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';
import {CategoryCard, type Category} from '~/components/CategoryCard';
import {HOME_CONTENT_DEFAULTS, type HomeSectionHead} from '~/lib/homeContent';

export type {Category};

export interface CategoriesGridProps {
  categories: Category[];
  content?: HomeSectionHead;
}

export function CategoriesGrid({
  categories,
  content = HOME_CONTENT_DEFAULTS.categories,
}: CategoriesGridProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // Pages are derived from the track's own measurements rather than a fixed
  // per-page constant, so the dot count stays correct as the card flex-basis
  // changes across breakpoints.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const card = track.firstElementChild;
      if (!track.clientWidth || !card) return;

      // Deliberately cards-per-view rather than scrollWidth / clientWidth: the
      // track's trailing gap pushes that ratio just past a whole number (6
      // cards 3-up measures 2.02), which rounds up to a phantom final page
      // that scrolls all of 16px.
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const perView = Math.max(
        1,
        Math.round(track.clientWidth / (card.getBoundingClientRect().width + gap)),
      );

      setPageCount(Math.max(1, Math.ceil(track.children.length / perView)));
      setPage(Math.round(track.scrollLeft / track.clientWidth));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [categories.length]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    setPage(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goToPage(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, index));
    track.scrollTo({left: clamped * track.clientWidth, behavior: 'smooth'});
    setPage(clamped);
  }

  if (!categories.length) return null;

  return (
    <section className="demo-categories">
      <div className="demo-categories-inner">
        <div className="demo-categories-head">
          <EditableText as="h2" field="categories.heading">
            {content.heading}
          </EditableText>
          <EditableText
            as="p"
            className="demo-categories-sub"
            field="categories.subheading"
          >
            {content.subheading}
          </EditableText>
          <Link to="/collections" className="demo-categories-all">
            <EditableText field="categories.linkLabel">
              {content.linkLabel}
            </EditableText>{' '}
            <i className="ti ti-arrow-up-right" aria-hidden />
          </Link>
        </div>

        <div className="demo-cat-grid" ref={trackRef} onScroll={handleScroll}>
          {categories.map((category) => (
            <CategoryCard key={category.title} category={category} />
          ))}
        </div>

        {pageCount > 1 && (
          <div className="demo-cat-nav">
            <button
              type="button"
              className="demo-cat-arrow-btn reset"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              aria-label="Previous categories"
            >
              <i className="ti ti-chevron-left" />
            </button>

            <div className="demo-cat-dots">
              {Array.from({length: pageCount}).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`demo-cat-dot reset${i === page ? ' is-active' : ''}`}
                  onClick={() => goToPage(i)}
                  aria-label={`Show category page ${i + 1}`}
                  aria-current={i === page}
                />
              ))}
            </div>

            <button
              type="button"
              className="demo-cat-arrow-btn reset"
              onClick={() => goToPage(page + 1)}
              disabled={page === pageCount - 1}
              aria-label="Next categories"
            >
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
