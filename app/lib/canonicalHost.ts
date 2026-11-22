/**
 * The storefront is served on `www.` only. The bare domain must never return
 * 200: it duplicates every URL and splits Search Console impressions between
 * two hosts. Only this exact host is redirected, so localhost, preview URLs and
 * `*.myshopify.dev` are untouched.
 */
const APEX_HOST = 'craftwoodfurniture.co.uk';
const CANONICAL_ORIGIN = 'https://www.craftwoodfurniture.co.uk';

/**
 * Returns a permanent redirect to the canonical www URL when the request came
 * in on the bare domain, otherwise `null`. Path and query string are kept.
 * 301 for GET/HEAD, 308 for everything else so the method is preserved.
 */
export function redirectToCanonicalHost(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== APEX_HOST) return null;

  const isSafeMethod = request.method === 'GET' || request.method === 'HEAD';
  return new Response(null, {
    status: isSafeMethod ? 301 : 308,
    headers: {Location: `${CANONICAL_ORIGIN}${url.pathname}${url.search}`},
  });
}
