import { readFileSync, writeFileSync } from 'fs';

const envPath = new URL('../.env', import.meta.url).pathname;
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

async function main() {
const res = await fetch('https://wood-123252.myshopify.com/admin/api/2025-01/graphql.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_TOKEN },
  body: JSON.stringify({ query: `{
    products(first: 50) {
      nodes {
        id handle title descriptionHtml vendor productType tags status
        variants(first: 10) {
          nodes { id sku price compareAtPrice requiresShipping taxable }
        }
        images(first: 1) { nodes { src altText } }
      }
    }
  }` })
});

const { data } = await res.json();
const products = data.products.nodes;

function esc(v) {
  const s = String(v ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

const headers = ['Handle','Title','Body (HTML)','Vendor','Type','Tags','Published',
  'Option1 Name','Option1 Value','Variant SKU','Variant Grams',
  'Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy',
  'Variant Fulfillment Service','Variant Price','Variant Compare At Price',
  'Variant Requires Shipping','Variant Taxable','Image Src','Image Position','Image Alt Text','Status'];

const rows = [headers.join(',')];

for (const p of products) {
  for (const [vi, v] of p.variants.nodes.entries()) {
    const img = vi === 0 ? p.images.nodes[0] : null;
    rows.push([
      p.handle, p.title, p.descriptionHtml || '', p.vendor || 'CraftWoodFurniture',
      p.productType || '', p.tags.join(', '), 'TRUE',
      'Title', 'Default Title',
      v.sku || `CWF-${p.handle}`,
      '0', 'shopify', '10', 'deny', 'manual',
      v.price, v.compareAtPrice || '',
      v.requiresShipping ? 'TRUE' : 'FALSE',
      v.taxable ? 'TRUE' : 'FALSE',
      img?.src || '', vi === 0 ? '1' : '',
      img?.altText || p.title,
      p.status.toLowerCase(),
    ].map(esc).join(','));
  }
}

writeFileSync('scripts/etsy-data/shopify-current-products.csv', rows.join('\n'));
console.log(`Exported ${products.length} products → scripts/etsy-data/shopify-current-products.csv`);
products.forEach(p => console.log(`  ${p.handle} | $${p.variants.nodes[0].price}`));
}

main().catch(e => { console.error(e.message); process.exit(1); });
