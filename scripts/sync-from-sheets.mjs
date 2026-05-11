/**
 * Sync product prices (and optionally titles/descriptions) from a Google Sheet
 * to Shopify via the Admin GraphQL API.
 *
 * Sheet must be publicly readable (File → Share → Anyone with the link → Viewer).
 * Columns used: Handle, Title, Body (HTML), Variant SKU, Variant Price,
 *               Variant Compare At Price, Status
 *
 * Usage:
 *   node scripts/sync-from-sheets.mjs          # dry run (preview changes)
 *   node scripts/sync-from-sheets.mjs --apply  # apply changes to Shopify
 */

import { readFileSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────

const SHEET_ID = '1-pfqOs5DDdEWxQU87CFN3owluiIgpoZQ37jJYHcPQGg';
const SHEET_GID = '1731351599';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// Load from .env
const envPath = new URL('../.env', import.meta.url).pathname;
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SHOP = 'wood-123252.myshopify.com';
const ADMIN_API_VERSION = '2025-01';
// Try PRIVATE token first (shpat_ tokens are Admin API tokens for private apps)
const ADMIN_TOKEN = env.SHOPIFY_ADMIN_TOKEN || env.PRIVATE_STOREFRONT_API_TOKEN;
const ADMIN_URL = `https://${SHOP}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

const DRY_RUN = !process.argv.includes('--apply');

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fetchSheet() {
  console.log('Fetching Google Sheet...');
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  console.log(`  ${rows.length} rows loaded from sheet`);
  return rows;
}

async function fetchShopifyProducts() {
  console.log('Fetching Shopify products...');
  const allProducts = [];
  let cursor = null;

  do {
    const data = await shopifyQuery(`
      query GetProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            handle
            status
            variants(first: 10) {
              nodes {
                id
                sku
                price
                compareAtPrice
              }
            }
          }
        }
      }
    `, { cursor });

    allProducts.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);

  console.log(`  ${allProducts.length} products fetched from Shopify`);

  // Build lookup by SKU and by handle (with per-handle variant cursor for ordered matching)
  const bySku = {};
  const byHandle = {};
  for (const product of allProducts) {
    byHandle[product.handle] = { product, variants: product.variants.nodes.map(v => ({...v, productId: product.id})), cursor: 0 };
    for (const variant of product.variants.nodes) {
      if (variant.sku) bySku[variant.sku] = { product, variant: {...variant, productId: product.id} };
    }
  }
  return { bySku, byHandle };
}

async function updateVariantPrice(productId, variantId, price, compareAtPrice) {
  return shopifyQuery(`
    mutation UpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price compareAtPrice }
        userErrors { field message }
      }
    }
  `, {
    productId,
    variants: [{
      id: variantId,
      price: String(price),
      compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
    }],
  });
}

async function main() {
  console.log(DRY_RUN ? '── DRY RUN (pass --apply to write changes) ──\n' : '── APPLYING CHANGES ──\n');

  const [sheetRows, { bySku, byHandle }] = await Promise.all([fetchSheet(), fetchShopifyProducts()]);

  const changes = [];
  const missing = [];

  for (const row of sheetRows) {
    const sku = row['Variant SKU']?.trim();
    const handle = row['Handle']?.trim();
    const sheetPrice = parseFloat(row['Variant Price']);
    const sheetCompare = row['Variant Compare At Price'] ? parseFloat(row['Variant Compare At Price']) : null;

    if (isNaN(sheetPrice)) continue;

    // Match by SKU first, fall back to handle (consuming variants in order)
    let match = null;
    if (sku && bySku[sku]) {
      match = bySku[sku];
    } else if (handle && byHandle[handle]) {
      const entry = byHandle[handle];
      const variant = entry.variants[entry.cursor];
      if (variant) {
        match = { product: entry.product, variant };
        entry.cursor++;
      }
    }
    if (!match) {
      missing.push(sku || handle);
      continue;
    }

    const { variant, product } = match;
    const shopifyPrice = parseFloat(variant.price);
    const shopifyCompare = variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null;

    const priceChanged = Math.abs(shopifyPrice - sheetPrice) > 0.001;
    const compareChanged = Math.abs((shopifyCompare ?? 0) - (sheetCompare ?? 0)) > 0.001;

    if (priceChanged || compareChanged) {
      changes.push({
        sku,
        title: product.title.substring(0, 60),
        productId: variant.productId,
        variantId: variant.id,
        oldPrice: shopifyPrice,
        newPrice: sheetPrice,
        oldCompare: shopifyCompare,
        newCompare: sheetCompare,
      });
    }
  }

  if (changes.length === 0) {
    console.log('\n✓ All prices are already in sync. No changes needed.');
  } else {
    console.log(`\n${changes.length} price change(s) detected:\n`);
    for (const c of changes) {
      const compareInfo = c.oldCompare !== c.newCompare
        ? ` | compare: $${c.oldCompare ?? '-'} → $${c.newCompare ?? '-'}`
        : '';
      console.log(`  ${c.sku.padEnd(18)} "${c.title}"`);
      console.log(`    price: $${c.oldPrice} → $${c.newPrice}${compareInfo}`);
    }

    if (!DRY_RUN) {
      console.log('\nApplying updates...');
      let ok = 0, fail = 0;
      for (const c of changes) {
        try {
          await updateVariantPrice(c.productId, c.variantId, c.newPrice, c.newCompare);
          console.log(`  ✓ Updated ${c.sku}`);
          ok++;
        } catch (e) {
          console.error(`  ✗ Failed ${c.sku}: ${e.message}`);
          fail++;
        }
        await new Promise(r => setTimeout(r, 300)); // rate limit
      }
      console.log(`\nDone: ${ok} updated, ${fail} failed`);
    } else {
      console.log('\nRun with --apply to push these changes to Shopify.');
    }
  }

  if (missing.length > 0) {
    console.log(`\n⚠ ${missing.length} SKUs in sheet not found in Shopify: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
    console.log('  These are new products — import them via Shopify Admin → Products → Import.');
  }
}

main().catch(e => { console.error('\nError:', e.message); process.exit(1); });
