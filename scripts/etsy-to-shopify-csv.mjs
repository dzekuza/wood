import { readFileSync, writeFileSync } from 'fs';

const products = JSON.parse(readFileSync('scripts/etsy-data/products.json', 'utf-8'));

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

function getType(title) {
  const t = title.toLowerCase();
  if (t.includes('coat rack') || t.includes('entryway')) return 'Coat Rack';
  if (t.includes('shelf') || t.includes('shelv') || t.includes('shelving')) return 'Shelf';
  if (t.includes('mantel') || t.includes('mantle') || t.includes('beam') || t.includes('lintel') || t.includes('mantlepiece')) return 'Fireplace Mantel';
  if (t.includes('fire surround') || t.includes('fireplace surround')) return 'Fireplace Surround';
  if (t.includes('door stop')) return 'Door Stop';
  if (t.includes('cube') || t.includes('bedside') || t.includes('nightstand') || t.includes('table')) return 'Side Table';
  return 'Wood Furniture';
}

function getTags(title) {
  const t = title.toLowerCase();
  const tags = ['solid oak', 'handmade', 'wood furniture'];
  if (t.includes('coat rack')) tags.push('coat rack', 'entryway', 'hooks');
  if (t.includes('shelf') || t.includes('shelv')) tags.push('shelf', 'floating shelf', 'wall mounted');
  if (t.includes('mantel') || t.includes('mantle') || t.includes('beam')) tags.push('mantel beam', 'fireplace', 'log burner');
  if (t.includes('fire surround')) tags.push('fireplace surround', 'fire surround');
  if (t.includes('door stop')) tags.push('door stop', 'rustic', 'gift');
  if (t.includes('rustic')) tags.push('rustic');
  if (t.includes('cast iron')) tags.push('cast iron hooks');
  if (t.includes('oiled')) tags.push('oiled oak');
  if (t.includes('bespoke') || t.includes('custom')) tags.push('custom size', 'bespoke');
  if (t.includes('free shipping') || t.includes('free fixings')) tags.push('free fixings');
  return [...new Set(tags)].join(', ');
}

function getDescription(title, type) {
  const typeDescriptions = {
    'Coat Rack': 'Handcrafted from solid oak with cast iron hooks. Wall mounted, ready to install. Perfect for hallways and entryways.',
    'Shelf': 'Solid oak floating shelf, oiled and ready to install. Pre-drilled with fixings included. Available in custom sizes.',
    'Fireplace Mantel': 'Solid oak mantel beam, pre-drilled with free fixings included. Oiled finish, ready to fit. Available in all sizes.',
    'Fireplace Surround': 'Handcrafted solid oak fireplace surround. Custom sizes available. Pre-drilled with fixings included.',
    'Door Stop': 'Solid rustic oak door stop with twisted jute rope. Handmade. A perfect housewarming gift.',
    'Side Table': 'Bespoke solid oak cube, handcrafted to order. Ideal as a bedside table, coffee table, or lamp stand.',
    'Wood Furniture': 'Handcrafted solid oak furniture. Oiled finish, ready to use.',
  };
  return typeDescriptions[type] || title;
}

// Deduplicate handles
const handleCount = {};
function uniqueHandle(base) {
  if (!handleCount[base]) { handleCount[base] = 1; return base; }
  handleCount[base]++;
  return `${base}-${handleCount[base]}`;
}

// Shopify CSV columns
const headers = [
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

function esc(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const rows = [headers.join(',')];

products.forEach((p) => {
  const type = getType(p.title);
  const handle = uniqueHandle(toHandle(p.title));
  const sku = `CWF-${p.listing_id}`;
  const description = `<p>${getDescription(p.title, type)}</p>`;
  const tags = getTags(p.title);
  const compareAt = (parseFloat(p.price) * 1.2).toFixed(2); // 20% higher as compare-at

  const row = [
    handle,
    p.title,
    description,
    'CraftWoodFurniture',
    'Home & Garden > Decor > Decorative Accents',
    type,
    tags,
    'TRUE',
    'Title',
    'Default Title',
    sku,
    '0',
    'shopify',
    '10',
    'deny',
    'manual',
    p.price,
    compareAt,
    'TRUE',
    'TRUE',
    p.image_url,
    '1',
    p.title.substring(0, 100),
    'active',
  ];

  rows.push(row.map(esc).join(','));
});

const csv = rows.join('\n');
writeFileSync('scripts/etsy-data/shopify-products.csv', csv);

console.log(`✓ Generated ${products.length} product rows`);
console.log('  → scripts/etsy-data/shopify-products.csv');
console.log('\nSample row:');
console.log(rows[1].substring(0, 120) + '...');
