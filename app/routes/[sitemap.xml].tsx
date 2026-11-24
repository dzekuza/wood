import type {Route} from './+types/[sitemap.xml]';
import {getSitemapIndex} from '@shopify/hydrogen';

export async function loader({
  request,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemapIndex({
    storefront,
    request,
  });

  // Drop the `blogs` sub-sitemap: `/blogs` is already listed in the `pages`
  // sitemap, and `/blogs/news` 301-redirects to `/blogs`.
  const xml = (await response.text()).replace(
    /<sitemap>\s*<loc>[^<]*\/sitemap\/blogs\/[^<]*<\/loc>\s*<\/sitemap>\s*/g,
    '',
  );

  return new Response(xml, {
    status: response.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
