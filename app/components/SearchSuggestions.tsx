import {Await, Link} from 'react-router';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {SearchSuggestionsQuery} from 'storefrontapi.generated';
import {buildFeaturedSearchProducts} from '~/lib/searchSuggestions';

type Category = {id: string; title: string; handle: string};

/**
 * Fallback content shown while the header/aside search field is focused but
 * has no term yet — real collection names as quick-search tags, plus the
 * store's best sellers, so the panel is never blank on open.
 */
export function SearchSuggestions({
  categories,
  searchSuggestions,
  onNavigate,
}: {
  categories: Category[];
  searchSuggestions: Promise<SearchSuggestionsQuery | null>;
  onNavigate: () => void;
}) {
  const tags = categories.slice(0, 6);

  return (
    <div className="search-suggestions">
      {tags.length > 0 && (
        <div className="search-suggestions-section">
          <h5>Popular Search</h5>
          <div className="search-suggestions-tags">
            {tags.map((category) => (
              <Link
                key={category.id}
                to={`/collections/${category.handle}`}
                onClick={onNavigate}
                className="search-suggestion-tag"
              >
                {category.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <Await resolve={searchSuggestions}>
          {(data) => {
            const products = buildFeaturedSearchProducts(data);
            if (!products.length) return null;

            return (
              <div className="search-suggestions-section">
                <h5>Featured Products</h5>
                <div className="search-suggestions-products">
                  {products.map((product) => {
                    const price = product.priceRange.minVariantPrice;
                    const compareAt =
                      product.compareAtPriceRange?.minVariantPrice;
                    const isOnSale =
                      compareAt &&
                      Number(compareAt.amount) > Number(price.amount);

                    return (
                      <Link
                        key={product.id}
                        to={`/products/${product.handle}`}
                        onClick={onNavigate}
                        className="search-suggestion-product"
                      >
                        <span className="search-suggestion-product-img">
                          {isOnSale && (
                            <span className="search-suggestion-product-badge">
                              Sale
                            </span>
                          )}
                          {product.featuredImage && (
                            <Image
                              data={product.featuredImage}
                              alt={product.featuredImage.altText || product.title}
                              aspectRatio="1/1"
                              sizes="120px"
                              loading="lazy"
                            />
                          )}
                        </span>
                        <span className="search-suggestion-product-title">
                          {product.title}
                        </span>
                        <span className="search-suggestion-product-price">
                          <Money data={price} />
                          {isOnSale && (
                            <s>
                              <Money data={compareAt} />
                            </s>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}
