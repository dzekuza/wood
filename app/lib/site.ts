export const SITE_NAME = 'Craft Wood Furniture';
export const SITE_DOMAIN = 'craftwoodfurniture.co.uk';

/** Email is the shop's only contact channel — there is no phone line. Do not
 *  reintroduce a `tel:` link without a real, answered number. */
export const CONTACT_EMAIL = 'hello@craftwoodfurniture.co.uk';

/** The shop runs exactly two social accounts — Facebook and Pinterest. One list,
 *  used by both the announcement bar and the footer, so the two can never drift
 *  apart again.
 *  TODO: both URLs are still placeholders — swap in the real profile links. */
export const SOCIAL_LINKS = [
  {platform: 'facebook', label: 'Facebook', url: 'https://facebook.com'},
  {platform: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com'},
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
 * Display order for the homepage category grid. The grid itself is data-driven —
 * it renders every collection the storefront returns that `shouldHideCollection`
 * does not filter out — so a new collection created in Admin appears without a
 * deploy. This list only decides *where* a known handle sits; anything not named
 * here is appended after them, alphabetically by however Shopify returned it.
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
export function homepageCategoryRank(handle: string) {
  const index = HOMEPAGE_CATEGORY_ORDER.indexOf(handle);
  return index === -1 ? HOMEPAGE_CATEGORY_ORDER.length : index;
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
