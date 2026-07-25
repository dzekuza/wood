import {Link} from 'react-router';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {getPagePath} from '~/lib/site';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section className="search-result search-result-links">
      <div className="search-result-head">
        <div>
          <span className="eyebrow">Journal</span>
          <h2>Articles</h2>
        </div>
        <span className="search-result-count">{articles.nodes.length}</span>
      </div>
      <div className="search-result-list">
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item search-results-item-link" key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                <div className="search-results-link-copy">
                  <span className="search-results-link-label">Journal article</span>
                  <strong>{article.title}</strong>
                </div>
                <i className="ti ti-arrow-up-right" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section className="search-result search-result-links">
      <div className="search-result-head">
        <div>
          <span className="eyebrow">Pages</span>
          <h2>Guides and pages</h2>
        </div>
        <span className="search-result-count">{pages.nodes.length}</span>
      </div>
      <div className="search-result-list">
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: getPagePath(page.handle),
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item search-results-item-link" key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                <div className="search-results-link-copy">
                  <span className="search-results-link-label">Store page</span>
                  <strong>{page.title}</strong>
                </div>
                <i className="ti ti-arrow-up-right" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section className="search-result search-result-products">
      <div className="search-result-head">
        <div>
          <span className="eyebrow">Products</span>
          <h2>Pieces that match</h2>
        </div>
      </div>
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => {
          const ItemsMarkup = nodes.map((product) => {
            const productUrl = urlWithTrackingParams({
              baseUrl: `/products/${product.handle}`,
              trackingParams: product.trackingParameters,
              term,
            });

            const price = product?.selectedOrFirstAvailableVariant?.price;
            const image = product?.selectedOrFirstAvailableVariant?.image;

            return (
              <article className="search-results-item search-results-item-product" key={product.id}>
                <Link className="search-product-card" prefetch="intent" to={productUrl}>
                  {image && (
                    <div className="search-product-image">
                      <Image data={image} alt={product.title} width={160} />
                    </div>
                  )}
                  <div className="search-product-copy">
                    <span className="search-product-label">CraftWoodFurniture</span>
                    <p>{product.title}</p>
                    <div className="search-product-meta">
                      <strong>{price && <Money data={price} />}</strong>
                      <span>
                        View piece <i className="ti ti-arrow-right" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          });

          return (
            <div className="search-product-results">
              <div className="search-pagination-row search-pagination-row-top">
                <PreviousLink>
                  {isLoading ? 'Loading...' : <span>Load previous</span>}
                </PreviousLink>
              </div>
              <div className="search-product-grid">{ItemsMarkup}</div>
              <div className="search-pagination-row search-pagination-row-bottom">
                <NextLink>
                  {isLoading ? 'Loading...' : <span>Load more</span>}
                </NextLink>
              </div>
            </div>
          );
        }}
      </Pagination>
    </section>
  );
}

function SearchResultsEmpty() {
  return (
    <section className="search-empty-state">
      <span className="eyebrow">No matches yet</span>
      <h2>Try a broader search term.</h2>
      <p>
        Search by wood type, room, or product category. Terms like oak shelf, dining table, or
        coat rack work best.
      </p>
      <div className="search-empty-actions">
        <Link className="btn btn-primary btn-pill" to="/collections/all">
          Browse all pieces
        </Link>
        <Link className="btn btn-line btn-pill" to="/blogs">
          Read the journal
        </Link>
      </div>
    </section>
  );
}
