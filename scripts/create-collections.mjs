#!/usr/bin/env node
/**
 * Creates the 4 CWF collections in Shopify and publishes them
 * to the "Wood Headless" sales channel.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/create-collections.mjs
 */

const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const PUBLICATION_ID = 'gid://shopify/Publication/342742139222'; // Wood Headless

if (!TOKEN) {
  console.error('Set SHOPIFY_ADMIN_TOKEN env var first.');
  process.exit(1);
}

const COLLECTIONS = [
  { title: 'Solid Oak Mantel Beams',  sortOrder: 'BEST_SELLING' },
  { title: 'Solid Oak Coat Racks',    sortOrder: 'BEST_SELLING' },
  { title: 'Solid Oak Shelves',       sortOrder: 'BEST_SELLING' },
  { title: 'Solid Oak Door Stops',    sortOrder: 'BEST_SELLING' },
];

const CREATE_COLLECTION = `
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id title handle }
      userErrors { field message }
    }
  }
`;

const PUBLISH_COLLECTION = `
  mutation PublishCollection($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable { ... on Collection { id title } }
      userErrors { field message }
    }
  }
`;

async function gql(query, variables) {
  const res = await fetch(`https://${SHOP}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

for (const col of COLLECTIONS) {
  try {
    const { collectionCreate } = await gql(CREATE_COLLECTION, { input: col });
    if (collectionCreate.userErrors.length) {
      console.error(`✗ ${col.title}:`, collectionCreate.userErrors);
      continue;
    }
    const { id, handle } = collectionCreate.collection;
    console.log(`✓ Created: ${col.title} (${handle})`);

    // Publish to Wood Headless sales channel
    const { publishablePublish } = await gql(PUBLISH_COLLECTION, {
      id,
      input: [{ publicationId: PUBLICATION_ID }],
    });
    if (publishablePublish.userErrors.length) {
      console.warn(`  ⚠ Publish error:`, publishablePublish.userErrors);
    } else {
      console.log(`  → Published to Wood Headless`);
    }
  } catch (err) {
    console.error(`✗ ${col.title}:`, err.message);
  }
}
