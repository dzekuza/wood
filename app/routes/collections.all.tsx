import type {Route} from './+types/collections.all';
import {useLoaderData, Link} from 'react-router';
import {useState, useMemo} from 'react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {SITE_NAME} from '~/lib/site';

export const meta: Route.MetaFunction = () => [
  {title: `All Products | ${SITE_NAME}`},
];

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 48});
  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {variables: {...paginationVariables}}),
  ]);
  return {products};
}

// ── filter helpers ────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Seating:  ['chair', 'sofa', 'bench', 'stool', 'armchair', 'seat', 'rocker'],
  Tables:   ['table', 'desk', 'dining', 'coffee', 'side table', 'console'],
  Storage:  ['shelf', 'shelving', 'cabinet', 'rack', 'storage', 'wardrobe', 'chest', 'nightstand', 'coat'],
  Beds:     ['bed', 'headboard', 'platform bed'],
  Outdoor:  ['outdoor', 'garden', 'patio'],
};

const WOOD_KEYWORDS: Record<string, string[]> = {
  'English Oak':      ['oak'],
  'European Walnut':  ['walnut'],
  'Ash':              ['ash'],
  'Reclaimed Beam':   ['reclaimed'],
};

function matchesAny(title: string, keywords: string[]) {
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

function filterProducts(
  nodes: CollectionItemFragment[],
  activeChip: string,
  categories: Set<string>,
  woods: Set<string>,
) {
  return nodes.filter((p) => {
    const title = p.title;

    // Chip overrides individual category checkboxes
    if (activeChip !== 'All') {
      if (!matchesAny(title, CATEGORY_KEYWORDS[activeChip] ?? [])) return false;
    } else if (categories.size > 0) {
      const matchesCat = [...categories].some((cat) =>
        matchesAny(title, CATEGORY_KEYWORDS[cat] ?? []),
      );
      if (!matchesCat) return false;
    }

    if (woods.size > 0) {
      const matchesWood = [...woods].some((w) =>
        matchesAny(title, WOOD_KEYWORDS[w] ?? []),
      );
      if (!matchesWood) return false;
    }

    return true;
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

const CHIPS = ['All', 'Seating', 'Tables', 'Storage', 'Beds', 'Outdoor'];
const CATEGORIES = [['Seating', 31], ['Tables', 18], ['Storage', 14], ['Beds', 12], ['Outdoor', 8]] as const;
const WOODS     = [['English Oak', 31], ['European Walnut', 18], ['Ash', 14], ['Reclaimed Beam', 12]] as const;
const LEAD_TIMES = [['In stock', 12], ['4–6 weeks', 38], ['8–12 weeks', 24], ['Bespoke', 10]] as const;
const FINISHES = [
  {label: 'Oak', className: 'finish-swatch-oak'},
  {label: 'Walnut', className: 'finish-swatch-walnut'},
  {label: 'Dark Walnut', className: 'finish-swatch-dark-walnut'},
  {label: 'Whitewash', className: 'finish-swatch-whitewash'},
  {label: 'Ebonised', className: 'finish-swatch-ebonised'},
];

function CheckList({
  items,
  selected,
  onToggle,
}: {
  items: readonly (readonly [string, number])[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <ul>
      {items.map(([name, ct]) => {
        const active = selected.has(String(name));
        return (
          <li key={String(name)}>
            <button
              className="filter-check-btn"
              onClick={() => onToggle(String(name))}
              aria-pressed={active}
            >
              <span className={`check${active ? ' on' : ''}`}>
                {active && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="filter-check-label">{name}</span>
              <span className="ct">{ct}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function AllProducts() {
  const {products} = useLoaderData<typeof loader>();

  const [activeChip, setActiveChip] = useState('All');
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [woods,      setWoods]      = useState<Set<string>>(new Set());
  const [finishes,   setFinishes]   = useState<Set<string>>(new Set());
  const [leadTimes,  setLeadTimes]  = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, val: string) {
    const next = new Set(set);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setFn(next);
  }

  function handleChip(chip: string) {
    setActiveChip(chip);
    // Sync category checkboxes to match the active chip
    if (chip === 'All') {
      setCategories(new Set());
    } else {
      setCategories(new Set([chip]));
    }
  }

  function handleCategoryToggle(val: string) {
    const next = new Set(categories);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setCategories(next);
    // Update chip to reflect checkbox state
    if (next.size === 1) {
      setActiveChip([...next][0]);
    } else {
      setActiveChip('All');
    }
  }

  const filtered = useMemo(
    () => filterProducts(products.nodes, activeChip, categories, woods),
    [products.nodes, activeChip, categories, woods],
  );

  const activeCount = categories.size + woods.size + finishes.size + leadTimes.size;

  function clearAll() {
    setCategories(new Set());
    setWoods(new Set());
    setFinishes(new Set());
    setLeadTimes(new Set());
    setActiveChip('All');
  }

  return (
    <>
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/collections">Collections</Link>
            <span>/</span>
            <span>All Products</span>
          </div>
          <div className="page-header-inner">
            <div>
              <h1>Every piece, every <em>room</em>.</h1>
              <p className="blurb">
                Solid-timber furniture made to outlast the trends. Browse the full range or filter by what you need.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar-row">
          <div className="filter-chips">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                className={`filter-chip${activeChip === chip ? ' active' : ''}`}
                onClick={() => handleChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="filter-bar-meta">
            <button className="filter-mobile-btn" onClick={() => setMobileFiltersOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            {activeCount > 0 && (
              <button className="filter-clear-btn" onClick={clearAll}>
                Clear {activeCount}
              </button>
            )}
            <button className="sort-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cwf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l4-4 4 4" /><path d="M7 5v14" />
                <path d="M21 15l-4 4-4-4" /><path d="M17 19V5" />
              </svg>
              Newest first
            </button>
          </div>
        </div>
      </div>

      {/* Shell: sidebar + grid */}
      <div className="shop-shell">
        <div className="cwf-wrap">
          <div className="shop-inner">
            <aside className="shop-sidebar">
              <div className="fblock">
                <h4>Category</h4>
                <CheckList items={CATEGORIES} selected={categories} onToggle={handleCategoryToggle} />
              </div>
              <div className="fblock">
                <h4>Wood</h4>
                <CheckList items={WOODS} selected={woods} onToggle={(v) => toggle(woods, setWoods, v)} />
              </div>
              <div className="fblock">
                <h4>Finish</h4>
                <div className="swatch-row">
                  {FINISHES.map(({label, className}) => (
                    <button
                      key={label}
                      className={`sw ${className}${finishes.has(label) ? ' on' : ''}`}
                      title={label}
                      onClick={() => toggle(finishes, setFinishes, label)}
                      aria-pressed={finishes.has(label)}
                    />
                  ))}
                </div>
              </div>
              <div className="fblock">
                <h4>Price · €</h4>
                <div className="price-range">
                  <input type="text" defaultValue="240" readOnly />
                  <span>—</span>
                  <input type="text" defaultValue="4,800" readOnly />
                </div>
              </div>
              <div className="fblock">
                <h4>Lead time</h4>
                <CheckList items={LEAD_TIMES} selected={leadTimes} onToggle={(v) => toggle(leadTimes, setLeadTimes, v)} />
              </div>
            </aside>

            {/* Product grid — filtered */}
            <div className="filter-main">
              <span className="filter-bar-count filter-bar-count-block">{filtered.length} pieces</span>
              {filtered.length === 0 ? (
                <div className="filter-empty">
                  <p>No pieces match your filters.</p>
                  <button className="btn btn-primary" onClick={clearAll}>Clear filters</button>
                </div>
              ) : (
                <div className="pgrid">
                  {filtered.map((product, index) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      loading={index < 12 ? 'eager' : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="mob-filter-overlay" role="presentation">
          <button
            type="button"
            className="mob-filter-backdrop"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <aside
            className="mob-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
          >
            <div className="mob-filter-header">
              <span className="eyebrow" id="mobile-filter-title">Filters</span>
              <button className="mob-filter-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="mob-filter-body">
              <div className="fblock">
                <h4>Category</h4>
                <CheckList items={CATEGORIES} selected={categories} onToggle={handleCategoryToggle} />
              </div>
              <div className="fblock">
                <h4>Wood</h4>
                <CheckList items={WOODS} selected={woods} onToggle={(v) => toggle(woods, setWoods, v)} />
              </div>
            </div>
            <div className="mob-filter-footer">
              {activeCount > 0 && <button className="btn btn-line" onClick={() => { clearAll(); setMobileFiltersOpen(false); }}>Clear all</button>}
              <button className="btn btn-primary" onClick={() => setMobileFiltersOpen(false)}>Show {filtered.length} pieces</button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    options {
      name
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice { ...MoneyCollectionItem }
      maxVariantPrice { ...MoneyCollectionItem }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${COLLECTION_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes { ...CollectionItem }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
