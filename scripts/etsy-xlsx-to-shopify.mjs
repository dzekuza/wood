/**
 * etsy-xlsx-to-shopify.mjs
 *
 * Converts an Etsy Listings Download (.xlsx) into a Shopify product import CSV.
 *
 * Excel columns handled:
 *   TITLE, DESCRIPTION, PRICE, CURRENCY_CODE, QUANTITY, TAGS, MATERIALS,
 *   IMAGE1–IMAGE10,
 *   VARIATION 1 TYPE / NAME / VALUES,
 *   VARIATION 2 TYPE / NAME / VALUES,
 *   SKU
 *
 * Usage:
 *   node scripts/etsy-xlsx-to-shopify.mjs [input.xlsx] [output.csv]
 *
 * Defaults:
 *   input  → scripts/etsy-data/EtsyListingsDownload_FIXED.xlsx
 *   output → scripts/etsy-data/shopify-products.csv
 */

import { writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// ─── Paths ────────────────────────────────────────────────────────────────────
const xlsxPath =
  process.argv[2] || 'scripts/etsy-data/EtsyListingsDownload_FIXED.xlsx';
const outputPath =
  process.argv[3] || 'scripts/etsy-data/shopify-products.csv';

// ─── Load workbook ────────────────────────────────────────────────────────────
const workbook = XLSX.readFile(xlsxPath);
const ws = workbook.Sheets[workbook.SheetNames[0]];
const etsy = XLSX.utils.sheet_to_json(ws, { defval: '' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toHandle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-$/, '');
}

const handleCount = {};
function uniqueHandle(base) {
  if (!handleCount[base]) { handleCount[base] = 1; return base; }
  handleCount[base]++;
  return `${base}-${handleCount[base]}`;
}

/**
 * Parse a comma-separated Etsy variation value string.
 *
 * Challenges:
 *  • European decimal commas inside measurements, e.g. "7,6x10,2cm"
 *  • Values that use decimal commas directly, e.g. "3,5ft"
 *
 * Strategy:
 *  1. Normalise digit-comma-digit sequences (European decimals → dots)
 *     e.g.  "3,5ft (91,4cm)"  →  "3.5ft (91.4cm)"
 *  2. Split on remaining commas (which are now only list separators)
 */
function parseVariationValues(raw) {
  if (!raw || !raw.trim()) return [];
  // Step 1: replace digit,digit → digit.digit (European decimal)
  const normalised = raw.replace(/(\d),(\d)/g, '$1.$2');
  // Step 2: split on commas
  return normalised
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function getType(title) {
  const t = title.toLowerCase();
  if (t.includes('coat rack') || t.includes('entryway')) return 'Coat Rack';
  if (t.includes('shelf') || t.includes('shelv') || t.includes('shelving')) return 'Shelf';
  if (
    t.includes('mantel') || t.includes('mantle') ||
    t.includes('beam')  || t.includes('lintel') ||
    t.includes('mantlepiece')
  ) return 'Fireplace Mantel';
  if (t.includes('fire surround') || t.includes('fireplace surround')) return 'Fireplace Surround';
  if (t.includes('door stop')) return 'Door Stop';
  if (t.includes('cube') || t.includes('bedside') || t.includes('nightstand') || t.includes('table')) return 'Side Table';
  return 'Wood Furniture';
}

/** Escape a single CSV cell value */
function esc(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ─── Shopify CSV column layout ─────────────────────────────────────────────────
const HEADERS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Status',
];

const EMPTY = Object.fromEntries(HEADERS.map((h) => [h, '']));

/** Build one CSV row from a plain object keyed by header names */
function buildRow(fields) {
  const obj = { ...EMPTY, ...fields };
  return HEADERS.map((h) => esc(obj[h])).join(',');
}

// ─── Main conversion ──────────────────────────────────────────────────────────
const rows = [HEADERS.join(',')];
let totalProducts = 0;
let totalVariants = 0;
const warnings = [];

for (const p of etsy) {
  const title = String(p['TITLE'] || '').trim();
  if (!title) continue;

  const handle       = uniqueHandle(toHandle(title));
  const price        = parseFloat(p['PRICE']) || 0;
  const compareAt    = (price * 1.2).toFixed(2);
  const qty          = p['QUANTITY'] || 10;
  const rawTags      = String(p['TAGS'] || '').replace(/_/g, ' ');
  const materials    = String(p['MATERIALS'] || '').trim();
  const baseSku      = String(p['SKU'] || handle.substring(0, 10)).toUpperCase();
  const type         = getType(title);

  // Tags: combine Etsy tags + materials
  const tagsArr = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
  if (materials) tagsArr.push(...materials.split(',').map((m) => m.trim()));
  const tags = [...new Set(tagsArr)].join(', ');

  // Description (preserve Etsy HTML line breaks)
  const bodyHtml = `<p>${String(p['DESCRIPTION'] || '').replace(/\n/g, '<br>')}</p>`;

  // Images (IMAGE1 … IMAGE10) — skip blanks
  const images = [];
  for (let i = 1; i <= 10; i++) {
    const src = String(p[`IMAGE${i}`] || '').trim();
    if (src) images.push(src);
  }

  // Variation values
  const opt1Name   = String(p['VARIATION 1 NAME'] || '').trim();
  const opt1Values = parseVariationValues(String(p['VARIATION 1 VALUES'] || ''));
  const opt2Name   = String(p['VARIATION 2 NAME'] || '').trim();
  const opt2Values = parseVariationValues(String(p['VARIATION 2 VALUES'] || ''));

  // Build variant combination list  [{opt1, opt2, sku}]
  let variants = [];
  if (opt1Values.length > 0) {
    const v2 = opt2Values.length > 0 ? opt2Values : [''];
    let idx = 0;
    for (const v1 of opt1Values) {
      for (const v2val of v2) {
        const variantSku = v2val
          ? `${baseSku}-${idx}`
          : `${baseSku}-${idx}`;
        variants.push({ opt1: v1, opt2: v2val, sku: variantSku });
        idx++;
      }
    }
  } else {
    // No variants — single "Default Title" variant
    variants = [{ opt1: 'Default Title', opt2: '', sku: baseSku }];
  }

  const variantCount = variants.length;
  if (variantCount > 100) {
    warnings.push(
      `⚠  "${title.substring(0, 50)}" has ${variantCount} variant combinations ` +
      `(${opt1Values.length} × ${opt2Values.length}). Shopify standard limit is 100 — ` +
      `all ${variantCount} rows are written; import will cap at 100 on standard plans.`,
    );
  }

  // ── Emit rows ──────────────────────────────────────────────────────────────
  // Strategy:
  //   • Row 0     : full product fields + variant[0] + image[0]
  //   • Row 1..N-1: handle only + variant[i] + image[i] if available
  //   • After all variants: handle + remaining images

  const o1Name = opt1Values.length > 0 ? opt1Name || 'Option 1' : 'Title';
  const o2Name = opt2Values.length > 0 ? opt2Name || 'Option 2' : '';

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const img = images[i] || '';
    const imgPos = img ? String(i + 1) : '';

    const isFirst = i === 0;

    rows.push(buildRow({
      'Handle':                     handle,
      'Title':                      isFirst ? title : '',
      'Body (HTML)':                isFirst ? bodyHtml : '',
      'Vendor':                     isFirst ? 'CraftWoodFurniture' : '',
      'Product Category':           isFirst ? 'Home & Garden > Decor > Decorative Accents' : '',
      'Type':                       isFirst ? type : '',
      'Tags':                       isFirst ? tags : '',
      'Published':                  isFirst ? 'TRUE' : '',
      'Option1 Name':               isFirst ? o1Name : '',
      'Option1 Value':              v.opt1,
      'Option2 Name':               isFirst ? o2Name : '',
      'Option2 Value':              v.opt2,
      'Variant SKU':                v.sku,
      'Variant Grams':              '0',
      'Variant Inventory Tracker':  'shopify',
      'Variant Inventory Qty':      String(qty),
      'Variant Inventory Policy':   'deny',
      'Variant Fulfillment Service':'manual',
      'Variant Price':              price.toFixed(2),
      'Variant Compare At Price':   compareAt,
      'Variant Requires Shipping':  'TRUE',
      'Variant Taxable':            'TRUE',
      'Image Src':                  img,
      'Image Position':             imgPos,
      'Image Alt Text':             img ? title.substring(0, 100) : '',
      'Status':                     isFirst ? 'active' : '',
    }));
  }

  // Remaining images (beyond variants)
  for (let i = variants.length; i < images.length; i++) {
    rows.push(buildRow({
      'Handle':         handle,
      'Image Src':      images[i],
      'Image Position': String(i + 1),
      'Image Alt Text': title.substring(0, 100),
    }));
  }

  totalProducts++;
  totalVariants += variants.length;
}

// ─── Write output ─────────────────────────────────────────────────────────────
writeFileSync(outputPath, rows.join('\n'));

console.log(`✓ Converted ${totalProducts} products → ${rows.length - 1} CSV rows`);
console.log(`  Variants total: ${totalVariants}`);
console.log(`  Output: ${outputPath}`);

if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log(' ', w));
  console.log(
    '\nNote: Products exceeding 100 variants can be imported via the Shopify Admin API',
    'or by splitting into multiple product listings.',
  );
}
