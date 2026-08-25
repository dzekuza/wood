import {useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import {
  getClearFiltersUrl,
  getCurrentPriceRange,
  getFilterValueUrl,
  getListAndBooleanFilters,
  getPriceBounds,
  getPriceFilter,
  getPriceRangeUrl,
  hasActiveFilters,
  isFilterValueActive,
} from '~/lib/collectionFilters';

function FilterValueRow({
  filterId,
  value,
}: {
  filterId: string;
  value: Filter['values'][number];
}) {
  const [searchParams] = useSearchParams();
  const input = String(value.input);
  const active = isFilterValueActive(searchParams, input);

  return (
    <li key={value.id}>
      <Link to={getFilterValueUrl(searchParams, input)} prefetch="intent" replace preventScrollReset>
        <span className={`check${active ? ' on' : ''}`} aria-hidden>
          {active && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        {value.label}
        <span className="ct">({value.count})</span>
      </Link>
    </li>
  );
}

function PriceFilterBlock({priceFilter}: {priceFilter: Filter | undefined}) {
  const [searchParams] = useSearchParams();
  const bounds = getPriceBounds(priceFilter);
  const current = getCurrentPriceRange(searchParams);
  const [min, setMin] = useState(current.min || String(bounds.min));
  const [max, setMax] = useState(current.max || String(bounds.max));

  const minNum = Math.min(Math.max(Number(min) || bounds.min, bounds.min), bounds.max);
  const maxNum = Math.max(Math.min(Number(max) || bounds.max, bounds.max), bounds.min);
  const span = Math.max(bounds.max - bounds.min, 1);
  const leftPct = ((minNum - bounds.min) / span) * 100;
  const rightPct = 100 - ((maxNum - bounds.min) / span) * 100;

  function apply(nextMin: string, nextMax: string) {
    window.location.href = getPriceRangeUrl(searchParams, {min: nextMin, max: nextMax});
  }

  return (
    <div className="fblock">
      <h4>Price</h4>
      <form
        className="price-range"
        onSubmit={(event) => {
          event.preventDefault();
          apply(min, max);
        }}
      >
        <input
          type="number"
          inputMode="decimal"
          min={bounds.min}
          placeholder={String(bounds.min)}
          value={min}
          onChange={(event) => setMin(event.target.value)}
          onBlur={() => apply(min, max)}
        />
        <span>—</span>
        <input
          type="number"
          inputMode="decimal"
          max={bounds.max}
          placeholder={String(bounds.max)}
          value={max}
          onChange={(event) => setMax(event.target.value)}
          onBlur={() => apply(min, max)}
        />
        <button type="submit" className="price-range-apply" aria-label="Apply price range">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </form>

      <div className="price-slider">
        <div className="price-slider-track">
          <div className="price-slider-fill" style={{left: `${leftPct}%`, right: `${rightPct}%`}} />
        </div>
        <input
          type="range"
          className="price-slider-thumb"
          min={bounds.min}
          max={bounds.max}
          value={minNum}
          aria-label="Minimum price"
          onChange={(event) => setMin(String(Math.min(Number(event.target.value), maxNum)))}
          onMouseUp={() => apply(min, max)}
          onTouchEnd={() => apply(min, max)}
        />
        <input
          type="range"
          className="price-slider-thumb"
          min={bounds.min}
          max={bounds.max}
          value={maxNum}
          aria-label="Maximum price"
          onChange={(event) => setMax(String(Math.max(Number(event.target.value), minNum)))}
          onMouseUp={() => apply(min, max)}
          onTouchEnd={() => apply(min, max)}
        />
      </div>
    </div>
  );
}

export function CollectionFilters({
  filters,
  resultCount,
}: {
  filters: Filter[];
  resultCount?: number;
}) {
  const [searchParams] = useSearchParams();
  const listFilters = getListAndBooleanFilters(filters);
  const priceFilter = getPriceFilter(filters);
  const showClear = hasActiveFilters(searchParams);

  if (listFilters.length === 0 && !priceFilter) return null;

  return (
    <div className="filters-content">
      {listFilters.map((filter) => (
        <div className="fblock" key={filter.id}>
          <h4>{filter.label}</h4>
          <ul>
            {filter.values.map((value) => (
              <FilterValueRow key={value.id} filterId={filter.id} value={value} />
            ))}
          </ul>
        </div>
      ))}

      <PriceFilterBlock priceFilter={priceFilter} />

      {showClear && (
        <Link to={getClearFiltersUrl(searchParams)} replace preventScrollReset className="filter-clear-btn">
          Clear all filters
          {typeof resultCount === 'number' && ` (${resultCount})`}
        </Link>
      )}
    </div>
  );
}
