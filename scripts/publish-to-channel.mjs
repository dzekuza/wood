#!/usr/bin/env node
/**
 * Publishes all products to the "Wood Headless" Hydrogen storefront channel
 * using the publishablePublish GraphQL mutation.
 */

const SHOP_DOMAIN = 'wood-123252.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');
const PUBLICATION_GID = 'gid://shopify/Publication/342742139222';

const GRAPHQL_URL = `https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`;

async function graphql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

async function getAllProductIds() {
  const ids = [];
  let cursor = null;
  while (true) {
    const q = `
      query($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            node { id title }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `;
    const data = await graphql(q, { cursor });
    for (const edge of data.products.edges) {
      ids.push({ id: edge.node.id, title: edge.node.title });
      cursor = edge.cursor;
    }
    if (!data.products.pageInfo.hasNextPage) break;
  }
  return ids;
}

const PUBLISH_MUTATION = `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Product { id }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Fetching all products...');
  const products = await getAllProductIds();
  console.log(`Found ${products.length} products\n`);

  let published = 0;
  let failed = 0;

  for (const { id, title } of products) {
    process.stdout.write(`  Publishing "${title.slice(0, 60)}"... `);
    try {
      const data = await graphql(PUBLISH_MUTATION, {
        id,
        input: [{ publicationId: PUBLICATION_GID }],
      });
      const errors = data.publishablePublish?.userErrors ?? [];
      if (errors.length) {
        console.log(`✗ ${errors.map((e) => e.message).join(', ')}`);
        failed++;
      } else {
        console.log('✓');
        published++;
      }
    } catch (err) {
      console.log(`✗ ${err.message.slice(0, 80)}`);
      failed++;
    }
    await sleep(300);
  }

  console.log(`\n── Summary ──`);
  console.log(`Published: ${published}`);
  console.log(`Failed:    ${failed}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
