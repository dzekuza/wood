import {Await, Link} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
  SearchSuggestionsQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {SearchSuggestions} from '~/components/SearchSuggestions';
import {shouldHideCollection} from '~/lib/site';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  searchSuggestions: Promise<SearchSuggestionsQuery | null>;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
  searchSuggestions,
}: PageLayoutProps) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside header={header} searchSuggestions={searchSuggestions} />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
          searchSuggestions={searchSuggestions}
        />
      )}
      <main>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Suspense fallback={<Aside type="cart" heading="YOUR BAG"><div /></Aside>}>
      <Await resolve={cart}>
        {(resolvedCart) => {
          const count = resolvedCart?.totalQuantity ?? 0;
          const heading = (
            <>
              YOUR BAG
              {count > 0 && (
                <span className="cart-heading-count">{count}</span>
              )}
            </>
          );
          return (
            <Aside type="cart" heading={heading}>
              <CartMain cart={resolvedCart} layout="aside" />
            </Aside>
          );
        }}
      </Await>
    </Suspense>
  );
}

function SearchAside({
  header,
  searchSuggestions,
}: {
  header: PageLayoutProps['header'];
  searchSuggestions: PageLayoutProps['searchSuggestions'];
}) {
  const categories = (header.collections?.nodes ?? []).filter(
    (collection) =>
      !shouldHideCollection({
        handle: collection.handle,
        title: collection.title,
      }),
  );

  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <span className="search-field-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                className="search-input"
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search products, categories…"
                ref={inputRef}
                type="search"
              />
              <button className="search-submit" onClick={goToSearch} aria-label="Search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </>
          )}
        </SearchFormPredictive>

        <div className="predictive-search-results">
        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!term.current) {
              return (
                <SearchSuggestions
                  categories={categories}
                  searchSuggestions={searchSuggestions}
                  onNavigate={closeSearch}
                />
              );
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
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
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
