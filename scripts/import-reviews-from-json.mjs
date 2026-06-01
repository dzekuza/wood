/**
 * Re-imports all Etsy reviews (with images) from etsy-data/reviews.json into
 * Shopify product metafields (namespace: reviews, key: product_reviews).
 *
 * Matches each Etsy listing to Shopify products using the same keyword rules
 * as import-reviews.mjs. Replaces existing metafield content so images are included.
 *
 * Usage: SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/import-reviews-from-json.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!TOKEN) {
  console.error('SHOPIFY_ADMIN_TOKEN env var required');
  process.exit(1);
}

const JSON_PATH =
  process.argv[2] ||
  path.resolve(__dirname, 'etsy-data/reviews.json');

// Keyword matchers — applied to both Etsy listing titles and Shopify product titles.
// Etsy titles are SEO-stuffed (e.g. "coat rack with shelf" listings also include the word
// "rail" as a keyword), so Etsy matchers use tighter phrases where needed.
const MATCHERS = [
  {
    label: 'floating shelf',
    matchEtsy: t => /floating/i.test(t) && /shelf/i.test(t) && !/mantle/i.test(t) && !/mantel/i.test(t),
    matchShopify: t => /floating/i.test(t) && /shelf/i.test(t) && !/mantle/i.test(t) && !/mantel/i.test(t),
  },
  // "SET of 2" must be checked before "coat rack with shelf" — some set-of-2 listings also say "with shelf"
  {
    label: 'coat rack set of 2',
    matchEtsy: t => /coat rack/i.test(t) && (/set of 2/i.test(t) || /\(2 pcs\)/i.test(t) || /\(set of 2\)/i.test(t)),
    matchShopify: t => /coat rack/i.test(t) && /set of 2/i.test(t),
  },
  // Etsy's standalone "Coat Rack Rail" product uses the phrase "Coat Rack Rail" in the title name itself
  {
    label: 'coat rack rail',
    matchEtsy: t => /coat rack rail/i.test(t) && !/with shelf/i.test(t),
    matchShopify: t => /coat rack/i.test(t) && /rail/i.test(t) && !/with shelf/i.test(t),
  },
  {
    label: 'coat rack with shelf',
    matchEtsy: t => /coat rack/i.test(t) && /shelf/i.test(t) && !/coat rack rail/i.test(t) && !/set of 2/i.test(t) && !/\(2 pcs\)/i.test(t),
    matchShopify: t => /coat rack/i.test(t) && /shelf/i.test(t) && !/rail\b/i.test(t) && !/set of 2/i.test(t),
  },
  {
    label: 'fireplace beam mantel',
    matchEtsy: t => /fireplace beam mantel/i.test(t) || /fireplace beam mantle/i.test(t),
    matchShopify: t => /fireplace beam mantel/i.test(t) || /fireplace beam mantle/i.test(t),
  },
  {
    label: 'fireplace surround',
    matchEtsy: t => /fireplace surround/i.test(t) || /fire surround/i.test(t),
    matchShopify: t => /fireplace surround/i.test(t) || /fire surround/i.test(t),
  },
  {
    label: 'mantel beam',
    matchEtsy: t => (/mantel beam/i.test(t) || /mantle beam/i.test(t)) && !/fireplace beam/i.test(t) && !/corbel/i.test(t),
    matchShopify: t => (/mantel beam/i.test(t) || /mantle beam/i.test(t)) && !/fireplace beam/i.test(t) && !/corbel/i.test(t),
  },
  {
    label: 'mantel beam with corbels',
    matchEtsy: t => /corbel/i.test(t) && (/mantel/i.test(t) || /mantle/i.test(t)),
    matchShopify: t => /corbel/i.test(t) && (/mantel/i.test(t) || /mantle/i.test(t)),
  },
  {
    label: 'floating mantle shelf',
    matchEtsy: t => /floating/i.test(t) && (/mantle shelf/i.test(t) || /mantel shelf/i.test(t)),
    matchShopify: t => /floating/i.test(t) && (/mantle shelf/i.test(t) || /mantel shelf/i.test(t)),
  },
  {
    label: 'door stop',
    matchEtsy: t => /door stop/i.test(t),
    matchShopify: t => /door stop/i.test(t),
  },
  {
    label: 'oak cube block',
    matchEtsy: t => /cube/i.test(t) || /bedside/i.test(t),
    matchShopify: t => /cube/i.test(t) || /bedside/i.test(t),
  },
];

// --- Shopify API helpers ---

async function getProducts() {
  const url = `https://${SHOP}/admin/api/2024-01/products.json?fields=id,title,handle&limit=250`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  const data = await res.json();
  return data.products || [];
}

async function getExistingMetafield(productId) {
  const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields.json?namespace=reviews&key=product_reviews`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  const data = await res.json();
  const mf = (data.metafields || []).find(m => m.key === 'product_reviews');
  return mf ? { id: mf.id, reviews: JSON.parse(mf.value) } : null;
}

async function upsertReviews(productId, reviews, existingId) {
  if (existingId) {
    const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields/${existingId}.json`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metafield: { id: existingId, value: JSON.stringify(reviews), type: 'json' } }),
    });
  } else {
    const url = `https://${SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
    await fetch(url, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metafield: { namespace: 'reviews', key: 'product_reviews', value: JSON.stringify(reviews), type: 'json' },
      }),
    });
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Main ---

async function main() {
  const listings = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Loaded ${listings.length} listings from ${JSON_PATH}\n`);

  // Group reviews by matcher label, merging across listings that hit the same rule
  const byLabel = new Map();

  for (const listing of listings) {
    if (!listing.reviews?.length) continue;
    const rule = MATCHERS.find(m => m.matchEtsy(listing.title));
    if (!rule) {
      console.warn(`⚠ No matcher for: "${listing.title.slice(0, 70)}"`);
      continue;
    }
    if (!byLabel.has(rule.label)) byLabel.set(rule.label, []);
    for (const r of listing.reviews) {
      byLabel.get(rule.label).push({
        author: r.author || 'Anonymous',
        rating: r.rating ?? 5,
        body: r.text || '',
        created_at: r.date || '',
        images: r.images || [],
      });
    }
  }

  console.log('Grouped by matcher:');
  for (const [label, reviews] of byLabel) {
    const withImgs = reviews.filter(r => r.images.length > 0).length;
    console.log(`  "${label}": ${reviews.length} reviews (${withImgs} with images)`);
  }

  const shopifyProducts = await getProducts();
  console.log(`\nShopify products: ${shopifyProducts.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const [label, newReviews] of byLabel) {
    const rule = MATCHERS.find(m => m.label === label);
    const matched = shopifyProducts.filter(p => rule.matchShopify(p.title));

    if (!matched.length) {
      console.warn(`⚠ No Shopify products matched for label: "${label}"`);
      skipped++;
      continue;
    }

    console.log(`"${label}" (${newReviews.length} reviews) → ${matched.length} product(s):`);

    for (const product of matched) {
      const existing = await getExistingMetafield(product.id);
      const existingReviews = existing?.reviews || [];

      // De-duplicate by author + body, prefer new version (has images)
      const dedupKey = r => `${r.author}|${r.body}`;
      const newKeys = new Set(newReviews.map(dedupKey));
      const kept = existingReviews.filter(r => !newKeys.has(dedupKey(r)));
      const merged = [...kept, ...newReviews].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      await upsertReviews(product.id, merged, existing?.id);
      console.log(`  ✓ ${product.title.substring(0, 70)}`);
      console.log(`    kept: ${kept.length}, new/updated: ${newReviews.length}, total: ${merged.length}`);
      updated++;
      await sleep(300);
    }
  }

  console.log(`\nDone — ${updated} product(s) updated, ${skipped} label(s) skipped`);
}

main().catch(err => { console.error(err); process.exit(1); });
