export type UnitSystem = 'imperial' | 'metric';

const CM_PER_INCH = 2.54;
const CM_PER_FOOT = 30.48;

function trimNumber(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

/**
 * Shopify option values for this store mix formats: some already carry both
 * units as "3ft (91.4cm)", some are metric-only ("15cm x 15cm x 25cm"), some
 * are imperial-only ("3 ft", `5"x4"`), and some (e.g. "Height x Depth": "3x4")
 * are bare numbers with no unit at all — those are inches by convention in
 * this catalog, unless the option name itself says otherwise (e.g. "Width x
 * Lenght (cm)"). This reformats the *display* text for the requested unit
 * system without touching the underlying Shopify option value used for
 * variant selection.
 */
export function formatMeasurement(raw: string, unit: UnitSystem, optionName = ''): string {
  // "3ft (91.4cm)" / `3"x4" (7.6x10.2cm)` — Shopify already computed both sides.
  const dualMatch = raw.match(/^(.*\S)\s*\(([^()]+)\)\s*$/);
  if (dualMatch) {
    return unit === 'imperial' ? dualMatch[1].trim() : dualMatch[2].trim();
  }

  const hasMetricTokens = /\d+(?:\.\d+)?\s*(?:cm|mm)\b/i.test(raw);
  const hasImperialTokens = /\d+(?:\.\d+)?\s*(?:ft|in\b|inches\b|")/i.test(raw);

  if (hasMetricTokens && !hasImperialTokens) {
    if (unit === 'metric') return raw;
    return raw.replace(/(\d+(?:\.\d+)?)\s*(cm|mm)\b/gi, (_match, num, u) => {
      const value = parseFloat(num);
      const inches = u.toLowerCase() === 'mm' ? value / 25.4 : value / CM_PER_INCH;
      return `${trimNumber(inches)}"`;
    });
  }

  if (hasImperialTokens && !hasMetricTokens) {
    if (unit === 'imperial') return raw;
    return raw
      .replace(/(\d+(?:\.\d+)?)\s*ft\b/gi, (_match, num) => `${trimNumber(parseFloat(num) * CM_PER_FOOT)}cm`)
      .replace(/(\d+(?:\.\d+)?)\s*(?:in\b|inches\b|")/gi, (_match, num) => `${trimNumber(parseFloat(num) * CM_PER_INCH)}cm`);
  }

  // Bare dimension strings with no unit at all, e.g. "3x4", "3 x 4 x 5".
  const isBareDimension = /^\s*\d+(?:\.\d+)?(?:\s*x\s*\d+(?:\.\d+)?)+\s*$/i.test(raw);
  if (isBareDimension) {
    const sourceIsMetric = /cm|mm/i.test(optionName);
    const nativeUnit: UnitSystem = sourceIsMetric ? 'metric' : 'imperial';
    if (unit === nativeUnit) return raw;
    const numbers = raw.match(/\d+(?:\.\d+)?/g) ?? [];
    return numbers
      .map((num) => {
        const value = parseFloat(num);
        const converted = sourceIsMetric ? value / CM_PER_INCH : value * CM_PER_INCH;
        return sourceIsMetric ? `${trimNumber(converted)}"` : `${trimNumber(converted)}cm`;
      })
      .join(' x ');
  }

  return raw;
}
