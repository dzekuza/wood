import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useNavigate, useSearchParams} from 'react-router';
import {type MappedProductOptions, type OptimisticCartLineInput, Money} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {useFavourites} from '~/hooks/useFavourites';
import {useUnitSystem} from '~/hooks/useUnitSystem';
import {UnitToggle} from '~/components/UnitToggle';
import {formatMeasurement} from '~/lib/units';
import {isSliderOption} from '~/lib/productOptionDisplay';
import type {UpsellGroupData} from '~/lib/upsells';
import {
  getSwatchTexture,
  getSwatchTone,
  isHardwareColourOption,
} from '~/lib/swatches';

import {getStockLimit} from '~/lib/inventory';

export function ProductForm({
  productOptions,
  selectedVariant,
  product,
  lines,
  upsellGroupsData,
  selectedUpsells,
  onUpsellChange,
  quantity,
  onQuantityChange,
  sliderOptionOverrides,
  onNoneChosenChange,
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
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  /** From the product's `custom.slider_options` metafield — see [[productOptionDisplay]]. */
  sliderOptionOverrides?: string[] | null;
  /** Fires with true while the shopper hasn't picked any option yet, false once they pick one. */
  onNoneChosenChange?: (noneChosen: boolean) => void;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const {isFavourite, toggleFavourite} = useFavourites();
  const saved = product ? isFavourite(product.id) : false;
  const {unit} = useUnitSystem();
  const formRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Hydrogen pre-selects the first available variant (so price and stock still
  // resolve), but nothing is *shown* as selected until the shopper picks it.
  // An option counts as chosen once the shopper picks a value, or when the
  // page was opened on a link that already names the options (the first
  // render, before useSelectedOptionInUrlParam fills them).
  const openedWithOptions = useRef(
    productOptions.some((o) => searchParams.has(o.name)),
  ).current;
  // On mobile the CTA row docks to the viewport. It is portalled to <body>
  // because the PDP's reveal animations leave transformed ancestors, which
  // would turn `position: fixed` into "fixed to that ancestor".
  const [dockTarget, setDockTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setDockTarget(mq.matches ? document.body : null);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const markTouched = (name: string) =>
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));

  const isChosen = (name: string) => openedWithOptions || touched.has(name);

  const pendingOption = openedWithOptions
    ? undefined
    : productOptions.find(
        (o) =>
          o.optionValues.length > 1 &&
          !touched.has(o.name) &&
          !(o.name === 'Title' && o.optionValues.length === 1),
      );

  const noneChosen = !openedWithOptions && touched.size === 0;
  useEffect(() => {
    onNoneChosenChange?.(noneChosen);
  }, [noneChosen, onNoneChosenChange]);

  /** Send the shopper to the first unpicked option instead of ordering. */
  const handleOrderClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!pendingOption) {
      open('cart');
      return;
    }
    event.preventDefault();
    const group = Array.from(
      formRef.current?.querySelectorAll<HTMLElement>('[data-option]') ?? [],
    ).find((el) => el.dataset.option === pendingOption.name);
    if (!group) return;
    group.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'center',
    });
    group.classList.remove('is-prompted');
    void group.offsetWidth;
    group.classList.add('is-prompted');
  };

  const upsellSurcharge = upsellGroupsData.reduce((sum, {group, options}) => {
    const selectedKey = selectedUpsells[group.id];
    const selectedOption = options.find((o) => o.option.key === selectedKey);
    const amount = selectedOption?.variant ? parseFloat(selectedOption.variant.price.amount) : 0;
    return sum + amount;
  }, 0);

  const stockLimit = getStockLimit(selectedVariant);
  const atStockLimit = stockLimit !== null && quantity >= stockLimit;

  const totalPrice = selectedVariant?.price
    ? {
        amount: ((parseFloat(selectedVariant.price.amount) + upsellSurcharge) * quantity).toFixed(2),
        currencyCode: selectedVariant.price.currencyCode,
      }
    : undefined;

  return (
    <div className="product-form" ref={formRef}>
      <div className="product-opts product-opts-unit">
        <div className="product-opt-label">
          Units
          <UnitToggle />
        </div>
      </div>
      {productOptions.map((option) => {
        const chosen = isChosen(option.name);
        const selectedValue = chosen
          ? option.optionValues.find((v) => v.selected)
          : undefined;

        // A product with no variants still has one placeholder option,
        // "Title", whose single value is "Default Title" — or whatever it was
        // renamed to (e.g. "Default"). It describes nothing, so skip it.
        if (option.name === 'Title' && option.optionValues.length === 1) {
          return null;
        }

        // Single-value option: show as read-only info label, not interactive
        if (option.optionValues.length === 1) {
          return (
            <div className="product-opts" key={option.name}>
              <div className="product-opt-label">
                {option.name}
                <span className="product-opt-picked">{formatMeasurement(option.optionValues[0].name, unit, option.name)}</span>
              </div>
            </div>
          );
        }

        const optionNameLower = option.name.toLowerCase();

        // Colour-type options always render as swatches, falling back to a
        // name-based tone (see getSwatchTone) when Shopify hasn't returned
        // real swatch.color/swatch.image data for the linked option yet.
        const isColourOption = /colou?r/.test(optionNameLower);

        // "Hook Colour" and friends are colour options, but their values are
        // metals — swatch chips yes, wood-grain crops no.
        const isTimberColourOption =
          isColourOption && !isHardwareColourOption(option.name);

        const hasSwatches =
          isColourOption ||
          option.optionValues.some(
            (v) => v.swatch?.color || v.swatch?.image?.previewImage?.url,
          );

        // Options named in SLIDER_OPTION_NAMES (or the product's
        // custom.slider_options metafield, when set) render as a
        // slider/progress bar; every other non-swatch option renders as a
        // dropdown below.
        if (!hasSwatches && isSliderOption(option.name, sliderOptionOverrides)) {
          const values = option.optionValues;
          const selectedIndex = selectedValue ? values.indexOf(selectedValue) : -1;
          const percent =
            values.length > 1 && selectedIndex >= 0
              ? (selectedIndex / (values.length - 1)) * 100
              : 0;

          const selectValue = (value: (typeof values)[number]) => {
            if (!value.exists) return;
            markTouched(option.name);
            if (value.selected) return;
            const to = value.isDifferentProduct
              ? `/products/${value.handle}?${value.variantUriQuery}`
              : `?${value.variantUriQuery}`;
            void navigate(to, {replace: true, preventScrollReset: true});
          };

          return (
            <div className="product-opts" data-option={option.name} key={option.name}>
              <div className="product-opt-label">
                {option.name}
                {selectedValue && (
                  <span className="product-opt-picked">{formatMeasurement(selectedValue.name, unit, option.name)}</span>
                )}
              </div>
              <div className="product-opt-progress">
                <div className="product-opt-progress-track">
                  <div
                    className="product-opt-progress-fill"
                    style={{width: `${percent}%`}}
                  />
                  {values.map((value, i) => {
                    const stepPercent =
                      values.length > 1 ? (i / (values.length - 1)) * 100 : 0;
                    return (
                      <button
                        key={option.name + value.name}
                        type="button"
                        className={`product-opt-progress-step${selectedValue === value ? ' is-selected' : ''}${!value.exists ? ' is-unavailable' : ''}`}
                        style={{left: `${stepPercent}%`}}
                        disabled={!value.exists}
                        aria-label={value.name}
                        onClick={() => selectValue(value)}
                      />
                    );
                  })}
                </div>
                <div className="product-opt-progress-labels">
                  {values.map((value) => (
                    <button
                      key={option.name + value.name}
                      type="button"
                      className={`product-opt-progress-label${selectedValue === value ? ' is-selected' : ''}`}
                      disabled={!value.exists}
                      onClick={() => selectValue(value)}
                    >
                      {formatMeasurement(value.name, unit, option.name)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // Other size-like options (no swatches, e.g. Height x Depth, Width) render as a dropdown
        if (!hasSwatches) {
          return (
            <div className="product-opts" data-option={option.name} key={option.name}>
              <div className="product-opt-label">
                {option.name}
                {selectedValue && (
                  <span className="product-opt-picked">{formatMeasurement(selectedValue.name, unit, option.name)}</span>
                )}
              </div>
              <select
                className="product-opt-select"
                value={selectedValue?.name ?? ''}
                onChange={(e) => {
                  const value = option.optionValues.find((v) => v.name === e.target.value);
                  if (!value) return;
                  markTouched(option.name);
                  if (value.selected) return;
                  const to = value.isDifferentProduct
                    ? `/products/${value.handle}?${value.variantUriQuery}`
                    : `?${value.variantUriQuery}`;
                  void navigate(to, {replace: true, preventScrollReset: true});
                }}
              >
                {!selectedValue && (
                  <option value="" disabled>
                    Select {option.name.toLowerCase()}
                  </option>
                )}
                {option.optionValues.map((value) => (
                  <option key={option.name + value.name} value={value.name} disabled={!value.exists}>
                    {formatMeasurement(value.name, unit, option.name)}
                    {value.available ? formatOptionPrice(value.firstSelectableVariant?.price) : ' (unavailable)'}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div className="product-opts" data-option={option.name} key={option.name}>
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
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;
                const selected = selectedValue === value;

                if (isDifferentProduct) {
                  return (
                    <Link
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      onClick={() => markTouched(option.name)}
                      to={`/products/${handle}?${variantUriQuery}`}
                      data-selected={selected ? 'true' : 'false'}
                      className={`product-optn${available ? '' : ' is-unavailable'}`}
                    >
                      <ProductOptionSwatch
                        swatch={swatch}
                        name={name}
                        forceSwatch={isColourOption}
                        fallbackImage={isTimberColourOption ? getSwatchTexture(name) : undefined}
                      />
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
                        markTouched(option.name);
                        if (!value.selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch
                        swatch={swatch}
                        name={name}
                        forceSwatch={isColourOption}
                        fallbackImage={isTimberColourOption ? getSwatchTexture(name) : undefined}
                      />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      {upsellGroupsData.map(({group, options}) => {
        const selectedUpsellOption = options.find(
          (o) => o.option.key === selectedUpsells[group.id],
        )?.option;
        return (
        <div className="product-opts" key={group.id}>
          <div className="product-opt-label">
            {group.label}
            <span className="product-opt-picked">
              {selectedUpsellOption && formatMeasurement(selectedUpsellOption.label, unit, group.label)}
            </span>
          </div>
          <div className="product-opt-row">
            {options.map(({option, variant}) => {
              const image = variant?.image;
              const surcharge =
                option.variantTitle && variant && parseFloat(variant.price.amount) > 0
                  ? variant.price
                  : null;

              // Same swatch-tile treatment as an image-backed colour variant
              // option (e.g. Oil Colour) — an upsell option becomes one the
              // moment its own variant carries an image in Shopify Admin, no
              // separate opt-in needed.
              if (image) {
                return (
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
                    <span className="product-swatch-wrap">
                      <span className="product-swatch product-swatch-has-image">
                        <img src={image.url} alt={image.altText ?? option.label} />
                      </span>
                    </span>
                    <SwatchZoom src={image.url} label={option.label} />
                    <span className="product-swatch-name">
                      {formatMeasurement(option.label, unit, group.label)}
                    </span>
                    {surcharge && (
                      <span className="product-opt-surcharge-badge">
                        +<Money as="span" data={surcharge} />
                      </span>
                    )}
                  </button>
                );
              }

              return (
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
                  {formatMeasurement(option.label, unit, group.label)}
                  {option.variantTitle ? (
                    // A surcharge variant priced at 0 adds nothing, so "+£0.00"
                    // is noise on every option — only a real uplift is shown.
                    surcharge && (
                      <span className="product-opt-surcharge">
                        +<Money as="span" data={surcharge} />
                      </span>
                    )
                  ) : (
                    <span className="product-opt-surcharge">Free</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}

      <div className="pdp-cta-dock">
      {renderCtaRow()}
      </div>
      {stockLimit !== null && stockLimit > 0 && stockLimit <= 5 && (
        <p className="pdp-stock-note">
          {atStockLimit ? `Only ${stockLimit} in stock` : `${stockLimit} left in stock`}
        </p>
      )}
    </div>
  );

  function renderCtaRow() {
    const row = (
      <div className={`pdp-cta-row${dockTarget ? ' is-docked' : ''}`}>
        <div className="pdp-qty">
          <button
            type="button"
            className="pdp-qty-btn"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          >
            −
          </button>
          <span className="pdp-qty-val">{quantity}</span>
          <button
            type="button"
            className="pdp-qty-btn"
            aria-label="Increase quantity"
            disabled={atStockLimit}
            onClick={() =>
              onQuantityChange(
                stockLimit === null ? quantity + 1 : Math.min(stockLimit, quantity + 1),
              )
            }
          >
            +
          </button>
        </div>
        <div className="pdp-atc-wrap">
          <AddToCartButton
            className="btn btn-primary btn-pill pdp-atc-btn"
            disabled={!selectedVariant || !selectedVariant.availableForSale || quantity > (stockLimit ?? Infinity)}
            onClick={handleOrderClick}
            lines={lines}
          >
            {selectedVariant?.availableForSale ? (
              <>
                <span>Order now</span>
                {totalPrice && (
                  <span className="pdp-atc-price">
                    · <Money as="span" data={totalPrice} />
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
    );
    return dockTarget ? createPortal(row, dockTarget) : row;
  }
}

/** " · from £99.00" suffix for a dropdown entry (price of the value's first variant, which also varies with other options); empty when unpriced. */
function formatOptionPrice(price?: {amount: string; currencyCode: string} | null) {
  if (!price) return '';
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: price.currencyCode,
  }).format(parseFloat(price.amount));
  return ` · from ${formatted}`;
}

function ProductOptionSwatch({
  swatch,
  name,
  forceSwatch,
  fallbackImage,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
  forceSwatch?: boolean;
  fallbackImage?: string;
}) {
  // Real Shopify swatch data first, then the local texture-crop image (see
  // getSwatchTexture) for forced colour options, then a name-based flat tone.
  const image = swatch?.image?.previewImage?.url ?? fallbackImage;
  const color = swatch?.color;

  if (!image && !color && !forceSwatch) return <>{name}</>;

  return (
    <>
      <span className="product-swatch-wrap">
        <span
          aria-label={name}
          className={`product-swatch ${image ? 'product-swatch-has-image' : getSwatchTone(name, color)}`}
        >
          {!!image && <img src={image} alt={name} />}
        </span>
        {/* A tile that already shows the grain full-size has nothing to
            preview, so the hover tooltip is only for flat tone chips. */}
        {!image && (
          <span className="product-swatch-tooltip" role="tooltip">
            <span
              className={`product-swatch-tooltip-preview ${getSwatchTone(name, color)}`}
            />
            <span className="product-swatch-tooltip-label">{name}</span>
          </span>
        )}
      </span>
      {!!image && <SwatchZoom src={image} label={name} />}
      <span className="product-swatch-name">{name}</span>
    </>
  );
}

/**
 * Enlarged photo shown above a photo swatch tile on desktop hover, so a grain
 * or hook finish can be judged at a useful size. Hidden on touch devices,
 * where a tap selects the option instead.
 */
function SwatchZoom({src, label}: {src: string; label: string}) {
  return (
    <span className="product-swatch-zoom" aria-hidden="true">
      <img src={src} alt="" loading="lazy" />
      <span className="product-swatch-zoom-label">{label}</span>
    </span>
  );
}
