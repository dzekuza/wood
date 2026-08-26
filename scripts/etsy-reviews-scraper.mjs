/**
 * Etsy review image scraper
 * Reads existing products.json, fetches each listing page,
 * and extracts user-submitted review images + review text.
 *
 * Usage: node scripts/etsy-reviews-scraper.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, 'etsy-data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const DELAY_MS = 1200; // polite delay between requests

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Extract review images from the "Photos from reviews" section.
 * These have src containing /iap/ (image-author-photo = buyer photo).
 */
function extractReviewImages(html) {
  const images = [];
  // Match all iap image URLs
  const pattern = /https:\/\/i\.etsystatic\.com\/iap\/[^"'\s]+/g;
  const seen = new Set();
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const url = m[0].split('?')[0]; // strip query params
    if (!seen.has(url)) {
      seen.add(url);
      // Upgrade thumbnail to full-size: replace iap_300x300 with iap_fullxfull
      const full = url.replace(/iap_\d+x\d+/, 'iap_fullxfull');
      images.push({ thumb: url, full });
    }
  }
  return images;
}

/**
 * Extract individual review entries: rating, author, date, text, images.
 * Etsy renders a subset of reviews in the static HTML.
 */
function extractReviews(html) {
  const reviews = [];

  // Each review block starts with a reviewer name link and a star rating
  // We look for the pattern: reviewer name + rating + optional text + optional iap image
  // Strategy: find all review text blocks between rating indicators

  // Find reviewer sections — each contains name, date, optional text, optional image
  // Regex to find review blocks
  const reviewBlockPattern = /(\d) out of 5 stars \d+ This item[\s\S]*?(?=\d out of 5 stars \d+ This item|View all reviews|Photos from reviews)/g;

  let blockMatch;
  while ((blockMatch = reviewBlockPattern.exec(html)) !== null) {
    const block = blockMatch[0];

    // Rating
    const ratingMatch = block.match(/^(\d) out of 5 stars/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

    // Reviewer name
    const nameMatch = block.match(/\[([^\]]+)\]\(https:\/\/www\.etsy\.com\/people\/[^)]+\)\s+(?:\w+ \d+, \d+)/);
    const author = nameMatch ? nameMatch[1] : null;

    // Date
    const dateMatch = block.match(/(\w+ \d+, \d{4})/);
    const date = dateMatch ? dateMatch[1] : null;

    // Review text (after "Listing review by ...")
    const textMatch = block.match(/Listing review by [^\n]+\n\n([\s\S]+?)(?:\n\n|\!\[|$)/);
    const text = textMatch ? textMatch[1].trim() : null;

    // Images in this review
    const imgPattern = /https:\/\/i\.etsystatic\.com\/iap\/[^"'\s)]+/g;
    const images = [];
    const seen = new Set();
    let imgMatch;
    while ((imgMatch = imgPattern.exec(block)) !== null) {
      const url = imgMatch[0].split('?')[0];
      if (!seen.has(url)) {
        seen.add(url);
        images.push(url.replace(/iap_\d+x\d+/, 'iap_fullxfull'));
      }
    }

    if (rating && (text || images.length > 0)) {
      reviews.push({ rating, author, date, text, images });
    }
  }

  return reviews;
}

async function scrapeListingReviews(listing) {
  const { listing_id, title } = listing;

  // Build a slug from the title so Etsy doesn't 403 bare /listing/{id} URLs
  const slug = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
  const listingUrl = `https://www.etsy.com/listing/${listing_id}/${slug}`;

  try {
    const html = await fetchHtml(listingUrl);

    const reviewImages = extractReviewImages(html);
    const reviews = extractReviews(html);

    console.log(`  [${listing_id}] ${reviewImages.length} review images, ${reviews.length} reviews parsed`);

    return {
      listing_id,
      title,
      url: listingUrl,
      review_images: reviewImages,
      reviews,
    };
  } catch (e) {
    console.error(`  [${listing_id}] Failed: ${e.message}`);
    return {
      listing_id,
      title,
      url: listingUrl,
      review_images: [],
      reviews: [],
      error: e.message,
    };
  }
}

async function main() {
  if (!existsSync(PRODUCTS_FILE)) {
    console.error(`products.json not found at ${PRODUCTS_FILE}`);
    console.error('Run etsy-scraper.mjs first.');
    process.exit(1);
  }

  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });

  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Loaded ${products.length} products. Scraping reviews...`);

  const results = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i + 1}/${products.length}] ${product.listing_id} — ${product.title.substring(0, 60)}...`);

    const result = await scrapeListingReviews(product);
    results.push(result);

    if (i < products.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  writeFileSync(REVIEWS_FILE, JSON.stringify(results, null, 2));

  // Summary
  const totalImages = results.reduce((sum, r) => sum + r.review_images.length, 0);
  const totalReviews = results.reduce((sum, r) => sum + r.reviews.length, 0);
  const withImages = results.filter(r => r.review_images.length > 0).length;

  console.log('\n--- Done ---');
  console.log(`Processed: ${results.length} listings`);
  console.log(`Listings with review images: ${withImages}`);
  console.log(`Total review images: ${totalImages}`);
  console.log(`Total reviews with text: ${totalReviews}`);
  console.log(`Saved to: ${REVIEWS_FILE}`);

  // Quick preview
  console.log('\n--- Preview (first 3 with images) ---');
  results.filter(r => r.review_images.length > 0).slice(0, 3).forEach(r => {
    console.log(`\n[${r.listing_id}] ${r.title.substring(0, 50)}`);
    console.log(`  Images: ${r.review_images.length}`);
    r.review_images.slice(0, 2).forEach(img => console.log(`  ${img.full}`));
  });
}

main().catch(e => { console.error(e); process.exit(1); });
