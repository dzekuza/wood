import {formatMeasurement} from '~/lib/units';

export type VariantOption = {name: string; value: string};

export type VariantSummary = {
  id: string;
  availableForSale: boolean;
  price: {amount: string};
  selectedOptions: VariantOption[];
};

export type OptionSummary = {name: string; optionValues: {name: string}[]};

const normalise = (text: string) =>
  text.toLowerCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim();

/**
 * Unit-proof key for an option value. Links built from the metric display
 * ("40cm - 2 Hooks") must still find the inch option ("15.7" - 2 Hooks"), so
 * both sides are converted to metric and every number is rounded before they
 * are compared (15.7" -> 39.9cm -> 40).
 */
function matchKey(raw: string, optionName: string): string {
  return normalise(formatMeasurement(raw, 'metric', optionName)).replace(
    /\d+(?:\.\d+)?/g,
    (num) => String(Math.round(parseFloat(num))),
  );
}

function priceOf(variant: VariantSummary): number {
  return parseFloat(variant.price.amount);
}

export function cheapestAvailable(
  variants: VariantSummary[],
): VariantSummary | undefined {
  return variants
    .filter((variant) => variant.availableForSale)
    .reduce<VariantSummary | undefined>(
      (best, variant) =>
        !best || priceOf(variant) < priceOf(best) ? variant : best,
      undefined,
    );
}

/** The option value a URL parameter names, whichever unit it was written in. */
function matchOptionValue(
  option: OptionSummary,
  urlValue: string,
): string | undefined {
  const wanted = normalise(urlValue);
  const exact = option.optionValues.find(
    (value) => normalise(value.name) === wanted,
  );
  if (exact) return exact.name;

  const wantedKey = matchKey(urlValue, option.name);
  return option.optionValues.find(
    (value) => matchKey(value.name, option.name) === wantedKey,
  )?.name;
}

/**
 * The options the product page opens on. A `?variant=<id>` link or option
 * parameters in the URL win when they name an available variant, in cm or
 * inches. Anything else — no parameters, an unknown or sold-out variant —
 * falls back to the cheapest available variant, so the "From" price, the order
 * button and the structured-data price are all the same figure.
 */
export function resolveSelectedOptions({
  variants,
  options,
  searchParams,
}: {
  variants: VariantSummary[];
  options: OptionSummary[];
  searchParams: URLSearchParams;
}): VariantOption[] {
  const fallback = cheapestAvailable(variants)?.selectedOptions ?? [];

  const variantParam = searchParams.get('variant');
  if (variantParam) {
    const wantedId = variantParam.split('/').pop();
    const named = variants.find((variant) => variant.id.split('/').pop() === wantedId);
    return named?.availableForSale ? named.selectedOptions : fallback;
  }

  const wanted: VariantOption[] = [];
  for (const option of options) {
    const urlValue = searchParams.get(option.name);
    if (urlValue === null) continue;
    const value = matchOptionValue(option, urlValue);
    if (value) wanted.push({name: option.name, value});
  }
  if (!wanted.length) return fallback;

  const matching = variants.filter((variant) =>
    wanted.every((pick) =>
      variant.selectedOptions.some(
        (option) => option.name === pick.name && option.value === pick.value,
      ),
    ),
  );
  return cheapestAvailable(matching)?.selectedOptions ?? fallback;
}

/** Which unit a link was written in, so the unit toggle can follow it. */
export function unitFromSearchParams(
  searchParams: URLSearchParams,
): 'metric' | 'imperial' | null {
  for (const [name, value] of searchParams) {
    if (name === 'variant') continue;
    if (/\d\s*(?:cm|mm)\b/i.test(value)) return 'metric';
    if (/\d\s*(?:"|ft\b|in\b)/i.test(value)) return 'imperial';
  }
  return null;
}
