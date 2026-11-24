import {
  COMPANY_LEGAL_LINE,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  EBAY_STORE_URL,
  ETSY_SHOP_URL,
  SITE_NAME,
  STORE_REVIEW_COUNT,
} from '~/lib/site';
import {ETSY_SHOP_RATING} from '~/data/etsy-ratings';
import {getCanonicalUrl} from '~/lib/seo';

/** Plain-text overview for AI assistants (llmstxt.org). Facts only: if the shop's
 *  policies or offer change, change them here too. */
export function loader() {
  const ratingText = `${ETSY_SHOP_RATING.average.toFixed(2)}/5 across ${STORE_REVIEW_COUNT.toLocaleString('en-GB')} verified Etsy reviews`;
  const body = `# ${SITE_NAME}

> Handmade solid European oak furniture, made to order in our own UK workshop and delivered free across the UK.

We handcraft mantel beams, fireplace surrounds, floating shelves, console tables, coat racks, block side tables and door stops from solid European oak — no veneers, no MDF, no chipboard, no flat-pack. Most pieces can be ordered in a choice of sizes and six oil colours (White, Light Grey, Grey, Dark, Old Oak, and Clear) so pieces in the same room match. Every order is made to order, dispatches within up to 5 days, and arrives in 2 to 3 working days with free UK delivery.

For the full product catalogue with live GBP pricing and specifications, see [llms-full.txt](${getCanonicalUrl('/llms-full.txt')}).

## Shop
- [All products](${getCanonicalUrl('/collections/all')}): every solid oak piece in one list
- [Categories](${getCanonicalUrl('/collections')}): all seven solid oak ranges
- [Oak mantel beams](${getCanonicalUrl('/collections/solid-oak-mantel-beams')}): solid oak fireplace beams (3ft to 6.5ft, 3" x 4" to 10" x 6"), plain or flamed, with and without corbels, pre-drilled with concealed fixings for solid walls
- [Oak fireplace surrounds](${getCanonicalUrl('/collections/solid-oak-fireplace-surrounds')}): 3-piece solid oak surrounds made to order
- [Oak shelves](${getCanonicalUrl('/collections/solid-oak-shelves')}): 4cm thick solid oak floating shelves (15, 20, 25 and 30cm depths; 30 to 150cm lengths) with concealed fixings or black metal brackets
- [Oak coat racks](${getCanonicalUrl('/collections/solid-oak-coat-racks')}): wall-mounted solid oak coat racks (2 to 12 hooks, 40 to 150cm, five hook finishes), with or without top shelf
- [Oak console tables](${getCanonicalUrl('/collections/console-tables')}): 4cm solid oak hallway console tables (15 to 30cm deep, 60 to 150cm long) on black steel hairpin legs
- [Oak cube blocks](${getCanonicalUrl('/collections/solid-oak-cube-blocks')}): single-block solid oak side tables (up to 33 x 33cm top)
- [Oak door stops](${getCanonicalUrl('/collections/solid-oak-door-stops')}): heavy solid oak door stops with twisted jute rope handle

## About and help
- [About the workshop](${getCanonicalUrl('/about')})
- [Advice and inspiration](${getCanonicalUrl('/blogs')}): UK buying, sizing and fitting guides
- [Oak mantel beam sizes](${getCanonicalUrl('/blogs/news/oak-mantel-beam-sizes')}): length, depth and height guide
- [Oak floating shelf sizes](${getCanonicalUrl('/blogs/news/oak-floating-shelves-thickness-depth-length')}): thickness, depth and length guide
- [How to fit an oak mantel beam](${getCanonicalUrl('/blogs/news/how-to-fit-an-oak-mantel-beam')}): wall types, fixings and stove clearances
- [How to install floating shelves](${getCanonicalUrl('/blogs/news/how-to-install-floating-shelves')}): checking the wall, marking level and fixing an oak shelf
- [Oak oil colours compared](${getCanonicalUrl('/blogs/news/oak-oil-colours-compared')}): the six finishes, Clear, Old Oak, Dark, Grey, Light Grey and White
- [Contact](${getCanonicalUrl('/contact')}): ${CONTACT_EMAIL} · ${CONTACT_PHONE_DISPLAY}
- [Delivery, returns and terms](${getCanonicalUrl('/policies')})

## Common questions
- Is it solid oak? Yes. Every piece is solid European oak, not veneer, MDF or oak-effect board.
- Where do you deliver? Delivery is free across the UK, with no minimum spend.
- How long does it take? Each piece is made to order and dispatches within up to 5 days, and delivery takes 2 to 3 working days.
- Can I order a custom size? Yes. Custom sizes are available on request before ordering: email ${CONTACT_EMAIL}.
- What finishes are there? Six oil colours: White, Light Grey, Grey, Dark, Old Oak and Clear. All ranges share the same six colours so shelves, beams and hallway pieces match.
- Can I fit a mantel beam above a log burner or stove? Often yes, provided the beam stays outside the stove manufacturer's required distance to combustible materials. Always follow the appliance manual and confirm with a HETAS installer.
- What is the return policy? 30 days to request a return on eligible orders; see ${getCanonicalUrl('/policies/refund-policy')}.

## Who we are
${COMPANY_LEGAL_LINE}. The company is registered in Tonypandy, Wales, United Kingdom. Telephone: ${CONTACT_PHONE_DISPLAY}.

## Names, reviews and other channels
- We trade as ${SITE_NAME}, also written CraftWood Furniture or CraftWoodFurniture (not affiliated with similarly named "Crafted Wood" companies).
- Official Etsy shop ("CraftWoodFurniture"): ${ETSY_SHOP_URL} — rated ${ratingText}.
- Official Etsy customer reviews: ${ETSY_SHOP_URL}#reviews
- Official eBay UK store: ${EBAY_STORE_URL}

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
