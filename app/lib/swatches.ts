/**
 * Matches an option value name (e.g. "Clear", "Old Oak Oil", "Clear + Black")
 * to one of the six named finishes, for both getSwatchTexture below and
 * (elsewhere) matching a Shopify oil-colour value back to a base finish.
 * Longest names first so "Light Grey" isn't swallowed by the "Grey" check.
 */
const FINISH_MATCH_ORDER = ['Light Grey', 'Old Oak', 'Clear', 'Dark', 'Grey', 'White'];

function matchFinish(rawValue: string): string | null {
  const value = rawValue.trim().toLowerCase();
  for (const finish of FINISH_MATCH_ORDER) {
    const needle = finish.toLowerCase();
    if (value === needle || value.startsWith(`${needle} `) || value.startsWith(`${needle}+`)) {
      return finish;
    }
  }
  return null;
}

/**
 * The same wood-grain close-ups used in the homepage "Our Textures" section
 * (public/demo/texture-*.jpg), reassigned here by visual tone to the six
 * named finishes so PDP colour swatches show a real close-up rather than a
 * flat chip, without depending on Shopify's swatch data (see decisions-log
 * ADR-0012 — ProductOptionValue.swatch doesn't reliably resolve).
 */
const FINISH_TEXTURE_IMAGES: Record<string, string> = {
  'Clear': '/demo/texture-cube-blocks.jpg',
  'Old Oak': '/demo/texture-door-stops.jpg',
  'Dark': '/demo/texture-mantel-beams.jpg',
  'Grey': '/demo/texture-shelves.jpg',
  'Light Grey': '/demo/texture-coat-racks.jpg',
  'White': '/demo/texture-surround-mantels.jpg',
};

export function getSwatchTexture(name: string): string | undefined {
  const finish = matchFinish(name);
  return finish ? FINISH_TEXTURE_IMAGES[finish] : undefined;
}

/**
 * Maps a variant option's name/color to one of the `.product-swatch-tone-*`
 * CSS classes in app.css, for options with no swatch image (a flat color chip).
 * Shared between ProductForm (PDP option picker) and ProductItem (card grid)
 * so both render swatches identically.
 */
export function getSwatchTone(name: string, color?: string | null) {
  const value = `${name} ${color ?? ''}`.toLowerCase();

  if (value.includes('dark walnut')) return 'product-swatch-tone-dark-walnut';
  if (value.includes('walnut')) return 'product-swatch-tone-walnut';
  if (value.includes('oak')) return 'product-swatch-tone-oak';
  if (value.includes('white') || value.includes('wash')) return 'product-swatch-tone-whitewash';
  if (value.includes('ebon') || value.includes('#2a2a2a') || value.includes('black')) return 'product-swatch-tone-ebonised';
  if (value.includes('ash')) return 'product-swatch-tone-ash';
  if (value.includes('reclaimed')) return 'product-swatch-tone-reclaimed';

  return 'product-swatch-tone-neutral';
}
