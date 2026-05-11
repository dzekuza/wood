interface Env {
  SHOPIFY_ADMIN_TOKEN: string;
  GOOGLE_SHEET_ID: string;
}

const SHOP = 'wood-123252.myshopify.com';
const ADMIN_VERSION = '2025-01';

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const rawLines = text.split('\n');
  const headers = splitLine(rawLines[0]);
  const rows: Record<string, string>[] = [];
  let i = 1;
  while (i < rawLines.length) {
    let line = rawLines[i];
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < rawLines.length) {
      i++; line += '\n' + rawLines[i];
    }
    const vals = splitLine(line);
    rows.push(Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? ''])));
    i++;
  }
  return rows;
}

function splitLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false, current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuote) { inQuote = true; continue; }
    if (ch === '"' && inQuote) {
      if (line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = false;
      continue;
    }
    if (ch === ',' && !inQuote) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

// ── Shopify helpers ───────────────────────────────────────────────────────────

async function shopifyQuery(token: string, query: string, variables = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${ADMIN_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchShopifyProducts(token: string) {
  const allProducts: any[] = [];
  let cursor: string | null = null;
  do {
    const data = await shopifyQuery(token, `
      query($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            handle
            variants(first: 20) { nodes { id sku price compareAtPrice } }
          }
        }
      }
    `, { cursor });
    allProducts.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);

  const bySku: Record<string, any> = {};
  const byHandle: Record<string, any> = {};
  for (const p of allProducts) {
    byHandle[p.handle] = { variants: p.variants.nodes, cursor: 0 };
    for (const v of p.variants.nodes) {
      if (v.sku) bySku[v.sku] = { handle: p.handle, variant: v };
    }
  }
  return { bySku, byHandle };
}

async function updateVariantPrice(token: string, variantId: string, price: string, compareAtPrice: string | null) {
  return shopifyQuery(token, `
    mutation($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant { id }
        userErrors { message }
      }
    }
  `, { input: { id: variantId, price, compareAtPrice } });
}

// ── Sync logic ────────────────────────────────────────────────────────────────

async function sync(env: Env): Promise<string> {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}/export?format=csv&gid=1731351599`;
  const [sheetRes, { bySku, byHandle }] = await Promise.all([
    fetch(sheetUrl),
    fetchShopifyProducts(env.SHOPIFY_ADMIN_TOKEN),
  ]);

  if (!sheetRes.ok) throw new Error(`Sheet fetch failed: ${sheetRes.status}`);
  const rows = parseCSV(await sheetRes.text());

  const changes: any[] = [];
  for (const row of rows) {
    const sku = row['Variant SKU']?.trim();
    const handle = row['Handle']?.trim();
    const sheetPrice = parseFloat(row['Variant Price']);
    const sheetCompare = row['Variant Compare At Price'] ? parseFloat(row['Variant Compare At Price']) : null;
    if (isNaN(sheetPrice)) continue;

    let variant: any = null;
    if (sku && bySku[sku]) {
      variant = bySku[sku].variant;
    } else if (handle && byHandle[handle]) {
      const entry = byHandle[handle];
      variant = entry.variants[entry.cursor];
      if (variant) entry.cursor++;
    }
    if (!variant) continue;

    const priceChanged = Math.abs(parseFloat(variant.price) - sheetPrice) > 0.001;
    const compareChanged = Math.abs((parseFloat(variant.compareAtPrice) || 0) - (sheetCompare || 0)) > 0.001;
    if (priceChanged || compareChanged) {
      changes.push({ variantId: variant.id, price: String(sheetPrice), compareAtPrice: sheetCompare ? String(sheetCompare) : null });
    }
  }

  for (const c of changes) {
    await updateVariantPrice(env.SHOPIFY_ADMIN_TOKEN, c.variantId, c.price, c.compareAtPrice);
  }

  return changes.length > 0 ? `Updated ${changes.length} price(s)` : 'In sync';
}

// ── Worker entry ──────────────────────────────────────────────────────────────

export default {
  // Cron trigger — runs every minute automatically
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(sync(env).then(msg => console.log(`[price-sync] ${msg}`)));
  },

  // HTTP endpoint — call /sync to trigger manually
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/sync') {
      try {
        const result = await sync(env);
        return new Response(result, { status: 200 });
      } catch (e: any) {
        return new Response(`Error: ${e.message}`, { status: 500 });
      }
    }
    return new Response('Price sync worker running', { status: 200 });
  },
};
