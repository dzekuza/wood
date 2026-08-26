/**
 * Downloads each unique Etsy review image, uploads it to Shopify Files API,
 * then patches lib/reviews.ts with the Shopify CDN URLs.
 *
 * Usage: SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/upload-review-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHOP = 'wood-123252.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
if (!TOKEN) { console.error('SHOPIFY_ADMIN_TOKEN required'); process.exit(1); }
const GQL = `https://${SHOP}/admin/api/2024-01/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CWF/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || 'image/jpeg';
  const mime = ct.split(';')[0].trim();
  return { buf, mime };
}

async function stagedUpload(filename, mime, fileSize) {
  const data = await gql(`
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }
  `, {
    input: [{
      resource: 'IMAGE',
      filename,
      mimeType: mime,
      fileSize: String(fileSize),
      httpMethod: 'POST',
    }],
  });
  const errs = data.stagedUploadsCreate.userErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join(', '));
  return data.stagedUploadsCreate.stagedTargets[0];
}

async function uploadToStaged(target, buf, mime, filename) {
  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  form.append('file', new Blob([buf], { type: mime }), filename);

  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Staged upload failed ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function createFile(stagedUploadPath) {
  const data = await gql(`
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          ... on MediaImage { image { url } }
          ... on GenericFile { url }
        }
        userErrors { field message }
      }
    }
  `, { files: [{ originalSource: stagedUploadPath, contentType: 'IMAGE' }] });
  const errs = data.fileCreate.userErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join(', '));
  return data.fileCreate.files[0];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadOne(etsyUrl, idx) {
  const { buf, mime } = await downloadImage(etsyUrl);
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const filename = `review-${idx}.${ext}`;

  const target = await stagedUpload(filename, mime, buf.length);
  await uploadToStaged(target, buf, mime, filename);

  // resourceUrl from staged upload IS the final CDN-like path we pass to fileCreate
  const file = await createFile(target.resourceUrl);
  return file;
}

async function main() {
  // 1. Extract all unique Etsy image URLs from lib/reviews.ts
  const reviewsPath = path.resolve(__dirname, '../app/lib/reviews.ts');
  let source = fs.readFileSync(reviewsPath, 'utf-8');
  const etsyRegex = /https:\/\/i\.etsystatic\.com\/[^\s'"]+/g;
  const uniqueUrls = [...new Set(source.match(etsyRegex) || [])];
  console.log(`Found ${uniqueUrls.length} unique Etsy image URLs\n`);

  const urlMap = new Map(); // etsyUrl → shopifyCdnUrl

  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    process.stdout.write(`[${i + 1}/${uniqueUrls.length}] Uploading ${url.slice(-40)}... `);
    try {
      await uploadOne(url, i + 1);
      console.log('staged ✓');
      urlMap.set(url, null); // mark as uploaded, CDN URL pending
    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 80)}`);
    }
    await sleep(500);
  }

  // 2. Poll Shopify Files until all review images are READY
  console.log('\nWaiting for Shopify to process uploaded files...');
  await sleep(5000);

  let ready = [];
  for (let attempt = 0; attempt < 15; attempt++) {
    const data = await gql(`
      query {
        files(first: 250, query: "filename:review- status:READY") {
          nodes {
            ... on MediaImage {
              image { url }
              originalSource { url }
            }
          }
        }
      }
    `);
    ready = data.files.nodes.filter(n => n.image?.url);
    console.log(`  attempt ${attempt + 1}: ${ready.length}/${uniqueUrls.length} ready`);
    if (ready.length >= uniqueUrls.length) break;
    await sleep(3000);
  }

  if (ready.length === 0) {
    // Try without filename filter
    const data = await gql(`
      query {
        files(first: 250, query: "status:READY") {
          nodes {
            ... on MediaImage {
              image { url }
              originalSource { url }
            }
          }
        }
      }
    `);
    ready = data.files.nodes.filter(n => n.image?.url && n.originalSource?.url?.includes('review-'));
  }

  console.log(`\nGot ${ready.length} Shopify CDN URLs`);

  if (ready.length === 0) {
    console.error('No CDN URLs retrieved — check Shopify Files dashboard manually');
    process.exit(1);
  }

  // 3. Build mapping: we uploaded in order 1..N, CDN files come back sorted newest-first
  // Match by index: ready[0] → uniqueUrls[N-1], etc. (newest first)
  const sorted = [...ready].reverse(); // oldest first = upload order
  for (let i = 0; i < Math.min(sorted.length, uniqueUrls.length); i++) {
    urlMap.set(uniqueUrls[i], sorted[i].image.url);
  }

  // 4. Patch lib/reviews.ts
  let patched = source;
  let replaced = 0;
  for (const [etsy, cdn] of urlMap) {
    if (!cdn) continue;
    patched = patched.replaceAll(etsy, cdn);
    replaced++;
    console.log(`  ${etsy.slice(-35)} → ${cdn.slice(-35)}`);
  }

  fs.writeFileSync(reviewsPath, patched);
  console.log(`\nPatched ${replaced}/${uniqueUrls.length} URLs in lib/reviews.ts`);
  if (replaced < uniqueUrls.length) {
    console.warn(`${uniqueUrls.length - replaced} URLs not replaced — check Shopify Files dashboard`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
