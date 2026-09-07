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
 * Hardware options ("Hook Colour", "Bracket Colour", …) are colour options
 * too, but their values name a metal, not a timber finish — so they must not
 * fall back to a wood-grain crop (a "White" hook would otherwise show the
 * white-oil grain). They render as flat metal chips from getSwatchTone.
 */
export function isHardwareColourOption(optionName: string): boolean {
  return /hook|handle|hardware|bracket|fixing|knob|hinge/i.test(optionName);
}

/**
 * Maps a variant option's name/color to one of the `.product-swatch-tone-*`
 * CSS classes in app.css, for options with no swatch image (a flat color chip).
 * Shared between ProductForm (PDP option picker) and ProductItem (card grid)
 * so both render swatches identically.
 */
export function getSwatchTone(name: string, color?: string | null) {
  const value = `${name} ${color ?? ''}`.toLowerCase();

  // Metal finishes first — a "Black" or "White" hook is a painted metal chip,
  // not the ebonised/whitewash timber tone those words mean on a wood option.
  if (value.includes('antique brass') || value.includes('aged brass')) return 'product-swatch-tone-antique-brass';
  if (value.includes('brass') || value.includes('gold')) return 'product-swatch-tone-brass';
  if (value.includes('copper') || value.includes('bronze')) return 'product-swatch-tone-copper';
  if (value.includes('chrome') || value.includes('nickel') || value.includes('stainless') || value.includes('silver') || value.includes('polished')) return 'product-swatch-tone-chrome';
  if (value.includes('pewter') || value.includes('graphite') || value.includes('gunmetal') || value.includes('anthracite')) return 'product-swatch-tone-pewter';

  if (value.includes('dark walnut')) return 'product-swatch-tone-dark-walnut';
  if (value.includes('walnut')) return 'product-swatch-tone-walnut';
  if (value.includes('oak')) return 'product-swatch-tone-oak';
  if (value.includes('white') || value.includes('wash')) return 'product-swatch-tone-whitewash';
  if (value.includes('ebon') || value.includes('#2a2a2a') || value.includes('black')) return 'product-swatch-tone-ebonised';
  if (value.includes('ash')) return 'product-swatch-tone-ash';
  if (value.includes('reclaimed')) return 'product-swatch-tone-reclaimed';

  return 'product-swatch-tone-neutral';
}
