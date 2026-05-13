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

// Upgrade Etsy thumbnail URL to full-size image
function fullSizeUrl(thumbUrl) {
  // Pattern: il_340x270.HASH_CODE.jpg → il_fullxfull.HASH_CODE.jpg
  return thumbUrl
    .replace(/il_\d+x\d+\./, 'il_fullxfull.')
    .replace(/\/c\/\d+\/\d+\/\d+\/\d+\//, '/r/') // remove crop params
    .replace(/il_340x270/, 'il_fullxfull');
}

// Verify URL is reachable (HEAD request)
async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function attachImage(productId, imageUrl, altText) {
  const data = await gql(`
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
            image { url }
          }
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

async function main() {
  const etsyProducts = JSON.parse(readFileSync(join(__dir, 'etsy-data/products.json'), 'utf-8'));
  const imageMap = Object.fromEntries(etsyProducts.map(p => [p.listing_id, { url: p.image_url, title: p.title }]));

  // Fetch all products missing images
  const data = await gql(`{
    products(first: 100) {
      nodes {
        id
        title
        tags
        media(first: 1) { nodes { __typename } }
      }
    }
  }`);

  const missing = data.products.nodes.filter(p => p.media.nodes.length === 0);
  console.log(`Products missing images: ${missing.length}\n`);

  let done = 0, failed = 0;

  for (const product of missing) {
    const etsyTag = product.tags.find(t => t.startsWith('etsy-'));
    if (!etsyTag) {
      console.log(`  NO ETSY TAG: ${product.title.slice(0, 60)}`);
      failed++;
      continue;
    }

    const listingId = etsyTag.replace('etsy-', '');
    const etsy = imageMap[listingId];
    if (!etsy) {
      console.log(`  NOT IN JSON [${listingId}]: ${product.title.slice(0, 50)}`);
      failed++;
      continue;
    }

    // Try full-size first, fall back to thumbnail
    const fullUrl = fullSizeUrl(etsy.url);
    const urlOk = await checkUrl(fullUrl);
    const imageUrl = urlOk ? fullUrl : etsy.url;

    try {
      await attachImage(product.id, imageUrl, etsy.title);
      console.log(`  OK [${listingId}] ${urlOk ? '(full)' : '(thumb)'}: ${product.title.slice(0, 55)}`);
      done++;
    } catch (e) {
      // If full-size failed at Shopify level, try thumbnail
      if (urlOk) {
        try {
          await attachImage(product.id, etsy.url, etsy.title);
          console.log(`  OK [${listingId}] (thumb fallback): ${product.title.slice(0, 50)}`);
          done++;
        } catch (e2) {
          console.log(`  FAIL [${listingId}]: ${e2.message.slice(0, 80)}`);
          failed++;
        }
      } else {
        console.log(`  FAIL [${listingId}]: ${e.message.slice(0, 80)}`);
        failed++;
      }
    }

    // Shopify media API rate limit is generous but let's be safe
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nDone. Uploaded: ${done}, Failed: ${failed}`);
}

main().catch(console.error);
