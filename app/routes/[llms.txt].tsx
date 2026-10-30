import {COMPANY_LEGAL_LINE, CONTACT_EMAIL, SITE_NAME} from '~/lib/site';
import {getCanonicalUrl} from '~/lib/seo';

/** Plain-text overview for AI assistants (llmstxt.org). Facts only: if the shop's
 *  policies or offer change, change them here too. */
export function loader() {
  const body = `# ${SITE_NAME}

> Handmade solid oak furniture, made to order in our own workshop and delivered free across the UK.

We make mantel beams, fireplace surrounds, floating shelves, console tables, coat racks, block side tables and door stops from solid European oak. Most pieces can be ordered in a choice of sizes and six oil colours. Every piece is made to order and dispatches within up to 5 days, and delivery takes 2 to 3 working days.

## Shop
- [All products](${getCanonicalUrl('/collections/all')}): every piece in one list
- [Categories](${getCanonicalUrl('/collections')}): all ranges
- [Oak mantel beams](${getCanonicalUrl('/collections/solid-oak-mantel-beams')}): solid oak fireplace beams in a choice of sizes, plain or flamed, with and without corbels
- [Oak fireplace surrounds](${getCanonicalUrl('/collections/solid-oak-fireplace-surrounds')}): solid oak surrounds made to order
- [Oak shelves](${getCanonicalUrl('/collections/solid-oak-shelves')}): solid oak floating shelves
- [Oak coat racks](${getCanonicalUrl('/collections/solid-oak-coat-racks')}): wall-mounted solid oak coat racks
- [Oak console tables](${getCanonicalUrl('/collections/console-tables')}): solid oak console tables for halls and landings
- [Oak cube blocks](${getCanonicalUrl('/collections/solid-oak-cube-blocks')}): block side tables
- [Oak door stops](${getCanonicalUrl('/collections/solid-oak-door-stops')}): solid oak door stops

## About and help
- [About the workshop](${getCanonicalUrl('/about')})
- [Advice and inspiration](${getCanonicalUrl('/blogs')}): care and buying guides
- [Oak mantel beam sizes](${getCanonicalUrl('/blogs/news/oak-mantel-beam-sizes')}): length, depth and height guide
- [Oak floating shelf sizes](${getCanonicalUrl('/blogs/news/oak-floating-shelves-thickness-depth-length')}): thickness, depth and length guide
- [Oak oil colours compared](${getCanonicalUrl('/blogs/news/oak-oil-colours-compared')}): the six finishes, clear to white
- [Contact](${getCanonicalUrl('/contact')}): ${CONTACT_EMAIL}
- [Delivery, returns and terms](${getCanonicalUrl('/policies')})

## Common questions
- Is it solid oak? Yes. Every piece is solid European oak, not veneer or oak-effect board.
- Where do you deliver? Delivery is free across the UK, with no minimum spend.
- How long does it take? Each piece is made to order and dispatches within up to 5 days, and delivery takes 2 to 3 working days.
- Can I order a custom size? Yes. Custom sizes are available on request before ordering: email ${CONTACT_EMAIL}.
- What finishes are there? Most pieces come in a choice of six oil colours.
- Can I fit a mantel beam above a stove? It depends on the stove and the distance. Follow the stove manufacturer's clearance guidance for timber.

## Who we are
${COMPANY_LEGAL_LINE}. The company is registered in Tonypandy, Wales, United Kingdom.

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
