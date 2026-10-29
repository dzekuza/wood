#!/usr/bin/env python3
"""Build the storefront's review data from an Etsy reviews export.

    python3 -I scripts/build-etsy-reviews.py <export-folder>

<export-folder> holds `reviews.csv` and `media/review_photos/`. Review text and
reviewer names are copied verbatim — nothing is reworded, merged or renamed.
Writes `app/data/etsy-*.ts` and resized photos to `public/review-images/etsy/`.
"""
import collections
import csv
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1].rstrip('/') + '/'

# Etsy listing id -> (Shopify handle, product label). Listings the shop sells
# as the same item in different sizes all feed one product page. A listing with
# no clear Shopify product is left out, so that product shows no stars.
PRODUCTS = {
    'solid-oak-mantel-beam': 'Solid Oak Mantel Beam',
    'flamed-solid-oak-mantel-beam': 'Flamed Oak Mantel Beam',
    'solid-oak-mantel-beam-with-corbels': 'Oak Mantel Beam with Corbels',
    'solid-oak-fireplace-surround': 'Solid Oak Fireplace Surround',
    'solid-oak-floating-shelf': 'Solid Oak Floating Shelf',
    'coat-rack-with-shelf': 'Solid Oak Coat Rack with Shelf',
    'coat-rack-rail': 'Solid Oak Coat Rack with Hooks',
    'coat-rack-set-of-2': 'Set of 2 Oak Coat Racks',
    'solid-oak-console-table-with-black-hairpin-legs': 'Oak Console Table',
    'solid-oak-door-stop': 'Solid Oak Door Stop',
    'solid-oak-block-side-table': 'Solid Oak Block Side Table',
}
LISTINGS = {
    # mantel beams (all sizes) incl. the floating mantle shelf listing
    **dict.fromkeys(
        ['1165510881', '666135058', '1588557025', '1580055817', '1288554700',
         '1302449354', '1565867662', '1173116558', '1208811120'],
        'solid-oak-mantel-beam'),
    '1222814495': 'flamed-solid-oak-mantel-beam',
    '1208896362': 'solid-oak-mantel-beam-with-corbels',
    '1289810598': 'solid-oak-fireplace-surround',
    '1290470632': 'solid-oak-fireplace-surround',
    '1683781632': 'solid-oak-floating-shelf',
    '1901098297': 'solid-oak-floating-shelf',
    '1756697238': 'solid-oak-floating-shelf',
    **dict.fromkeys(
        ['1201803931', '1749146074', '1265363569', '1245199284', '1673953038',
         '1574382358', '1245195896', '1250599356', '1265362117'],
        'coat-rack-with-shelf'),
    '1746499278': 'coat-rack-rail',
    '1763341903': 'coat-rack-rail',
    '1588553787': 'coat-rack-set-of-2',
    '1439910030': 'coat-rack-set-of-2',
    '4516957031': 'solid-oak-console-table-with-black-hairpin-legs',
    '4518386564': 'solid-oak-console-table-with-black-hairpin-legs',
    '1278958361': 'solid-oak-door-stop',
    '1264945856': 'solid-oak-door-stop',
    '1266652474': 'solid-oak-block-side-table',
}
# Homepage mix: how many featured reviews each product contributes.
HOME_MIX = {
    'solid-oak-mantel-beam': 4, 'coat-rack-with-shelf': 3,
    'solid-oak-fireplace-surround': 2, 'solid-oak-floating-shelf': 2,
    'coat-rack-set-of-2': 1, 'coat-rack-rail': 1,
    'solid-oak-console-table-with-black-hairpin-legs': 1,
    'solid-oak-mantel-beam-with-corbels': 1,
    'flamed-solid-oak-mantel-beam': 1, 'solid-oak-door-stop': 1,
}
PER_PRODUCT = 12
MONTHS = {m: i for i, m in enumerate(
    'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}


def parse_date(raw):  # '28 Oct, 2026'
    day, rest = raw.split(' ', 1)
    month, year = rest.split(', ')
    return int(year), MONTHS[month[:3]], int(day)  # Etsy writes "Sept"


def norm(text):
    return re.sub(r'\s+', ' ', text).strip().lower()


rows = list(csv.DictReader(open(SRC + 'reviews.csv', encoding='utf-8-sig')))
total = len(rows)
shop = {'average': sum(int(r['rating']) for r in rows) / total, 'count': total}

by_handle = collections.defaultdict(list)
for row in rows:
    listing = row['product_url'].split('/listing/')[1].split('/')[0]
    handle = LISTINGS.get(listing)
    if handle:
        by_handle[handle].append(row)

ratings = {
    h: {'average': round(sum(int(r['rating']) for r in rs) / len(rs), 2), 'count': len(rs)}
    for h, rs in by_handle.items()
}


def featured(rs):
    """Readable 5-star reviews, photo ones first, newest first, no repeated text."""
    pool = [r for r in rs if r['rating'] == '5' and 40 <= len(r['review'].strip()) <= 320]
    pool.sort(key=lambda r: (not r['review_photo_files'], tuple(-n for n in parse_date(r['date']))))
    seen, out = set(), []
    for r in pool:
        key = norm(r['review'])
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


photo_dir = os.path.join(ROOT, 'public/review-images/etsy')
os.makedirs(photo_dir, exist_ok=True)


def to_review(row, handle):
    images = []
    if row['review_photo_files'].strip():
        dest = f"{photo_dir}/{row['review_id']}.jpg"
        if not os.path.exists(dest):
            subprocess.run(['sips', '-Z', '1000', '-s', 'formatOptions', '70',
                            SRC + row['review_photo_files'].strip(), '--out', dest],
                           check=True, capture_output=True)
        images.append(f"/review-images/etsy/{row['review_id']}.jpg")
    year, month, _ = parse_date(row['date'])
    review = {
        'author': row['name'].strip() or 'Etsy buyer',
        'rating': int(row['rating']),
        'body': row['review'].strip(),
        'created_at': f"{list(MONTHS)[month]} {year}",
        'product': PRODUCTS[handle],
        'productHandle': handle,
    }
    if images:
        review['images'] = images
    return review


product_reviews = {h: [to_review(r, h) for r in featured(rs)[:PER_PRODUCT]]
                   for h, rs in by_handle.items()}
home = []
for handle, n in HOME_MIX.items():
    home += product_reviews[handle][:n]
# Interleave products so neighbouring cards differ.
home = [r for _, r in sorted(enumerate(home), key=lambda p: (p[0] % 3, p[0]))]

HEADER = '// Generated by scripts/build-etsy-reviews.py from the Etsy reviews export — do not edit by hand.\n'


def write(path, body):
    with open(os.path.join(ROOT, path), 'w', encoding='utf-8') as f:
        f.write(HEADER + body)


def ts(value):
    return json.dumps(value, indent=2, ensure_ascii=False)


write('app/data/etsy-ratings.ts', f"""
/** Every review in the export, shop-wide. */
export const ETSY_SHOP_RATING = {ts({'average': round(shop['average'], 3), 'count': shop['count']})} as const;

/** Rating per product page, from the Etsy listings that sell that product. */
export const ETSY_RATINGS_BY_HANDLE: Record<string, {{average: number; count: number}}> = {ts(ratings)};
""")
write('app/data/etsy-home-reviews.ts', f"""import type {{ProductReview}} from '~/components/ReviewsSection';

export const ETSY_HOME_REVIEWS: ProductReview[] = {ts(home)};
""")
write('app/data/etsy-product-reviews.server.ts', f"""import type {{ProductReview}} from '~/components/ReviewsSection';

/** Featured reviews per product handle. Server-only: the loader passes one product's set down. */
export const ETSY_PRODUCT_REVIEWS: Record<string, ProductReview[]> = {ts(product_reviews)};
""")
print(f"{total} reviews, shop avg {shop['average']:.3f}")
for h, r in sorted(ratings.items(), key=lambda x: -x[1]['count']):
    print(f"  {h:50} {r['average']} ({r['count']}) featured={len(product_reviews[h])}")
print('home cards', len(home), 'photos', len(os.listdir(photo_dir)))
