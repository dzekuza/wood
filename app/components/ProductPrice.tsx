import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
  from = false,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  /** Prefix the price with "From" — the shopper hasn't picked every option yet. */
  from?: boolean;
}) {
  return (
    <div aria-label="Price" className="product-price" role="group">
      {from && price ? (
        <div className="product-price-from">
          <span className="product-price-eyebrow">From</span>
          <Money data={price} />
        </div>
      ) : compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <Money data={price} /> : null}
          <s>
            <Money data={compareAtPrice} />
          </s>
        </div>
      ) : price ? (
        <Money data={price} />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
