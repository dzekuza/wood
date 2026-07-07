import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions, type OptimisticCartLineInput, Money} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {useFavourites} from '~/hooks/useFavourites';
import type {UpsellGroupData} from '~/lib/upsells';

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
  lines,
  upsellGroupsData,
  selectedUpsells,
  onUpsellChange,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  product?: Pick<ProductFragment, 'id' | 'handle' | 'title'> & {
    featuredImage?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
  };
  lines: Array<OptimisticCartLineInput>;
  upsellGroupsData: UpsellGroupData[];
  selectedUpsells: Record<string, string>;
  onUpsellChange: (groupId: string, optionKey: string) => void;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const {isFavourite, toggleFavourite} = useFavourites();
  const saved = product ? isFavourite(product.id) : false;
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        const selectedValue = option.optionValues.find((v) => v.selected);

        // Single-value option: show as read-only info label, not interactive
        if (option.optionValues.length === 1) {
          return (
            <div className="product-opts" key={option.name}>
              <div className="product-opt-label">
                {option.name}
                <span className="product-opt-picked">{option.optionValues[0].name}</span>
              </div>
            </div>
          );
        }

        const hasSwatches = option.optionValues.some(
          (v) => v.swatch?.color || v.swatch?.image?.previewImage?.url,
        );

        // Size-like options (no swatches, e.g. Height x Depth, Length, Width) render as a dropdown
        if (!hasSwatches) {
          return (
            <div className="product-opts" key={option.name}>
              <div className="product-opt-label">
                {option.name}
                {selectedValue && (
                  <span className="product-opt-picked">{selectedValue.name}</span>
                )}
              </div>
              <select
                className="product-opt-select"
                value={selectedValue?.name ?? ''}
                onChange={(e) => {
                  const value = option.optionValues.find((v) => v.name === e.target.value);
                  if (!value || value.selected) return;
                  const to = value.isDifferentProduct
                    ? `/products/${value.handle}?${value.variantUriQuery}`
                    : `?${value.variantUriQuery}`;
                  void navigate(to, {replace: true, preventScrollReset: true});
                }}
              >
                {option.optionValues.map((value) => (
                  <option key={option.name + value.name} value={value.name} disabled={!value.exists}>
                    {value.name}{value.available ? '' : ' (unavailable)'}
                  </option>
                ))}
              </select>
            </div>
          );
        }

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
      {upsellGroupsData.map(({group, options}) => (
        <div className="product-opts" key={group.id}>
          <div className="product-opt-label">
            {group.label}
            <span className="product-opt-picked">
              {options.find((o) => o.option.key === selectedUpsells[group.id])
                ?.option.label}
            </span>
          </div>
          <div className="product-opt-row">
            {options.map(({option, variant}) => (
              <button
                key={option.key}
                type="button"
                className="product-optn"
                data-selected={
                  selectedUpsells[group.id] === option.key ? 'true' : 'false'
                }
                disabled={Boolean(option.variantTitle) && !variant}
                onClick={() => onUpsellChange(group.id, option.key)}
              >
                {option.label}
                {option.variantTitle ? (
                  variant && (
                    <span className="product-opt-surcharge">
                      +<Money as="span" data={variant.price} />
                    </span>
                  )
                ) : (
                  <span className="product-opt-surcharge">Free</span>
                )}
              </button>
            ))}
          </div>
          <p className="product-opt-note">
            {group.label} is added as a separate line — your total price will
            be calculated at cart.
          </p>
        </div>
      ))}

      <div className="pdp-cta-row">
        <div className="pdp-atc-wrap">
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              open('cart');
            }}
            lines={lines}
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
