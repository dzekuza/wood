export const SITE_NAME = 'Craft Wood Furniture';
export const SITE_DOMAIN = 'craftwoodfurniture.co.uk';

/** The one host canonical links point at. Must match the primary domain set in
 *  Shopify/Oxygen, whose 301 sends the bare domain here — if they disagree,
 *  Google may ignore both. */
export const CANONICAL_HOST = `www.${SITE_DOMAIN}`;

/** True only for the public domain. Every other host that serves the storefront
 *  (the `*.myshopify.dev` Oxygen URL, preview deployments) must stay out of
 *  Google, or it competes with the real site as duplicate content. */
export function isPublicHost(hostname: string): boolean {
  return hostname === SITE_DOMAIN || hostname === CANONICAL_HOST;
}

/** The trading company, from its public business details. Shown in the footer
 *  and on the contact page, and published as `Organization` schema. The street
 *  address is the registered business address, not necessarily the workshop. */
export const COMPANY = {
  legalName: 'CRAFTWOOD FURNITURE LTD',
  companyNumber: '11805480',
  vatNumber: 'GB 367201410',
  address: {
    street: '17 Sherwood Street',
    locality: 'Tonypandy',
    area: 'Llwynpia, Rhondda Cynon Taf',
    postcode: 'CF40 2TB',
    country: 'GB',
  },
} as const;

/** One-line form for the footer and plain-text files. */
export const COMPANY_LEGAL_LINE = `${COMPANY.legalName} · Company no. ${COMPANY.companyNumber} · VAT no. ${COMPANY.vatNumber} · ${COMPANY.address.street}, ${COMPANY.address.area.split(',')[0]}, ${COMPANY.address.locality} ${COMPANY.address.postcode}`;

/** Email is the shop's only contact channel — there is no phone line. Do not
 *  reintroduce a `tel:` link without a real, answered number. */
export const CONTACT_EMAIL = 'hello@craftwoodfurniture.co.uk';

/** Display name for the blog section (`/blogs`). The header link's label comes
 *  from the Shopify main menu, so rename it there too if this changes. */
export const BLOG_LABEL = 'Advice & Inspiration';

/** The shop runs exactly two social accounts — Facebook and Pinterest. One list,
 *  used by both the announcement bar and the footer, so the two can never drift
 *  apart again. */
export const SOCIAL_LINKS = [
  {platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61567496682291'},
  {platform: 'pinterest', label: 'Pinterest', url: 'https://uk.pinterest.com/craftwoodfurniture_homedecor/'},
] as const;

export type SocialPlatform = (typeof SOCIAL_LINKS)[number]['platform'];

/** Rotating strings for the top announcement bar, ~4s each. Copy signed off by
 *  the shop: free delivery applies to every order (no threshold), and the first
 *  line names the workshop rather than a location. */
export const ANNOUNCEMENT_MESSAGES = [
  'Handcrafted solid oak furniture, made at CraftWood Furniture',
  'Free UK delivery on all orders',
  'Every piece cut, joined and finished in our own workshop',
];


/**
 * Total customer reviews behind the homepage headline. The star average is real
 * — it comes from every product's `reviews.product_reviews` metafield — but that
 * metafield only carries the reviews that were synced onto products, a fraction
 * of the shop's Etsy history. The count shown to shoppers is this signed-off
 * store-wide figure instead, so it does not read as 166 lifetime reviews.
 */
export const STORE_REVIEW_COUNT = 1400;

/** The shop's Etsy reviews — linked from the homepage testimonials as proof the
 *  reviews (and the 1.4k count) are real, independently hosted feedback. */
export const ETSY_REVIEWS_URL =
  'https://www.etsy.com/uk/shop/CraftWoodFurniture#reviews';

/**
 * Fallback display order for category lists (homepage grid, Categories page,
 * shop sidebar). Every list is data-driven — it renders every collection the
 * storefront returns that `shouldHideCollection` does not filter out — so a new
 * collection created in Admin appears without a deploy.
 *
 * The merchant controls the order with the collection metafield
 * `custom.sort_order` (integer, lowest first); see `compareCategories`. This
 * list only orders collections that have no sort order set.
 */
export const HOMEPAGE_CATEGORY_ORDER = [
  'solid-oak-mantel-beams',
  'solid-oak-coat-racks',
  'solid-oak-door-stops',
  'solid-oak-fireplace-surrounds',
  'solid-oak-cube-blocks',
  'solid-oak-shelves',
  'console-tables',
];

/** Sort key for a collection handle — unlisted handles sort to the end. */
function homepageCategoryRank(handle: string) {
  const index = HOMEPAGE_CATEGORY_ORDER.indexOf(handle);
  return index === -1 ? HOMEPAGE_CATEGORY_ORDER.length : index;
}

/** The shape every category query selects for ordering. */
export type SortableCategory = {
  handle: string;
  sortOrder?: {value: string} | null;
};

function merchantSortOrder(category: SortableCategory) {
  const value = Number.parseInt(category.sortOrder?.value ?? '', 10);
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

/**
 * `Array.sort` comparator for category lists: the merchant's
 * `custom.sort_order` first (unset sorts last), then `HOMEPAGE_CATEGORY_ORDER`.
 * `Array.sort` is stable, so remaining ties keep Shopify's order.
 */
export function compareCategories(a: SortableCategory, b: SortableCategory) {
  const bySortOrder = merchantSortOrder(a) - merchantSortOrder(b);
  if (bySortOrder !== 0 && !Number.isNaN(bySortOrder)) return bySortOrder;
  return homepageCategoryRank(a.handle) - homepageCategoryRank(b.handle);
}

export const FLAGSHIP_PAGE_ROUTES = {
  about: '/about',
  contact: '/contact',
} as const;

const HIDDEN_COLLECTION_HANDLES = new Set([
  // Curated merchandising lists, not categories — `most-popular` drives the
  // homepage's "Most popular" row, so it must never also render *as* a
  // category now that the grid enumerates collections instead of naming six.
  'most-popular',
  'bedroom',
  'dining-room',
  'living-room',
  'home-page',
  'homepage',
]);

const HIDDEN_COLLECTION_TITLES = new Set([
  'Most popular',
  'Bedroom',
  'Dining Room',
  'Living Room',
  'Home page',
  'Homepage',
]);

export type FlagshipPageHandle = keyof typeof FLAGSHIP_PAGE_ROUTES;

export function getPagePath(handle: string) {
  return FLAGSHIP_PAGE_ROUTES[handle as FlagshipPageHandle] ?? `/pages/${handle}`;
}

export function getFlagshipPagePath(handle: string) {
  return FLAGSHIP_PAGE_ROUTES[handle as FlagshipPageHandle] ?? null;
}

export function shouldHideCollection({
  handle,
  title,
}: {
  handle?: string | null;
  title?: string | null;
}) {
  return (
    (handle ? HIDDEN_COLLECTION_HANDLES.has(handle) : false) ||
    (title ? HIDDEN_COLLECTION_TITLES.has(title) : false)
  );
}
