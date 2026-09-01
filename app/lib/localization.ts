import type {CountryCode} from '@shopify/hydrogen/storefront-api-types';
import type {HeaderQuery} from 'storefrontapi.generated';

/**
 * Currency on a Shopify storefront is not chosen directly — it follows the
 * buyer's country through the Storefront API's `@inContext` directive. So the
 * "currency switcher" is really a country switcher that we label by currency,
 * which is the part a shopper cares about.
 *
 * The chosen country lives in the session (see `COUNTRY_SESSION_KEY`), is read
 * back in `lib/context.ts` when the Storefront client is created, and is
 * mirrored onto the cart's buyer identity so checkout charges the same currency
 * the shopper was quoted.
 */

/** Session key holding the shopper's chosen country. */
export const COUNTRY_SESSION_KEY = 'countryCode';

/** Used until the shopper picks something — the shop trades primarily in the UK. */
export const DEFAULT_COUNTRY: CountryCode = 'GB';

export const LOCALIZATION_ROUTE = '/localization';

/** Form field names shared by the switcher and its action. */
export const LOCALIZATION_FORM_FIELDS = {
  country: 'countryCode',
  redirectTo: 'redirectTo',
} as const;

export type Localization = NonNullable<HeaderQuery['localization']>;

export interface CurrencyOption {
  /** The country whose market this currency comes from. */
  countryCode: CountryCode;
  countryName: string;
  currencyCode: string;
  symbol: string;
}

/**
 * One entry per *currency*, not per country. Shopify markets often map many
 * countries onto one currency (this shop's GB and LT markets both settle in
 * EUR); listing every country would show the shopper the same currency twice.
 * The first country offering a currency wins, which keeps the order stable.
 */
export function currencyOptions(
  localization: Localization | null | undefined,
): CurrencyOption[] {
  const seen = new Set<string>();
  const options: CurrencyOption[] = [];

  for (const country of localization?.availableCountries ?? []) {
    const currencyCode = country.currency.isoCode;
    if (seen.has(currencyCode)) continue;
    seen.add(currencyCode);
    options.push({
      countryCode: country.isoCode,
      countryName: country.name,
      currencyCode,
      symbol: country.currency.symbol,
    });
  }

  return options;
}

/** The currency the storefront is currently pricing in. */
export function activeCurrency(
  localization: Localization | null | undefined,
): CurrencyOption | null {
  const country = localization?.country;
  if (!country) return null;

  return {
    countryCode: country.isoCode,
    countryName: country.name,
    currencyCode: country.currency.isoCode,
    symbol: country.currency.symbol,
  };
}

/**
 * Narrow a raw form value to a country the shop actually sells to. Anything
 * else (a stale bookmark, a hand-crafted POST) falls back to the default rather
 * than being handed to the Storefront API, which would error on an unsupported
 * market.
 */
export function resolveCountry(
  value: FormDataEntryValue | string | null | undefined,
  available: Localization['availableCountries'],
): CountryCode {
  const candidate = String(value ?? '').toUpperCase();
  const match = available.find((country) => country.isoCode === candidate);
  return match ? match.isoCode : DEFAULT_COUNTRY;
}
