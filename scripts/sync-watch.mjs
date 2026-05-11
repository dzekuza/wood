/**
 * Watches the Google Sheet and syncs prices to Shopify every N seconds.
 * Usage: node scripts/sync-watch.mjs         (default: 10s)
 *        node scripts/sync-watch.mjs 30       (every 30s)
 */

import { readFileSync } from 'fs';

const INTERVAL_SEC = parseInt(process.argv[2]) || 10;
const SHEET_ID = '1-pfqOs5DDdEWxQU87CFN3owluiIgpoZQ37jJYHcPQGg';
const SHEET_GID = '1731351599';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const envPath = new URL('../.env', import.meta.url).pathname;
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SHOP = 'wood-123252.myshopify.com';
const ADMIN_TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const ADMIN_URL = `https://${SHOP}/admin/api/2025-01/graphql.json`;

function parseCSV(text) {
  const rawLines = text.split('\n');
  const headers = splitCSVLine(rawLines[0]);
  const rows = [];
  let i = 1;
  while (i < rawLines.length) {
    let line = rawLines[i];
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < rawLines.length) {
      i++; line += '\n' + rawLines[i];
    }
    const vals = splitCSVLine(line);
    rows.push(Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? ''])));
    i++;
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let inQuote = false, current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuote) { inQuote = true; continue; }
    if (ch === '"' && inQuote) {
      if (line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = false;
      continue;
    }
    if (ch === ',' && !inQuote) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

async function shopifyQuery(query, variables = {}) {
  const res = await fetch(ADMIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ADMIN_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchSheet() {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return parseCSV(await res.text());
}

async function fetchShopifyProducts() {
  const allProducts = [];
  let cursor = null;
  do {
    const data = await shopifyQuery(`
      query($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id handle title
            variants(first: 10) { nodes { id sku price compareAtPrice } }
          }
        }
      }
    `, { cursor });
    allProducts.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);

  const bySku = {}, byHandle = {};
  for (const p of allProducts) {
    byHandle[p.handle] = { product: p, variants: p.variants.nodes, cursor: 0 };
    for (const v of p.variants.nodes) {
      if (v.sku) bySku[v.sku] = { product: p, variant: v };
    }
  }
  return { bySku, byHandle };
}

async function sync() {
  const [sheetRows, { bySku, byHandle }] = await Promise.all([fetchSheet(), fetchShopifyProducts()]);

  const changes = [];
  for (const row of sheetRows) {
    const sku = row['Variant SKU']?.trim();
    const handle = row['Handle']?.trim();
    const sheetPrice = parseFloat(row['Variant Price']);
    const sheetCompare = row['Variant Compare At Price'] ? parseFloat(row['Variant Compare At Price']) : null;
    if (isNaN(sheetPrice)) continue;

    let match = null;
    if (sku && bySku[sku]) {
      match = bySku[sku];
    } else if (handle && byHandle[handle]) {
      const entry = byHandle[handle];
      const variant = entry.variants[entry.cursor];
      if (variant) { match = { product: entry.product, variant }; entry.cursor++; }
    }
    if (!match) continue;

    const { variant, product } = match;
    const priceChanged = Math.abs(parseFloat(variant.price) - sheetPrice) > 0.001;
    const compareChanged = Math.abs((parseFloat(variant.compareAtPrice) || 0) - (sheetCompare || 0)) > 0.001;

    if (priceChanged || compareChanged) {
      changes.push({ variantId: variant.id, price: sheetPrice, compareAtPrice: sheetCompare,
        label: `${product.handle} $${variant.price} → $${sheetPrice}` });
    }
  }

  if (changes.length === 0) return 0;

  for (const c of changes) {
    await shopifyQuery(`
      mutation($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant { id }
          userErrors { message }
        }
      }
    `, { input: { id: c.variantId, price: String(c.price), compareAtPrice: c.compareAtPrice ? String(c.compareAtPrice) : null } });
    await new Promise(r => setTimeout(r, 200));
  }

  return changes.length;
}

// ── Main loop ─────────────────────────────────────────────────────────────────

console.log(`Watching Google Sheet every ${INTERVAL_SEC}s — press Ctrl+C to stop\n`);

let ticking = false;

async function tick() {
  if (ticking) return;
  ticking = true;
  const ts = new Date().toLocaleTimeString();
  try {
    const updated = await sync();
    if (updated > 0) {
      console.log(`[${ts}] ✓ ${updated} price(s) updated`);
    } else {
      process.stdout.write(`[${ts}] in sync\r`);
    }
  } catch (e) {
    console.error(`[${ts}] ✗ ${e.message}`);
  }
  ticking = false;
}

tick();
setInterval(tick, INTERVAL_SEC * 1000);
