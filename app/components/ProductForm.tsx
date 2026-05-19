import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions, Money} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {useFavourites} from '~/hooks/useFavourites';

function getSwatchTone(name: string, color?: string | null) {
  const value = `${name} ${color ?? ''}`.toLowerCase();

  if (value.includes('dark walnut')) return 'product-swatch-tone-dark-walnut';
  if (value.includes('walnut')) return 'product-swatch-tone-walnut';
  if (value.includes('oak')) return 'product-swatch-tone-oak';
  if (value.includes('white') || value.includes('wash')) return 'product-swatch-tone-whitewash';
  if (value.includes('ebon') || value.includes('#2a2a2a') || value.includes('black')) return 'product-swatch-tone-ebonised';
  if (value.includes('ash')) return 'product-swatch-tone-ash';
  if (value.includes('reclaimed')) return 'product-swatch-tone-reclaimed';

  return 'product-swatch-tone-neutral';
}

export function ProductForm({
  productOptions,
  selectedVariant,
  product,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  product?: Pick<ProductFragment, 'id' | 'handle' | 'title'> & {
    featuredImage?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
  };
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const {isFavourite, toggleFavourite} = useFavourites();
  const saved = product ? isFavourite(product.id) : false;
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        const selectedValue = option.optionValues.find((v) => v.selected);

        return (
          <div className="product-opts" key={option.name}>
            <div className="product-opt-label">
              {option.name}
              {selectedValue && (
                <span className="product-opt-picked">{selectedValue.name}</span>
              )}
            </div>
            <div className="product-opt-row">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  return (
                    <Link
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      data-selected={selected ? 'true' : 'false'}
                      className={`product-optn${available ? '' : ' is-unavailable'}`}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`product-optn${available ? '' : ' is-unavailable'}`}
                      key={option.name + name}
                      data-selected={selected ? 'true' : 'false'}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      <div className="pdp-cta-row">
        <div className="pdp-atc-wrap">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              open('cart');
            }}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {selectedVariant?.availableForSale ? (
              <>
                <span>Order now</span>
                {selectedVariant.price && (
                  <span className="pdp-atc-price">
                    · <Money as="span" data={selectedVariant.price} />
                  </span>
                )}
              </>
            ) : 'Sold out'}
          </AddToCartButton>
        </div>
        <button
          className={`pdp-wish-btn${saved ? ' saved' : ''}`}
          aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
          onClick={() => {
            if (!product) return;
            toggleFavourite({
              id: product.id,
              handle: product.handle,
              title: product.title,
              image: product.featuredImage ?? undefined,
              price: selectedVariant?.price ?? {amount: '0', currencyCode: 'GBP'},
            });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return <>{name}</>;

  return (
    <>
      <span
        aria-label={name}
        className={`product-swatch ${image ? 'product-swatch-has-image' : getSwatchTone(name, color)}`}
      >
        {!!image && <img src={image} alt={name} />}
      </span>
      {name}
    </>
  );
}
