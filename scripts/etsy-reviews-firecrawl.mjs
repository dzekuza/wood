/**
 * Etsy review image scraper — powered by Firecrawl
 * Uses the Firecrawl API to bypass Etsy's bot detection.
 *
 * Usage: node scripts/etsy-reviews-firecrawl.mjs
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, 'etsy-data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const FIRECRAWL_API_KEY = 'fc-234f6e37bf03428189ddac609671be2d';
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/scrape';
const DELAY_MS = 800;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function extractIapImages(markdown) {
  const seen = new Set();
  const images = [];
  const pattern = /https?:\/\/i\.etsystatic\.com\/iap\/[^\s\)\"?]+/g;
  let m;
  while ((m = pattern.exec(markdown)) !== null) {
    // Prefer 640x640 over 300x300
    const url = m[0].replace(/iap_\d+x\d+/, 'iap_640x640');
    const key = url.replace(/iap_\d+x\d+/, '');
    if (!seen.has(key)) {
      seen.add(key);
      images.push(url);
    }
  }
  return images;
}

function extractReviews(markdown) {
  const reviews = [];
  // Match review blocks: rating + author + date + text pattern
  const blocks = markdown.split(/(?=\d out of 5 stars)/g);
  for (const block of blocks) {
    const ratingMatch = block.match(/^(\d) out of 5 stars/);
    if (!ratingMatch) continue;
    const rating = parseInt(ratingMatch[1]);

    const dateMatch = block.match(/(\w+ \d+, \d{4})/);
    const date = dateMatch ? dateMatch[1] : null;

    // Text after "Listing review by ..."
    const textMatch = block.match(/Listing review by [^\n]+\n+([^\n!][^\n]+)/);
    const text = textMatch ? textMatch[1].trim() : null;

    // Images in this block
    const imgPattern = /https?:\/\/i\.etsystatic\.com\/iap\/[^\s\)\"?]+/g;
    const images = [];
    let imgM;
    while ((imgM = imgPattern.exec(block)) !== null) {
      images.push(imgM[0].replace(/iap_\d+x\d+/, 'iap_640x640'));
    }

    if (rating && (text || images.length > 0)) {
      reviews.push({ rating, date, text, images: [...new Set(images)] });
    }
  }
  return reviews.slice(0, 10);
}

async function scrapeWithFirecrawl(url) {
  const res = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      proxy: 'stealth',
    }),
  });

  if (!res.ok) {
    throw new Error(`Firecrawl HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Firecrawl error: ${JSON.stringify(data)}`);
  }

  return data.data?.markdown || '';
}

async function main() {
  if (!existsSync(PRODUCTS_FILE)) {
    console.error('products.json not found. Run etsy-scraper.mjs first.');
    process.exit(1);
  }

  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Loaded ${products.length} products. Scraping via Firecrawl...\n`);

  const results = [];

  for (let i = 0; i < products.length; i++) {
    const { listing_id, title, url } = products[i];
    const slug = buildSlug(title);
    const listingUrl = `https://www.etsy.com/listing/${listing_id}/${slug}`;

    process.stdout.write(`[${i + 1}/${products.length}] ${listing_id}... `);

    try {
      const markdown = await scrapeWithFirecrawl(listingUrl);
      const review_images = extractIapImages(markdown);
      const reviews = extractReviews(markdown);

      console.log(`✓ ${review_images.length} images, ${reviews.length} reviews`);
      results.push({ listing_id, title, url: listingUrl, review_images, reviews });
    } catch (e) {
      console.log(`✗ ${e.message}`);
      results.push({ listing_id, title, url: listingUrl, review_images: [], reviews: [], error: e.message });
    }

    if (i < products.length - 1) await sleep(DELAY_MS);
  }

  writeFileSync(REVIEWS_FILE, JSON.stringify(results, null, 2));

  const totalImages = results.reduce((s, r) => s + r.review_images.length, 0);
  const withImages = results.filter(r => r.review_images.length > 0).length;

  console.log('\n─── Done ───────────────────────────────');
  console.log(`Listings with review images : ${withImages}/${results.length}`);
  console.log(`Total review images         : ${totalImages}`);
  console.log(`Saved → ${REVIEWS_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
