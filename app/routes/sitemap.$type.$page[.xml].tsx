import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';

// Codegen cannot interpolate constants, so this is `ADDON_TAG` from ~/lib/upsells spelled out.
const ADDON_HANDLES_QUERY = `#graphql
  query SitemapAddonHandles {
    products(first: 100, query: "tag:addon") {
      nodes {
        handle
      }
    }
  }
` as const;

/** Drops the `<url>` entries of add-on (surcharge) products. Hydrogen's sitemap
 *  helper has no tag filter, so the generated XML is trimmed after the fact. */
function removeProductUrls(xml: string, handles: string[]) {
  return xml.replace(/<url>[\s\S]*?<\/url>\s*/g, (entry) => {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    return handles.some((handle) => loc.endsWith(`/products/${handle}`))
      ? ''
      : entry;
  });
}

/** Curated lists that are noindex on the storefront, so they stay out of the sitemap. */
const NOINDEX_COLLECTION_HANDLES = ['most-popular'];

/** Drops the `<url>` entries whose path ends with one of `suffixes`. */
function removeUrlsBySuffix(xml: string, suffixes: string[]) {
  return xml.replace(/<url>[\s\S]*?<\/url>\s*/g, (entry) => {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    return suffixes.some((suffix) => loc.endsWith(suffix)) ? '' : entry;
  });
}

/** Real pages that Shopify's resource sitemap never lists: the homepage and the
 *  listing routes this storefront builds itself. Served in the `pages` sitemap. */
const STATIC_PATHS = [
  '/',
  '/collections',
  '/collections/all',
  '/blogs',
  '/about',
  '/contact',
];

/** Shopify lists these pages under /pages/, but the storefront serves them (or
 *  redirects them) elsewhere. Listing a redirecting URL wastes crawl budget. */
const PAGE_PATH_OVERRIDES: Record<string, string> = {'/pages/contact': '/contact'};

/** The shop has a single blog; the article sitemap only gives the article handle. */
const ARTICLE_BLOG_HANDLE = 'news';

function addStaticUrls(xml: string, baseUrl: string) {
  for (const [from, to] of Object.entries(PAGE_PATH_OVERRIDES)) {
    xml = xml.replace(`<loc>${baseUrl}${from}</loc>`, `<loc>${baseUrl}${to}</loc>`);
  }
  const entries = STATIC_PATHS.filter(
    (path) => !xml.includes(`<loc>${baseUrl}${path}</loc>`),
  ).map(
    (path) =>
      `<url>\n  <loc>${baseUrl}${path}</loc>\n  <changefreq>weekly</changefreq>\n</url>\n`,
  );
  return xml.replace('</urlset>', `${entries.join('')}</urlset>`);
}

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // One market, one language — no /EN-US/... alternates (they 404).
    locales: [],
    getLink: ({type, baseUrl, handle}) =>
      type === 'articles'
        ? `${baseUrl}/blogs/${ARTICLE_BLOG_HANDLE}/${handle}`
        : `${baseUrl}/${type}/${handle}`,
  });

  const cacheHeaders = {
    'Content-Type': 'application/xml',
    'Cache-Control': `max-age=${60 * 60 * 24}`,
  };

  if (params.type === 'pages') {
    const xml = addStaticUrls(await response.text(), new URL(request.url).origin);
    return new Response(xml, {status: response.status, headers: cacheHeaders});
  }

  if (params.type === 'collections') {
    const xml = removeUrlsBySuffix(
      await response.text(),
      NOINDEX_COLLECTION_HANDLES.map((handle) => `/collections/${handle}`),
    );
    return new Response(xml, {status: response.status, headers: cacheHeaders});
  }

  if (params.type !== 'products') {
    response.headers.set('Cache-Control', cacheHeaders['Cache-Control']);
    return response;
  }

  const {products} = await storefront.query(ADDON_HANDLES_QUERY);
  const addonHandles = products.nodes.map((node) => node.handle);
  const xml = removeProductUrls(await response.text(), addonHandles);

  return new Response(xml, {status: response.status, headers: cacheHeaders});
}
