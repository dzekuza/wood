import {useLocation, useSubmit} from 'react-router';
import {
  activeCurrency,
  currencyOptions,
  LOCALIZATION_FORM_FIELDS,
  LOCALIZATION_ROUTE,
  type Localization,
} from '~/lib/localization';

export interface CurrencySwitcherProps {
  localization: Localization | null | undefined;
}

/**
 * Header currency control, sitting between the account and cart buttons.
 *
 * Shopify prices in whatever currency the buyer's market settles in, so this
 * posts a *country* to `routes/localization.tsx` and labels it by currency.
 * A native `<select>` keeps the keyboard and mobile behaviour Shopify shoppers
 * expect, and submitting the form on change means it still works if the click
 * lands before hydration.
 *
 * When the store has only one presentment currency there is nothing to switch
 * between, so it renders as a plain label rather than a one-item dropdown.
 */
export function CurrencySwitcher({localization}: CurrencySwitcherProps) {
  const submit = useSubmit();
  const {pathname, search} = useLocation();

  const options = currencyOptions(localization);
  const active = activeCurrency(localization);

  if (!active) return null;

  if (options.length < 2) {
    return (
      <span className="header-currency header-currency--single">
        <span className="header-currency-value">{active.currencyCode}</span>
      </span>
    );
  }

  return (
    <form
      method="post"
      action={LOCALIZATION_ROUTE}
      className="header-currency"
      onChange={(event) => {
        // `submit` returns a promise; the handler must not, or React treats it
        // as an unhandled async event handler.
        void submit(event.currentTarget);
      }}
    >
      <input
        type="hidden"
        name={LOCALIZATION_FORM_FIELDS.redirectTo}
        value={`${pathname}${search}`}
      />
      <label className="sr-only" htmlFor="header-currency-select">
        Currency
      </label>
      <select
        id="header-currency-select"
        name={LOCALIZATION_FORM_FIELDS.country}
        className="header-currency-select"
        defaultValue={active.countryCode}
      >
        {options.map((option) => (
          <option key={option.currencyCode} value={option.countryCode}>
            {option.currencyCode}
          </option>
        ))}
      </select>
      {/* Fallback for a no-JS submit; hidden once the onChange handler runs. */}
      <noscript>
        <button type="submit" className="header-currency-submit">
          Go
        </button>
      </noscript>
    </form>
  );
}
