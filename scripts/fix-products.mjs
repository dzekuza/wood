import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');
const API = `https://${SHOP}/admin/api/2024-01/graphql.json`;
const PUBLICATION_ID = 'gid://shopify/Publication/342742139222'; // Wood Headless channel

const DEMO_IDS = [
  'gid://shopify/Product/10531446128982', // Walnut Coffee Table
  'gid://shopify/Product/10531446456662', // Walnut Platform Bed
  'gid://shopify/Product/10531446489430', // White Oak Dining Table
  'gid://shopify/Product/10531447013718', // White Oak Bookshelf
  'gid://shopify/Product/10531447046486', // Cherry Wood Nightstand
  'gid://shopify/Product/10531447079254', // Walnut Dining Chair
];

// Handles already imported from Etsy
const ALREADY_IMPORTED = new Set([
  'natural-solid-oak-coat-rack-with-shelf',
  'oak-coat-racks-set-of-2-with-and-without-shelf',
  'solid-oak-fireplace-beam-mantel',
  'solid-oak-floating-shelf-4cm-thick',
  'solid-oak-mantel-beam-all-sizes-oiled',
]);

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function categorize(title) {
  const t = title.toLowerCase();
  if (t.includes('coat rack') && t.includes('shelf')) return { type: 'coat-rack', tags: ['coat-rack', 'hallway', 'handmade', 'oak', 'shelf', 'wall-mounted'] };
  if (t.includes('coat rack')) return { type: 'coat-rack', tags: ['coat-rack', 'hallway', 'handmade', 'oak', 'wall-mounted'] };
  if (t.includes('floating shelf') || t.includes('wall shelf') || t.includes('shelves')) return { type: 'shelf', tags: ['floating-shelf', 'handmade', 'oak', 'rustic', 'shelf', 'kitchen'] };
  if (t.includes('mantel') || t.includes('mantle') || t.includes('beam') || t.includes('lintel')) return { type: 'mantel-beam', tags: ['beam', 'fireplace', 'handmade', 'log-burner', 'mantel', 'oak', 'rustic'] };
  if (t.includes('fire surround') || t.includes('fireplace surround')) return { type: 'fireplace-surround', tags: ['fireplace', 'handmade', 'oak', 'rustic', 'surround'] };
  if (t.includes('door stop')) return { type: 'door-stop', tags: ['door-stop', 'gift', 'handmade', 'oak', 'rustic'] };
  if (t.includes('cube') || t.includes('bedside') || t.includes('nightstand') || t.includes('side table')) return { type: 'side-table', tags: ['bedside', 'handmade', 'oak', 'side-table'] };
  return { type: 'oak-furniture', tags: ['handmade', 'oak', 'rustic'] };
}

function buildDescription(title) {
  const t = title.toLowerCase();
  if (t.includes('coat rack')) {
    return `<p>Handcrafted solid oak coat rack, built to last a lifetime. Cast iron hooks add a timeless rustic character to any hallway or entryway. Wall-mounted and ready to install.</p><p>Each piece is individually made by hand from sustainably sourced English oak, oiled for a natural finish.</p>`;
  }
  if (t.includes('floating shelf') || t.includes('shelves')) {
    return `<p>Solid oak floating shelf, 4cm thick, cut to order. Pre-drilled and ready to fix. Oiled for protection and a warm natural finish. Ideal for kitchen, living room or bathroom.</p><p>Handcrafted from sustainably sourced English oak.</p>`;
  }
  if (t.includes('mantel') || t.includes('beam') || t.includes('lintel')) {
    return `<p>Solid oak fireplace mantel beam, available in all sizes. Pre-drilled and supplied with free fixings. Oiled finish — ready to install above your log burner or fireplace.</p><p>Handcrafted from sustainably sourced English oak with a rustic character.</p>`;
  }
  if (t.includes('fire surround') || t.includes('surround')) {
    return `<p>Bespoke solid oak fireplace surround, handcrafted to your specifications. Oiled finish, pre-drilled, and supplied with fixings. The perfect centrepiece for any living room.</p>`;
  }
  if (t.includes('door stop')) {
    return `<p>Handmade solid oak door stop with twisted jute rope. A charming rustic accessory or house-warming gift. Each piece is unique — made by hand from English oak.</p>`;
  }
  if (t.includes('cube') || t.includes('side table') || t.includes('bedside')) {
    return `<p>Bespoke solid oak cube — doubles as a bedside table, coffee table or lamp stand. Each piece is hand-cut from a solid English oak beam, giving every item a unique grain pattern.</p>`;
  }
  return `<p>Handcrafted solid English oak furniture, made to order. Natural oiled finish, built to last for generations.</p>`;
}

async function deleteProduct(id) {
  const data = await gql(`
    mutation productDelete($id: ID!) {
      productDelete(input: { id: $id }) {
        deletedProductId
        userErrors { field message }
      }
    }
  `, { id });
  const errs = data.productDelete.userErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join(', '));
  return data.productDelete.deletedProductId;
}

async function createProduct(etsy) {
  const { tags, type } = categorize(etsy.title);
  const handle = slugify(etsy.title);

  // Skip if already imported
  if (ALREADY_IMPORTED.has(handle)) {
    console.log(`  SKIP (already exists): ${etsy.title.slice(0, 60)}`);
    return null;
  }

  const priceVal = parseFloat(etsy.price).toFixed(2);
  const description = buildDescription(etsy.title);

  const input = {
    title: etsy.title,
    handle,
    descriptionHtml: description,
    vendor: 'Craft Wood Furniture',
    productType: type,
    tags: [...tags, `etsy-${etsy.listing_id}`],
    status: 'ACTIVE',
  };

  const createData = await gql(`
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }
  `, { input });

  const errs = createData.productCreate.userErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join(', '));

  const productId = createData.productCreate.product.id;
  const variantId = createData.productCreate.product.variants.nodes[0]?.id;

  // Set price on the default variant
  if (variantId) {
    await gql(`
      mutation productVariantUpdate($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant { id price }
          userErrors { field message }
        }
      }
    `, { input: { id: variantId, price: priceVal } });
  }

  // Attach image
  if (etsy.image_url) {
    await gql(`
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { ... on MediaImage { image { url } } }
          mediaUserErrors { field message }
        }
      }
    `, {
      productId,
      media: [{ originalSource: etsy.image_url, mediaContentType: 'IMAGE', alt: etsy.title }],
    });
  }

  // Publish to Wood Headless channel
  await gql(`
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }
  `, { id: productId, input: [{ publicationId: PUBLICATION_ID }] });

  return productId;
}

async function main() {
  const products = JSON.parse(readFileSync(join(__dir, 'etsy-data/products.json'), 'utf-8'));

  console.log('\n--- Step 1: Delete demo products ---');
  for (const id of DEMO_IDS) {
    try {
      const deleted = await deleteProduct(id);
      console.log(`  DELETED: ${deleted}`);
    } catch (e) {
      console.log(`  ERROR deleting ${id}: ${e.message}`);
    }
  }

  console.log('\n--- Step 2: Import Etsy products ---');
  let created = 0, skipped = 0, failed = 0;

  for (const p of products) {
    try {
      const id = await createProduct(p);
      if (id) {
        console.log(`  CREATED [${p.listing_id}]: ${p.title.slice(0, 60)}`);
        created++;
      } else {
        skipped++;
      }
      // Respect rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`  FAILED [${p.listing_id}]: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
