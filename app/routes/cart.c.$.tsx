import {redirect} from 'react-router';
import type {Route} from './+types/cart.c.$';

/**
 * Hands Shopify checkout links (`/cart/c/<token>?key=…`) off to Shopify.
 *
 * The Storefront API builds `cart.checkoutUrl` on the storefront's own domain,
 * but that domain is served by this Hydrogen app, which has no checkout — so
 * without this route every "Checkout" click 404s. The checkout itself lives on
 * the Online Store, reachable on the `*.myshopify.com` handle.
 *
 * The lasting fix is a checkout subdomain (e.g. `checkout.craftwoodfurniture.co.uk`)
 * pointed at the Online Store in Settings → Domains; Shopify then builds
 * checkout URLs on that subdomain and they never reach this route.
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const {env} = context;
  const shopDomain = env.SHOPIFY_ADMIN_SHOP_DOMAIN || env.PUBLIC_STORE_DOMAIN;
  const url = new URL(request.url);

  // Redirecting to our own host would loop forever.
  if (!shopDomain || shopDomain === url.host) {
    throw new Response('Checkout is unavailable', {status: 404});
  }

  return redirect(`https://${shopDomain}${url.pathname}${url.search}`, 302);
}
