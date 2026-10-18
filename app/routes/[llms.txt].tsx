import {COMPANY_LEGAL_LINE, CONTACT_EMAIL, SITE_NAME} from '~/lib/site';
import {getCanonicalUrl} from '~/lib/seo';

/** Plain-text overview for AI assistants (llmstxt.org). Facts only: if the shop's
 *  policies or offer change, change them here too. */
export function loader() {
  const body = `# ${SITE_NAME}

> Handmade solid oak furniture, made to order in our own workshop and delivered free across the UK.

We make mantel beams, fireplace surrounds, floating shelves, console tables, coat racks, block side tables and door stops from solid European oak. Most pieces can be ordered in a choice of sizes and six oil colours. Every piece is made to order and normally dispatches within 5 to 10 working days.

## Shop
- [All products](${getCanonicalUrl('/collections/all')}): every piece in one list
- [Categories](${getCanonicalUrl('/collections')}): mantel beams, shelves, coat racks, fireplace surrounds, console tables, cube blocks and door stops

## About and help
- [About the workshop](${getCanonicalUrl('/about')})
- [Advice and inspiration](${getCanonicalUrl('/blogs')}): care and buying guides
- [Contact](${getCanonicalUrl('/contact')}): ${CONTACT_EMAIL}
- [Delivery, returns and terms](${getCanonicalUrl('/policies')})

## Who we are
${COMPANY_LEGAL_LINE}

## Good to know
- Prices are in GBP and include free UK delivery.
- Oak is a natural material: grain, knots and small cracks vary between pieces.
- Custom sizes are available on request before ordering.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
