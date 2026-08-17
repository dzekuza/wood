export const SITE_NAME = 'Craft Wood Furniture';
export const SITE_DOMAIN = 'craftwoodfurniture.co.uk';

export const CONTACT_EMAIL = 'hello@craftwoodfurniture.co.uk';
export const CONTACT_PHONE_DISPLAY = '+44 7904 497890';
export const CONTACT_PHONE_HREF = '+447904497890';

export const WORKSHOP_LOCATION = 'Aldsworth workshop, Cotswolds';
export const WORKSHOP_VISIT_NOTE = 'By appointment only';
export const WORKSHOP_HOURS = [
  'Mon-Fri, 09:00-17:30 GMT',
  'Saturday visits available by appointment',
];

export const FLAGSHIP_PAGE_ROUTES = {
  about: '/about',
  contact: '/contact',
} as const;

const HIDDEN_COLLECTION_HANDLES = new Set([
  'bedroom',
  'dining-room',
  'living-room',
  'home-page',
  'homepage',
]);

const HIDDEN_COLLECTION_TITLES = new Set([
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
