#!/usr/bin/env node
/**
 * Reads IMAGE1–IMAGE10 from the Etsy CSV and attaches all of them to
 * the matching Shopify products (matched by normalised title).
 *
 * Usage:
 *   node scripts/add-all-images.mjs
 *   node scripts/add-all-images.mjs --dry-run   (preview only, no uploads)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const SHOP  = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');
const API   = `https://${SHOP}/admin/api/2024-01/graphql.json`;

// Pre-extracted by: python3 scripts/extract-images-json.py
const JSON_PATH = join(__dir, 'etsy-data/images.json');

// ── helpers ──────────────────────────────────────────────────────────────────

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Lower-case, remove punctuation, collapse spaces, strip trailing "- part N" */
function normalise(title) {
  return title
    .toLowerCase()
    .replace(/\s*-\s*part\s*\d+\s*$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


// ── fetch all Shopify products (paginated) ────────────────────────────────────

async function fetchAllProducts() {
  const products = [];
  let cursor = null;

  do {
    const data = await gql(`
      query ($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            media(first: 50) {
              nodes {
                ... on MediaImage {
                  id
                  image { url }
                }
              }
            }
          }
        }
      }
    `, { cursor });

    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);

  return products;
}

// ── attach a single image ─────────────────────────────────────────────────────

async function attachImage(productId, imageUrl, altText) {
  const data = await gql(`
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage { id image { url } }
        }
        mediaUserErrors { field message }
      }
    }
  `, {
    productId,
    media: [{ originalSource: imageUrl, mediaContentType: 'IMAGE', alt: altText }],
  });
  const errs = data.productCreateMedia.mediaUserErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join(', '));
  return data.productCreateMedia.media[0];
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('[DRY RUN — no images will be uploaded]\n');

  // 1. Load pre-extracted JSON → map normalised title → image URL array
  const csvRows = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  const csvMap = new Map();
  for (const row of csvRows) {
    csvMap.set(normalise(row.title), { title: row.title, images: row.images });
  }
  console.log(`CSV: ${csvMap.size} unique products with images\n`);

  // 2. Fetch Shopify products
  console.log('Fetching Shopify products…');
  const shopifyProducts = await fetchAllProducts();
  console.log(`Shopify: ${shopifyProducts.length} products\n`);

  let totalAdded = 0, totalSkipped = 0, totalFailed = 0, unmatched = 0;

  // 3. For each Shopify product, find CSV match and attach missing images
  for (const product of shopifyProducts) {
    const key = normalise(product.title);
    const csvEntry = csvMap.get(key);

    if (!csvEntry) {
      console.log(`  NO MATCH: ${product.title.slice(0, 70)}`);
      unmatched++;
      continue;
    }

    const entry = csvEntry;
    const currentCount = product.media.nodes.length;
    const targetCount  = entry.images.length;

    if (currentCount >= targetCount) {
      console.log(`  SKIP (${currentCount}/${targetCount} imgs): ${product.title.slice(0, 60)}`);
      totalSkipped++;
      continue;
    }

    const missing = entry.images.slice(currentCount); // images not yet uploaded (by index)
    console.log(`  UPLOAD ${missing.length} imgs (has ${currentCount}, need ${targetCount}): ${product.title.slice(0, 55)}`);

    if (DRY_RUN) { totalAdded += missing.length; continue; }

    let added = 0;
    for (const url of missing) {
      try {
        await attachImage(product.id, url, entry.title);
        added++;
        process.stdout.write('    .');
      } catch (e) {
        process.stdout.write('\n');
        console.log(`    FAIL: ${url.slice(0, 60)} — ${e.message.slice(0, 80)}`);
        totalFailed++;
      }
      await sleep(500); // respect rate limit
    }
    process.stdout.write('\n');
    totalAdded += added;
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Added:     ${totalAdded}`);
  console.log(`Skipped:   ${totalSkipped} (already complete)`);
  console.log(`Failed:    ${totalFailed}`);
  console.log(`Unmatched: ${unmatched}`);
}

main().catch(console.error);
