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
