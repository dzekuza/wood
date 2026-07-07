#!/usr/bin/env node
/**
 * Imports products from a Shopify-format CSV into wood-123252.myshopify.com
 * via the Admin REST API. Handles multi-line HTML cells and skips part-2 placeholders.
 *
 * Usage: node scripts/import-products.mjs [path/to/file.csv]
 */

import fs from 'fs';
import path from 'path';

const SHOP_DOMAIN = 'wood-123252.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');
// Numeric publication ID for "Wood Headless" channel
const PUBLICATION_ID = '342742139222';

const API_VERSION = '2025-01';
const BASE_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;

const CSV_PATH =
  process.argv[2] ||
  path.resolve(
    process.env.HOME,
    'Downloads/shopify-ready-v2 - shopify-ready-v2.csv',
  );

// ── Proper RFC 4180 CSV parser (handles quoted newlines) ─────────────────────

function parseCSV(content) {
  const rows = [];
  let headers = null;
  let pos = 0;

  function readField() {
    if (content[pos] === '"') {
      // Quoted field
      pos++; // skip opening quote
      let field = '';
      while (pos < content.length) {
        if (content[pos] === '"') {
          if (content[pos + 1] === '"') {
            field += '"';
            pos += 2;
          } else {
            pos++; // skip closing quote
            break;
          }
        } else {
          field += content[pos++];
        }
      }
      return field;
    } else {
      // Unquoted field
      let field = '';
      while (pos < content.length && content[pos] !== ',' && content[pos] !== '\n' && content[pos] !== '\r') {
        field += content[pos++];
      }
      return field;
    }
  }

  while (pos < content.length) {
    const fields = [];

    while (true) {
      fields.push(readField());
      if (pos >= content.length || content[pos] === '\n' || content[pos] === '\r') {
        // End of row
        if (content[pos] === '\r') pos++; // \r\n
        if (content[pos] === '\n') pos++;
        break;
      }
      if (content[pos] === ',') {
        pos++; // next field
      }
    }

    if (!headers) {
      headers = fields;
    } else {
      // Skip completely empty rows
      if (fields.every((f) => !f.trim())) continue;
      const row = {};
      headers.forEach((h, i) => (row[h] = fields[i] ?? ''));
      rows.push(row);
    }
  }

  return rows;
}

// ── Group CSV rows by handle ──────────────────────────────────────────────────

function groupByHandle(rows) {
  const groups = new Map();
  for (const row of rows) {
    const h = row['Handle'];
    if (!h) continue;
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h).push(row);
  }
  return groups;
}

// ── Build product payload ─────────────────────────────────────────────────────

function buildProduct(handle, rows) {
  // Find the title row (first row with a title)
  const titleRow = rows.find((r) => r['Title']?.trim());
  if (!titleRow) return null;

  // Strip -part-1 suffix for cleaner URLs
  const cleanHandle = handle.replace(/-part-\d+$/, '');

  // Collect all images (deduplicated, in order)
  const seenImgUrls = new Set();
  const images = [];
  let imgPos = 1;
  for (const row of rows) {
    const src = row['Image Src']?.trim();
    if (src && !seenImgUrls.has(src)) {
      seenImgUrls.add(src);
      images.push({
        src,
        position: imgPos++,
        alt: row['Image Alt Text']?.trim() || titleRow['Title'],
      });
    }
  }

  // Determine option names (first non-empty value across all rows)
  const option1Name = rows.find((r) => r['Option1 Name']?.trim())?.['Option1 Name']?.trim();
  const option2Name = rows.find((r) => r['Option2 Name']?.trim())?.['Option2 Name']?.trim();

  const options = [];
  if (option1Name) options.push({ name: option1Name });
  if (option2Name) options.push({ name: option2Name });

  // Build variants — only rows that have a price or at least one option value
  const variants = [];
  const seenVariantKeys = new Set();

  for (const row of rows) {
    const price = row['Variant Price']?.trim();
    const opt1 = row['Option1 Value']?.trim();
    const opt2 = row['Option2 Value']?.trim();

    if (!price && !opt1 && !opt2) continue;

    // Deduplicate variants by option combo
    const key = `${opt1}|${opt2}`;
    if (seenVariantKeys.has(key)) continue;
    seenVariantKeys.add(key);

    const variant = {
      price: price || '0',
      sku: row['Variant SKU']?.trim() || '',
      taxable: row['Variant Taxable']?.trim().toLowerCase() !== 'false',
      requires_shipping: row['Variant Requires Shipping']?.trim().toLowerCase() !== 'false',
      fulfillment_service: row['Variant Fulfillment Service']?.trim() || 'manual',
      inventory_management: row['Variant Inventory Tracker']?.trim() || null,
      inventory_policy: row['Variant Inventory Policy']?.trim() || 'deny',
    };

    const grams = parseInt(row['Variant Grams'], 10);
    if (!isNaN(grams)) variant.grams = grams;

    if (opt1 && option1Name) variant.option1 = opt1;
    if (opt2 && option2Name) variant.option2 = opt2;

    variants.push(variant);
  }

  const product = {
    title: titleRow['Title'].trim(),
    body_html: titleRow['Body (HTML)']?.trim() || '',
    vendor: titleRow['Vendor']?.trim() || 'CraftWoodFurniture',
    tags: titleRow['Tags']?.trim() || '',
    handle: cleanHandle,
    status: (titleRow['Status']?.trim() || 'active').toLowerCase(),
  };

  if (options.length) product.options = options;
  if (variants.length) product.variants = variants;
  if (images.length) product.images = images;

  return product;
}

// ── Shopify API helpers ───────────────────────────────────────────────────────

async function shopifyFetch(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

  // Respect rate limits: bucket is 40 calls, refills at 2/s
  const callLimitHeader = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (callLimitHeader) {
    const [used, max] = callLimitHeader.split('/').map(Number);
    if (used >= max - 5) await sleep(2000);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} → ${res.status}: ${text.slice(0, 400)}`);
  }

  return res.json();
}

async function publishToChannel(productId) {
  // Publish to the "Wood Headless" Hydrogen storefront publication
  await shopifyFetch(
    `/products/${productId}/publications.json`,
    'POST',
    { publication: { publication_id: PUBLICATION_ID } },
  ).catch((e) => {
    // Non-fatal — product already created; log but continue
    console.log(`    (publish warning: ${e.message.slice(0, 80)})`);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading CSV: ${CSV_PATH}\n`);
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} data rows`);

  const groups = groupByHandle(rows);
  console.log(`Found ${groups.size} unique handles`);

  // Skip part-2 and higher — they're empty placeholders created when a product
  // exceeds 100 variants and gets split across multiple CSV segments
  const toImport = [...groups.entries()].filter(
    ([handle]) => !/\-part-[2-9]\d*$/.test(handle),
  );

  console.log(`Importing ${toImport.length} products...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const [handle, productRows] of toImport) {
    const payload = buildProduct(handle, productRows);

    if (!payload) {
      console.log(`  SKIP ${handle.slice(0, 60)} — no title row`);
      skipped++;
      continue;
    }

    const displayTitle = payload.title.slice(0, 60);
    process.stdout.write(
      `  [${created + failed + skipped + 1}/${toImport.length}] "${displayTitle}"... `,
    );

    try {
      const data = await shopifyFetch('/products.json', 'POST', { product: payload });
      const id = data.product?.id;
      const variantCount = data.product?.variants?.length ?? 0;
      console.log(`✓ id=${id} (${variantCount} variants)`);

      if (id) await publishToChannel(id);

      created++;
      await sleep(600); // ~1.6 req/s, well within the 2 req/s refill rate
    } catch (err) {
      console.log(`✗`);
      console.error(`    Error: ${err.message.slice(0, 200)}`);
      failed++;
      errors.push({ handle, title: payload.title, error: err.message });
      await sleep(600);
    }
  }

  console.log(`\n── Summary ─────────────────────────`);
  console.log(`Created:  ${created}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  if (errors.length) {
    console.log('\nFailed products:');
    errors.forEach((e) =>
      console.log(`  • ${e.title.slice(0, 50)}: ${e.error.slice(0, 120)}`),
    );
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
