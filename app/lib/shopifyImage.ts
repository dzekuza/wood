/** Shopify CDN resizing. Only `cdn.shopify.com` URLs accept `width`; anything
 *  else (local `/demo/*` fallbacks) is returned untouched. */
function isShopifyCdn(url: string): boolean {
  return url.startsWith('https://cdn.shopify.com/');
}

export function shopifyImageUrl(url: string, width: number): string {
  if (!isShopifyCdn(url)) return url;
  const parsed = new URL(url);
  parsed.searchParams.set('width', String(width));
  return parsed.toString();
}

/** `srcset` string for a Shopify CDN image, or undefined for other hosts. */
export function shopifySrcSet(
  url: string,
  widths: readonly number[],
): string | undefined {
  if (!isShopifyCdn(url)) return undefined;
  return widths.map((w) => `${shopifyImageUrl(url, w)} ${w}w`).join(', ');
}
