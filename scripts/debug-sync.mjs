import { readFileSync } from 'fs';

const envPath = new URL('../.env', import.meta.url).pathname;
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

function splitLine(line) {
  const result = []; let inQuote = false, current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuote) { inQuote = true; continue; }
    if (ch === '"' && inQuote) { if (line[i+1] === '"') { current += '"'; i++; } else inQuote = false; continue; }
    if (ch === ',' && !inQuote) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const rawLines = text.split('\n');
  const headers = splitLine(rawLines[0]);
  const rows = [];
  let i = 1;
  while (i < rawLines.length) {
    let line = rawLines[i];
    // join continuation lines for multiline quoted fields
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < rawLines.length) {
      i++; line += '\n' + rawLines[i];
    }
    const vals = splitLine(line);
    rows.push(Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? ''])));
    i++;
  }
  return rows;
}

const res = await fetch(`https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEET_ID}/export?format=csv`);
const rows = parseCSV(await res.text());

console.log(`Total rows in sheet: ${rows.length}\n`);

// Show all unique handles
const handles = [...new Set(rows.map(r => r['Handle']))];
console.log(`Unique handles (${handles.length}):`, handles.join(', '), '\n');

// Show walnut-platform-bed specifically
const bed = rows.filter(r => r['Handle'] === 'walnut-platform-bed');
console.log(`walnut-platform-bed rows: ${bed.length}`);
bed.forEach((r, i) => console.log(`  Row ${i+1}: price=${r['Variant Price']} sku=${r['Variant SKU']}`));

// Show all prices for cross-check
console.log('\nAll products first-variant prices:');
const seen = new Set();
rows.forEach(r => {
  if (!seen.has(r['Handle']) && r['Handle']) {
    seen.add(r['Handle']);
    console.log(`  ${r['Handle']}: $${r['Variant Price']}`);
  }
});
