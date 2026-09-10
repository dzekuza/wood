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

export function isSliderOption(optionName: string, overrides?: string[] | null): boolean {
  const list = overrides && overrides.length > 0 ? overrides : SLIDER_OPTION_NAMES;
  const normalized = optionName.trim().toLowerCase();
  return list.some((name) => name.trim().toLowerCase() === normalized);
}
