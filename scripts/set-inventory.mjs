#!/usr/bin/env node
/**
 * Sets inventory_quantity to 10 for every variant across all products.
 * Requires SHOPIFY_ADMIN_TOKEN env var.
 */

const SHOP_DOMAIN = 'wood-123252.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');

const BASE_URL = `https://${SHOP_DOMAIN}/admin/api/2025-01`;
const TARGET_QTY = 10;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shopifyPut(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const limit = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (limit) {
    const [used, max] = limit.split('/').map(Number);
    if (used >= max - 5) await sleep(2000);
  }
  if (!res.ok) throw new Error(`PUT ${endpoint} → ${res.status}`);
  return res.json();
}

async function getAllProducts() {
  const products = [];
  let url = `/products.json?limit=50&fields=id,title,variants`;
  while (url) {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);

    const link = res.headers.get('Link') ?? '';
    const data = await res.json();
    if (!data.products?.length) break;
    products.push(...data.products);

    // Follow "next" link if present
    const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
    if (nextMatch) {
      url = nextMatch[1].replace(`https://${SHOP_DOMAIN}/admin/api/2025-01`, '');
    } else {
      url = null;
    }
  }
  return products;
}

async function main() {
  console.log('Fetching all products...');
  const products = await getAllProducts();
  console.log(`Found ${products.length} products\n`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    const variants = product.variants ?? [];
    console.log(`  ${product.title.slice(0, 60)} — ${variants.length} variants`);

    for (const variant of variants) {
      if (variant.inventory_quantity === TARGET_QTY) {
        updated++;
        continue;
      }
      try {
        await shopifyPut(`/variants/${variant.id}.json`, {
          variant: { id: variant.id, inventory_quantity: TARGET_QTY },
        });
        updated++;
        await sleep(120); // ~8 req/s, safe within 40-call bucket
      } catch (err) {
        console.error(`    ✗ variant ${variant.id}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`Updated: ${updated} variants`);
  console.log(`Failed:  ${failed} variants`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
