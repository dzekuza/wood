/**
 * Non-swatch product options default to a dropdown. An option renders as the
 * slider/progress control instead when its exact name (case-insensitive,
 * trimmed) is listed — reserved for options where a handful of evenly-spaced
 * length values makes a linear scrubber genuinely useful (e.g. "Length").
 *
 * The list is merchant-editable per product via the `custom.slider_options`
 * metafield (list of single-line text, set on the product edit page in
 * Shopify Admin — see `scripts/setup-slider-options-metafield.mjs`). When a
 * product has that metafield set, it fully replaces this fallback; when
 * absent or empty, SLIDER_OPTION_NAMES is used.
 *
 * This used to be a substring match on "length"/"lenght", which also caught
 * compound dimension options like "Mantle Beam (Front Side x Top Side x
 * Lenght)" — those have per-value strings like "12.7cm x 10.2cm x 121.9cm"
 * that don't map to a single scrubbable axis, so they read as broken
 * sliders. Add an option's name here (or to the product's metafield)
 * explicitly instead of relying on the word appearing anywhere in it.
 */
export const SLIDER_OPTION_NAMES = ['Length'];

/**
 * Case-insensitive, trimmed, and blind to the catalog's common "Lenght"
 * misspelling: options were renamed "Beam Lenght" → "Beam Length" while their
 * metafields still said "Beam Lenght", silently turning sliders into dropdowns.
 */
function normalizeOptionName(name: string): string {
  return name.trim().toLowerCase().replace(/lenght/g, 'length');
}

export function isSliderOption(optionName: string, overrides?: string[] | null): boolean {
  const list = overrides && overrides.length > 0 ? overrides : SLIDER_OPTION_NAMES;
  const normalized = normalizeOptionName(optionName);
  return list.some((name) => normalizeOptionName(name) === normalized);
}

/**
 * Smallest-to-largest order for a size-like option value, e.g. "15cm x 60cm"
 * or `4"x4"`: every number in the string, compared left to right (depth
 * before length, so "20cm x 60cm" still sorts before "15cm x 70cm"). Shopify
 * Admin's option-value order is otherwise whatever they were created in,
 * which is not necessarily smallest-first — see the "depth x length"
 * dropdown on console products.
 */
export function compareBySize(a: string, b: string): number {
  const numsA = a.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const numsB = b.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!numsA.length || !numsB.length) return 0;
  for (let i = 0; i < Math.max(numsA.length, numsB.length); i++) {
    const diff = (numsA[i] ?? 0) - (numsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
