import {useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import {
  getClearFiltersUrl,
  getCurrentPriceRange,
  getFilterValueUrl,
  getListAndBooleanFilters,
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
  const current = getCurrentPriceRange(searchParams);
  const [min, setMin] = useState(current.min);
  const [max, setMax] = useState(current.max);

  return (
    <div className="fblock">
      <h4>Price</h4>
      <form
        className="price-range"
        onSubmit={(event) => {
          event.preventDefault();
          const url = getPriceRangeUrl(searchParams, {min, max});
          window.location.href = url;
        }}
      >
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={priceFilter ? 'Min' : '0'}
          value={min}
          onChange={(event) => setMin(event.target.value)}
        />
        <span>—</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Max"
          value={max}
          onChange={(event) => setMax(event.target.value)}
        />
        <button type="submit" className="price-range-apply" aria-label="Apply price range">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </form>
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
