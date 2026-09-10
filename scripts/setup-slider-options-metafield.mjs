#!/usr/bin/env node
/**
 * Creates the `custom.slider_options` product metafield definition, merchant
 * read/write, list-of-text — so it shows up as an editable field ("PDP
 * Slider Options") on every product's edit page in Shopify Admin, no app or
 * code change needed to use it.
 *
 * The storefront reads it in products.$handle.tsx (`sliderOptions` alias) to
 * decide which non-swatch variant option renders as the length slider vs.
 * dropdown — see app/lib/productOptionDisplay.ts. Leaving it blank on a
 * product falls back to the coded default (SLIDER_OPTION_NAMES, `['Length']`).
 *
 * Requires SHOPIFY_ADMIN_TOKEN env var (loaded from .env). Idempotent — safe
 * to re-run.
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

async function main() {
  // This store's plan rejects an explicit `access` value on create (any
  // combination errors "not permitted"), so create with the plan default
  // (admin: PUBLIC_READ_WRITE, storefront: NONE) first, then grant
  // storefront read in a separate update call — that combination *is*
  // accepted via metafieldDefinitionUpdate. Storefront read is required:
  // without it the Hydrogen storefront's Storefront API token can't see
  // the value at all (`sliderOptions` in products.$handle.tsx stays null).
  const data = await gql(
    `mutation CreateDef($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id name }
        userErrors { field message code }
      }
    }`,
    {
      definition: {
        name: 'PDP Slider Options',
        namespace: 'custom',
        key: 'slider_options',
        type: 'list.single_line_text_field',
        ownerType: 'PRODUCT',
        description:
          'Exact variant option name(s) (e.g. "Length") that should render as a slider on the product page instead of a dropdown. Leave blank to use the site default.',
      },
    },
  );

  const createErrs = data.metafieldDefinitionCreate.userErrors;
  const alreadyExists = createErrs.some((e) => e.code === 'TAKEN');
  if (createErrs.length && !alreadyExists) {
    console.error('Create error:', createErrs);
    process.exit(1);
  }
  console.log(
    alreadyExists
      ? 'Definition already exists: custom.slider_options'
      : 'Definition created: custom.slider_options',
  );

  const updateData = await gql(
    `mutation GrantStorefrontRead($definition: MetafieldDefinitionUpdateInput!) {
      metafieldDefinitionUpdate(definition: $definition) {
        updatedDefinition { id access { admin storefront } }
        userErrors { field message code }
      }
    }`,
    {
      definition: {
        namespace: 'custom',
        key: 'slider_options',
        ownerType: 'PRODUCT',
        access: { storefront: 'PUBLIC_READ' },
      },
    },
  );

  const updateErrs = updateData.metafieldDefinitionUpdate.userErrors;
  if (updateErrs.length) {
    console.error('Storefront-access update error:', updateErrs);
    process.exit(1);
  }
  console.log(
    'Storefront read access granted:',
    JSON.stringify(updateData.metafieldDefinitionUpdate.updatedDefinition.access),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
