#!/usr/bin/env node
/**
 * Adds width/height/length/color metafields to every variant of a product.
 * Requires SHOPIFY_ADMIN_TOKEN env var (loaded from .env).
 */
import { readFileSync } from 'fs';

const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SHOP_DOMAIN = 'wood-123252.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN env var is required');

const API_VERSION = '2025-01';
const GRAPHQL_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
const PRODUCT_ID = process.argv[2] || 'gid://shopify/Product/10928554803542';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gql(query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const METAFIELD_DEFS = [
  { key: 'height_in', name: 'Height (in)', namespace: 'custom', type: 'number_decimal' },
  { key: 'depth_in', name: 'Depth (in)', namespace: 'custom', type: 'number_decimal' },
  { key: 'length_ft', name: 'Length (ft)', namespace: 'custom', type: 'number_decimal' },
  { key: 'oil_colour', name: 'Oil colour', namespace: 'custom', type: 'single_line_text_field' },
];

async function ensureMetafieldDefinitions() {
  for (const def of METAFIELD_DEFS) {
    const data = await gql(
      `mutation CreateDef($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          name: def.name,
          namespace: def.namespace,
          key: def.key,
          type: def.type,
          ownerType: 'PRODUCTVARIANT',
        },
      }
    );
    const errs = data.metafieldDefinitionCreate.userErrors;
    const alreadyExists = errs.some((e) => e.code === 'TAKEN');
    if (errs.length && !alreadyExists) {
      console.error(`Definition ${def.key} error:`, errs);
    } else {
      console.log(`Definition ready: custom.${def.key}`);
    }
  }
}

async function fetchAllVariants(productId) {
  const variants = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await gql(
      `query GetVariants($id: ID!, $cursor: String) {
        product(id: $id) {
          variants(first: 100, after: $cursor) {
            edges {
              cursor
              node {
                id
                sku
                selectedOptions { name value }
              }
            }
            pageInfo { hasNextPage }
          }
        }
      }`,
      { id: productId, cursor }
    );
    const edges = data.product.variants.edges;
    variants.push(...edges.map((e) => e.node));
    hasNext = data.product.variants.pageInfo.hasNextPage;
    cursor = edges.length ? edges[edges.length - 1].cursor : null;
  }
  return variants;
}

function parseVariant(node) {
  const opts = Object.fromEntries(node.selectedOptions.map((o) => [o.name, o.value]));
  const hxd = opts['Height x Depth']; // e.g. "3x4"
  const [height, depth] = hxd.split('x').map(Number);
  const lengthFt = parseFloat(opts['Length']); // "3.5 ft" -> 3.5
  const color = opts['Oil colour'];
  return { height, depth, lengthFt, color };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log('Ensuring metafield definitions...');
  await ensureMetafieldDefinitions();

  console.log('Fetching all variants...');
  const variants = await fetchAllVariants(PRODUCT_ID);
  console.log(`Fetched ${variants.length} variants.`);

  const metafieldsPayload = [];
  for (const v of variants) {
    const { height, depth, lengthFt, color } = parseVariant(v);
    metafieldsPayload.push(
      { ownerId: v.id, namespace: 'custom', key: 'height_in', type: 'number_decimal', value: String(height) },
      { ownerId: v.id, namespace: 'custom', key: 'depth_in', type: 'number_decimal', value: String(depth) },
      { ownerId: v.id, namespace: 'custom', key: 'length_ft', type: 'number_decimal', value: String(lengthFt) },
      { ownerId: v.id, namespace: 'custom', key: 'oil_colour', type: 'single_line_text_field', value: color }
    );
  }

  // metafieldsSet accepts max 25 metafields per call
  const chunks = chunk(metafieldsPayload, 25);
  console.log(`Setting ${metafieldsPayload.length} metafields in ${chunks.length} batches...`);

  let done = 0;
  for (const batch of chunks) {
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message code }
        }
      }`,
      { metafields: batch }
    );
    const errs = data.metafieldsSet.userErrors;
    if (errs.length) console.error('Errors in batch:', errs);
    done += batch.length;
    if (done % 500 < 25) console.log(`Progress: ${done}/${metafieldsPayload.length}`);
    await sleep(500); // basic rate-limit courtesy
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
