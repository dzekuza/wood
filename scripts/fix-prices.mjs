import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const SHOP = 'wood-123252.myshopify.com';
const TOKEN = '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';
const API = `https://${SHOP}/admin/api/2024-01/graphql.json`;

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

async function main() {
  const etsyProducts = JSON.parse(readFileSync(join(__dir, 'etsy-data/products.json'), 'utf-8'));
  const priceMap = Object.fromEntries(etsyProducts.map(p => [p.listing_id, p.price]));

  // Fetch all products with their variant IDs, tags, and prices
  const data = await gql(`{
    products(first: 100) {
      nodes {
        id
        title
        tags
        variants(first: 1) { nodes { id price } }
      }
    }
  }`);

  const products = data.products.nodes;
  let fixed = 0, skipped = 0;

  for (const product of products) {
    const variantNode = product.variants.nodes[0];
    if (!variantNode) continue;

    const currentPrice = parseFloat(variantNode.price);
    if (currentPrice > 0) {
      skipped++;
      continue;
    }

    // Find listing_id from tags (format: etsy-XXXXXXXXX)
    const etsyTag = product.tags.find(t => t.startsWith('etsy-'));
    if (!etsyTag) {
      console.log(`  NO ETSY TAG: ${product.title.slice(0, 60)}`);
      continue;
    }

    const listingId = etsyTag.replace('etsy-', '');
    const price = priceMap[listingId];

    if (!price) {
      console.log(`  PRICE NOT FOUND for listing ${listingId}: ${product.title.slice(0, 50)}`);
      continue;
    }

    // Update variant price using productVariantsBulkUpdate
    const updateData = await gql(`
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price }
          userErrors { field message }
        }
      }
    `, {
      productId: product.id,
      variants: [{ id: variantNode.id, price: parseFloat(price).toFixed(2) }],
    });

    const errs = updateData.productVariantsBulkUpdate.userErrors;
    if (errs.length) {
      console.log(`  ERROR [${listingId}]: ${errs.map(e => e.message).join(', ')}`);
    } else {
      const newPrice = updateData.productVariantsBulkUpdate.productVariants[0].price;
      console.log(`  FIXED [${listingId}] $${newPrice}: ${product.title.slice(0, 50)}`);
      fixed++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone. Fixed: ${fixed}, Already correct: ${skipped}`);
}

main().catch(console.error);
