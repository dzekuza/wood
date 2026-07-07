/**
 * Imports reviews from CSV into Shopify product metafields (namespace: reviews, key: product_reviews).
 * Matches CSV product names to Shopify products by keyword fuzzy matching.
 * Reviews are attached to ALL products whose titles match the category keywords.
 *
 * Usage: node scripts/import-reviews.mjs [path/to/reviews.csv]
 */

import fs from 'fs';
import path from 'path';

const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const CSV_PATH = process.argv[2] || path.resolve(
  '/Users/rysardgvozdovic/Desktop/projects/wood-sheets-sync/reviews_from_pdf.csv'
);

if (!TOKEN) {
  console.error('SHOPIFY_ADMIN_TOKEN env var required');
  process.exit(1);
}

// --- CSV parsing ---
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => (row[h] = (cols[j] || '').trim()));
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; continue; }
    if (c === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

function parseRating(raw) {
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 5;
}

// --- Keyword rules: CSV product name → matcher function ---
const MATCHERS = [
  {
    names: ['floating oak shelf', 'floating shelf'],
    match: t => /floating/i.test(t) && /shelf/i.test(t) && !/mantle/i.test(t) && !/mantel/i.test(t),
  },
  {
    names: ['coat rack with shelf'],
    match: t =>
      /coat rack/i.test(t) && /shelf/i.test(t) && !/rail\b/i.test(t) && !/set of 2/i.test(t),
  },
  {
    names: ['coat rack rail'],
    match: t => /coat rack/i.test(t) && /rail/i.test(t),
  },
  {
    names: ['coat rack set of 2'],
    match: t => /coat rack/i.test(t) && /set of 2/i.test(t),
  },
  {
    names: ['fireplace beam mantel', 'fireplace beam mantle'],
    match: t => /fireplace beam mantel/i.test(t),
  },
  {
    names: ['fireplace surround'],
    match: t => /fireplace surround/i.test(t) || /fire surround/i.test(t),
  },
  {
    names: ['mantel beam', 'mantle beam'],
    match: t =>
      (/mantel beam/i.test(t) || /mantle beam/i.test(t)) &&
      !/fireplace beam/i.test(t),
  },
  {
    names: ['oak door stop'],
    match: t => /door stop/i.test(t),
  },
  {
    names: ['fireplace surround'],
    match: t => /fireplace surround/i.test(t) || /fire surround/i.test(t),
  },
];

function resolveRule(productName) {
  const lower = productName.toLowerCase().trim();
  return MATCHERS.find(r => r.names.some(n => n === lower)) || null;
}

// --- Shopify API helpers ---
async function getProducts() {
  const url = `https://${SHOP}/admin/api/2024-01/products.json?fields=id,title,handle&limit=250`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  const data = await res.json();
  return data.products || [];
}

async function getExistingReviews(productId) {
  const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields.json?namespace=reviews&key=product_reviews`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  const data = await res.json();
  const mf = (data.metafields || []).find(m => m.key === 'product_reviews');
  return mf ? { id: mf.id, reviews: JSON.parse(mf.value) } : null;
}

async function upsertReviews(productId, reviews, existingId) {
  if (existingId) {
    const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields/${existingId}.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metafield: { id: existingId, value: JSON.stringify(reviews), type: 'json' } }),
    });
    return res.json();
  } else {
    const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metafield: { namespace: 'reviews', key: 'product_reviews', value: JSON.stringify(reviews), type: 'json' },
      }),
    });
    return res.json();
  }
}

// --- Main ---
async function main() {
  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} reviews from CSV`);

  // Group reviews by CSV product name
  const byProduct = {};
  for (const row of rows) {
    const key = row.Product?.trim();
    if (!key) continue;
    if (!byProduct[key]) byProduct[key] = [];
    byProduct[key].push({
      author: row.Reviewer || 'Anonymous',
      rating: parseRating(row.Rating || '5'),
      body: row.Review || '',
      created_at: row.Date || '',
    });
  }

  const csvProducts = Object.keys(byProduct);
  console.log(`\nCSV product categories (${csvProducts.length}):`);
  csvProducts.forEach(p => console.log(`  "${p}" — ${byProduct[p].length} review(s)`));

  const shopifyProducts = await getProducts();
  console.log(`\nShopify products: ${shopifyProducts.length}`);

  // Match and import
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const csvName of csvProducts) {
    const rule = resolveRule(csvName);
    if (!rule) {
      console.warn(`\n⚠ No matcher for CSV product: "${csvName}" — skipping`);
      totalSkipped++;
      continue;
    }

    const matched = shopifyProducts.filter(p => rule.match(p.title));
    if (!matched.length) {
      console.warn(`\n⚠ No Shopify products matched for: "${csvName}"`);
      totalSkipped++;
      continue;
    }

    const newReviews = byProduct[csvName];
    console.log(`\n"${csvName}" (${newReviews.length} reviews) → ${matched.length} product(s):`);

    for (const product of matched) {
      const existing = await getExistingReviews(product.id);
      const existingReviews = existing?.reviews || [];

      // De-duplicate by author + body
      const dedupKey = r => `${r.author}|${r.body}`;
      const existingKeys = new Set(existingReviews.map(dedupKey));
      const toAdd = newReviews.filter(r => !existingKeys.has(dedupKey(r)));
      const merged = [...existingReviews, ...toAdd].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      await upsertReviews(product.id, merged, existing?.id);
      console.log(`  ✓ ${product.title.substring(0, 70)}...`);
      console.log(`    existing: ${existingReviews.length}, added: ${toAdd.length}, total: ${merged.length}`);
      totalUpdated++;
    }
  }

  console.log(`\nDone — ${totalUpdated} product(s) updated, ${totalSkipped} skipped`);
}

main().catch(err => { console.error(err); process.exit(1); });
