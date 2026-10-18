/**
 * Stock cap for a variant, from the Storefront API's `quantityAvailable`.
 * `null` means "no cap": inventory isn't tracked, the variant is sold on
 * backorder (`currentlyNotInStock`), or the field wasn't returned.
 */
export function getStockLimit(
  variant:
    | {quantityAvailable?: number | null; currentlyNotInStock?: boolean | null}
    | null
    | undefined,
): number | null {
  if (!variant || variant.currentlyNotInStock) return null;
  const qty = variant.quantityAvailable;
  return typeof qty === 'number' ? Math.max(0, qty) : null;
}
