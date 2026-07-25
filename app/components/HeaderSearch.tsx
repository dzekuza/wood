import {Link} from 'react-router';
import {useEffect, useRef, useState} from 'react';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

/**
 * Inline predictive search bar for the header top row.
 * Renders a results dropdown while the input is focused and has a term.
 */
export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="header-search" ref={wrapRef}>
      <SearchFormPredictive className="header-search-form">
        {({fetchResults, goToSearch, inputRef}) => (
          <>
            <button
              type="button"
              className="header-search-icon reset"
              onClick={() => {
                setIsOpen(false);
                goToSearch();
              }}
              aria-label="Search"
            >
              <i className="ti ti-search" />
            </button>
            <input
              className="header-search-input"
              name="q"
              onChange={(event) => {
                fetchResults(event);
                setIsOpen(true);
              }}
              onFocus={(event) => {
                fetchResults(event as unknown as React.ChangeEvent<HTMLInputElement>);
                setIsOpen(true);
              }}
              placeholder="Search for..."
              ref={inputRef}
              type="search"
            />
          </>
        )}
      </SearchFormPredictive>

      {isOpen && (
        <div className="header-search-results">
          <SearchResultsPredictive>
            {({items, total, term, state, closeSearch}) => {
              const {articles, collections, pages, products, queries} = items;

              if (state === 'loading' && term.current) {
                return <div className="predictive-search-loading">Loading...</div>;
              }

              if (!term.current) return null;

              if (!total) {
                return <SearchResultsPredictive.Empty term={term} />;
              }

              return (
                <>
                  <SearchResultsPredictive.Queries
                    queries={queries}
                    closeSearch={() => {
                      closeSearch();
                      setIsOpen(false);
                    }}
                    term={term}
                  />
                  <SearchResultsPredictive.Products
                    products={products}
                    closeSearch={() => {
                      closeSearch();
                      setIsOpen(false);
                    }}
                    term={term}
                  />
                  <SearchResultsPredictive.Collections
                    collections={collections}
                    closeSearch={() => {
                      closeSearch();
                      setIsOpen(false);
                    }}
                    term={term}
                  />
                  <SearchResultsPredictive.Pages
                    pages={pages}
                    closeSearch={() => {
                      closeSearch();
                      setIsOpen(false);
                    }}
                    term={term}
                  />
                  <SearchResultsPredictive.Articles
                    articles={articles}
                    closeSearch={() => {
                      closeSearch();
                      setIsOpen(false);
                    }}
                    term={term}
                  />
                  {term.current && total ? (
                    <Link
                      onClick={() => setIsOpen(false)}
                      to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                    >
                      <p>
                        View all results for <q>{term.current}</q>
                        &nbsp; →
                      </p>
                    </Link>
                  ) : null}
                </>
              );
            }}
          </SearchResultsPredictive>
        </div>
      )}
    </div>
  );
}
