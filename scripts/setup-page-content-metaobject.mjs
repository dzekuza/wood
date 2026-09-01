#!/usr/bin/env node
/**
 * Creates the `page_content` metaobject definition the edit toolbar stores
 * inline copy in (app/lib/pageContent.server.ts). One entry per page, keyed by
 * Shopify's built-in handle = the page slug ("index" for the homepage).
 *
 * Safe to re-run: an existing definition is detected and left alone.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/setup-page-content-metaobject.mjs
 */

const SHOP = process.env.SHOPIFY_ADMIN_SHOP_DOMAIN || 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2026-04';

if (!TOKEN) {
  console.error('Set SHOPIFY_ADMIN_TOKEN env var first.');
  process.exit(1);
}

async function admin(query, variables = {}) {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': TOKEN,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  return json.data;
}

const EXISTING = `
  query PageContentDefinition {
    metaobjectDefinitionByType(type: "page_content") { id name }
  }
`;

const CREATE = `
  mutation CreatePageContentDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }
`;

const existing = await admin(EXISTING);
if (existing.metaobjectDefinitionByType) {
  console.log('page_content definition already exists — nothing to do.');
  process.exit(0);
}

const result = await admin(CREATE, {
  definition: {
    type: 'page_content',
    name: 'Page content',
    description: 'Inline copy edited through the storefront edit toolbar.',
    // Storefront access is deliberately NOT granted: draft_data must not be
    // publicly readable, and Shopify's visibility is whole-type. The
    // storefront reads this through the Admin API instead.
    fieldDefinitions: [
      {
        key: 'published_data',
        name: 'Published data',
        type: 'json',
        description: 'Live copy overrides, keyed by field id.',
      },
      {
        key: 'draft_data',
        name: 'Draft data',
        type: 'json',
        description: 'In-progress copy, admin-only until published.',
      },
      {
        key: 'draft_status',
        name: 'Draft status',
        type: 'single_line_text_field',
        description: 'none | editing | ready',
      },
    ],
  },
});

const errors = result.metaobjectDefinitionCreate.userErrors;
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log('Created:', result.metaobjectDefinitionCreate.metaobjectDefinition);
