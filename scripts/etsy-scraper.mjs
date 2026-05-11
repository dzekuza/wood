import { writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SHOP_URL = 'https://www.etsy.com/shop/CraftWoodFurniture';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractListingsFromNextData(data) {
  const listings = [];

  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    // Etsy listing objects typically have listing_id + title + price
    if (obj.listing_id && obj.title) {
      listings.push(obj);
      return;
    }
    Object.values(obj).forEach(walk);
  }

  walk(data);
  return listings;
}

function extractFromHtml(html) {
  // Fallback: parse listing cards from raw HTML
  const products = [];
  const listingPattern = /href="https:\/\/www\.etsy\.com\/listing\/(\d+)\/([^"?]+)/g;
  const seen = new Set();
  let m;
  while ((m = listingPattern.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const slug = m[2].replace(/-/g, ' ');
    products.push({ listing_id: id, title: slug, url: `https://www.etsy.com/listing/${id}/${m[2]}` });
  }
  return products;
}

function toCSV(products) {
  const headers = ['listing_id', 'title', 'price', 'currency', 'description', 'url', 'image_url', 'tags'];
  const rows = products.map(p => [
    p.listing_id || '',
    `"${(p.title || '').replace(/"/g, '""')}"`,
    p.price || '',
    p.currency_code || 'USD',
    `"${(p.description || '').replace(/"/g, '""').substring(0, 300)}"`,
    p.url || `https://www.etsy.com/listing/${p.listing_id}`,
    p.image_url || '',
    `"${(Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function scrapeListingDetail(listingId, slug) {
  const url = `https://www.etsy.com/listing/${listingId}/${slug}`;
  try {
    const html = await fetchPage(url);
    const nextData = extractNextData(html);
    if (!nextData) return null;

    // Walk to find listing data
    let listing = null;
    function find(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.listing_id == listingId && obj.price) { listing = obj; return; }
      if (Array.isArray(obj)) { obj.forEach(find); return; }
      Object.values(obj).forEach(find);
    }
    find(nextData);

    if (listing) {
      return {
        listing_id: listingId,
        title: listing.title || slug.replace(/-/g, ' '),
        price: listing.price?.amount || listing.price || '',
        currency_code: listing.price?.currency_code || 'USD',
        description: listing.description || '',
        image_url: listing.images?.[0]?.url_fullxfull || listing.main_image?.url_fullxfull || '',
        tags: listing.tags || [],
        url,
      };
    }

    // Fallback: parse price from meta tags
    const priceMatch = html.match(/<meta property="product:price:amount" content="([^"]+)"/);
    const currencyMatch = html.match(/<meta property="product:price:currency" content="([^"]+)"/);
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    return {
      listing_id: listingId,
      title: titleMatch ? titleMatch[1].split(' - ')[0].trim() : slug.replace(/-/g, ' '),
      price: priceMatch ? priceMatch[1] : '',
      currency_code: currencyMatch ? currencyMatch[1] : 'USD',
      description: descMatch ? descMatch[1] : '',
      image_url: imgMatch ? imgMatch[1] : '',
      tags: [],
      url,
    };
  } catch (e) {
    console.error(`  Failed to fetch listing ${listingId}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('Fetching Etsy shop page...');
  const html = await fetchPage(SHOP_URL);

  // Try __NEXT_DATA__ first
  const nextData = extractNextData(html);
  let products = [];

  if (nextData) {
    console.log('Found __NEXT_DATA__, extracting listings...');
    const raw = extractListingsFromNextData(nextData);
    if (raw.length > 0) {
      console.log(`Found ${raw.length} listings in __NEXT_DATA__`);
      products = raw.map(p => ({
        listing_id: p.listing_id,
        title: p.title,
        price: p.price?.amount || p.price || '',
        currency_code: p.price?.currency_code || 'USD',
        description: p.description || '',
        image_url: p.images?.[0]?.url_fullxfull || p.main_image?.url_fullxfull || '',
        tags: p.tags || [],
        url: `https://www.etsy.com/listing/${p.listing_id}`,
      }));
    }
  }

  // Fallback to HTML parsing
  if (products.length === 0) {
    console.log('Falling back to HTML link parsing...');
    const rawLinks = extractFromHtml(html);
    console.log(`Found ${rawLinks.length} listing links, fetching details...`);

    for (let i = 0; i < Math.min(rawLinks.length, 24); i++) {
      const { listing_id, title } = rawLinks[i];
      const slug = title.replace(/\s+/g, '-').toLowerCase();
      console.log(`  [${i + 1}/${Math.min(rawLinks.length, 24)}] Fetching ${listing_id}...`);
      const detail = await scrapeListingDetail(listing_id, slug);
      if (detail) products.push(detail);
      // polite delay
      await new Promise(r => setTimeout(r, 800));
    }
  }

  if (products.length === 0) {
    console.log('No products found. Etsy may be blocking the request.');
    console.log('Raw HTML snippet:', html.substring(0, 500));
    process.exit(1);
  }

  console.log(`\nScraped ${products.length} products.`);

  // Save JSON
  const outDir = path.resolve('scripts/etsy-data');
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  writeFileSync(path.join(outDir, 'products.json'), JSON.stringify(products, null, 2));
  writeFileSync(path.join(outDir, 'products.csv'), toCSV(products));

  console.log(`Saved to scripts/etsy-data/products.json`);
  console.log(`Saved to scripts/etsy-data/products.csv`);

  // Preview
  console.log('\n--- Preview ---');
  products.slice(0, 5).forEach(p => {
    console.log(`  [${p.listing_id}] ${p.title} — ${p.currency_code} ${p.price}`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
