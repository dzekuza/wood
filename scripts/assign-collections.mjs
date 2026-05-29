const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');
const API = `https://${SHOP}/admin/api/2024-01/graphql.json`;

const COLLECTIONS = {
  COAT_RACKS:   'gid://shopify/Collection/696226742614',
  MANTEL_BEAMS: 'gid://shopify/Collection/696226644310',
  SHELVES:      'gid://shopify/Collection/696226840918',
  DOOR_STOPS:   'gid://shopify/Collection/696226873686',
  LIVING_ROOM:  'gid://shopify/Collection/696211800406',
};

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

function classify(title) {
  const t = title.toLowerCase();
  if (t.includes('coat rack') || t.includes('coat rack rail')) return 'COAT_RACKS';
  if (
    t.includes('mantel') || t.includes('mantle') ||
    t.includes('fireplace beam') || t.includes('fire surround') ||
    t.includes('fireplace surround') || t.includes('lintel') ||
    t.includes('mantle shelf') || t.includes('mantel beam') ||
    t.includes('mantle beam') || t.includes('corbels')
  ) return 'MANTEL_BEAMS';
  if (t.includes('floating shelf') || t.includes('wall shelf') || t.includes('shelves') || t.includes(' shelf') && !t.includes('mantle') && !t.includes('mantel')) return 'SHELVES';
  if (t.includes('door stop')) return 'DOOR_STOPS';
  if (t.includes('cube') || t.includes('bedside') || t.includes('side table') || t.includes('coffee')) return 'LIVING_ROOM';
  return null;
}

async function main() {
  // Fetch all products with current collection assignments
  const data = await gql(`{
    products(first: 100) {
      nodes {
        id
        title
        collections(first: 10) { nodes { id title } }
      }
    }
  }`);

  // Build per-collection product lists (only products not already in that collection)
  const toAdd = {
    COAT_RACKS: [],
    MANTEL_BEAMS: [],
    SHELVES: [],
    DOOR_STOPS: [],
    LIVING_ROOM: [],
  };

  for (const product of data.products.nodes) {
    const bucket = classify(product.title);
    if (!bucket) {
      console.log(`  UNCLASSIFIED: ${product.title.slice(0, 70)}`);
      continue;
    }
    const alreadyIn = product.collections.nodes.some(c => c.id === COLLECTIONS[bucket]);
    if (alreadyIn) {
      console.log(`  SKIP (already in ${bucket}): ${product.title.slice(0, 55)}`);
    } else {
      toAdd[bucket].push(product.id);
      console.log(`  → ${bucket}: ${product.title.slice(0, 60)}`);
    }
  }

  console.log('\n--- Assigning collections ---');
  for (const [bucket, productIds] of Object.entries(toAdd)) {
    if (!productIds.length) { console.log(`  ${bucket}: nothing to add`); continue; }
    const result = await gql(`
      mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection { title productsCount { count } }
          userErrors { field message }
        }
      }
    `, { id: COLLECTIONS[bucket], productIds });

    const errs = result.collectionAddProducts.userErrors;
    if (errs.length) {
      console.log(`  ERROR ${bucket}: ${errs.map(e => e.message).join(', ')}`);
    } else {
      const col = result.collectionAddProducts.collection;
      console.log(`  ${bucket} → "${col.title}" now has ${col.productsCount.count} products`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

main().catch(console.error);
