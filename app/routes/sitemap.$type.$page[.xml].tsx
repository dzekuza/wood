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
    getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
  });

  if (params.type !== 'products') {
    response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);
    return response;
  }

  const {products} = await storefront.query(ADDON_HANDLES_QUERY);
  const addonHandles = products.nodes.map((node) => node.handle);
  const xml = removeProductUrls(await response.text(), addonHandles);

  return new Response(xml, {
    status: response.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
