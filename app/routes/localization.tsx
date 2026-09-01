import {redirect} from 'react-router';
import type {Route} from './+types/localization';
import {HEADER_QUERY} from '~/lib/fragments';
import {
  COUNTRY_SESSION_KEY,
  LOCALIZATION_FORM_FIELDS,
  resolveCountry,
} from '~/lib/localization';

/**
 * Resource route behind the header currency switcher. It stores the chosen
 * country in the session, mirrors it onto the cart's buyer identity so checkout
 * settles in the same currency the shopper was quoted, and sends them back to
 * the page they were on.
 *
 * There is no loader-rendered UI here, so a direct visit just bounces home.
 */
export async function loader() {
  throw redirect('/');
}

export async function action({request, context}: Route.ActionArgs) {
  const {session, cart, storefront} = context;
  const formData = await request.formData();

  // Validate against what the shop actually sells to rather than trusting the
  // posted value — an unsupported market makes the Storefront API throw on
  // every subsequent query, which would break the whole site, not just this.
  const {localization} = await storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {headerMenuHandle: 'main-menu'},
  });

  const countryCode = resolveCountry(
    formData.get(LOCALIZATION_FORM_FIELDS.country),
    localization?.availableCountries ?? [],
  );

  session.set(COUNTRY_SESSION_KEY, countryCode);

  // Only touch the cart if one exists — `updateBuyerIdentity` would otherwise
  // create an empty cart just to record a country.
  if (cart.getCartId()) {
    await cart.updateBuyerIdentity({countryCode}, {country: countryCode});
  }

  // Keep the shopper where they were. Relative paths only: an absolute URL here
  // would turn the switcher into an open redirect.
  const requested = String(
    formData.get(LOCALIZATION_FORM_FIELDS.redirectTo) ?? '',
  );
  const redirectTo = requested.startsWith('/') && !requested.startsWith('//')
    ? requested
    : '/';

  return redirect(redirectTo);
}
