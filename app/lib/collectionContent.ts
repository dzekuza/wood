/**
 * Search copy for the category pages: a keyword-led title and description,
 * a short buying guide and FAQs. Only facts the shop already publishes in
 * `llms.txt` are stated here — solid European oak, made to order, a choice of
 * sizes and six oil colours, custom sizes on request, free UK delivery,
 * dispatch within up to 5 days and delivery in 2 to 3 working days (the same figures as the product page's
 * default lead time). Sizes and options in `specs` come from the product pages' option lists; re-check them when
 * the Shopify options change. Anything the merchant sets in Shopify
 * (`collection.seo`, `collection.description`) still wins over this copy.
 */

export type CollectionFaq = {question: string; answer: string};

export type CollectionSpec = {label: string; value: string};
export type CollectionLink = {label: string; to: string};

export type CollectionContent = {
  seoTitle: string;
  seoDescription: string;
  guideHeading: string;
  guide: string[];
  /** "At a glance" facts, taken from the live product option lists. */
  specs: CollectionSpec[];
  /** Internal links to related products and categories. */
  links: CollectionLink[];
  faqs: CollectionFaq[];
};

const SHARED_FAQS: CollectionFaq[] = [
  {
    question: 'How long does delivery take and what does it cost?',
    answer:
      'Delivery is free across the UK. Every piece is made to order in our workshop, and it dispatches within up to 5 days. Delivery then takes 2 to 3 working days.',
  },
  {
    question: 'Can I order a custom size?',
    answer:
      'Yes. Custom sizes are available on request, so message us before you order and we will confirm what we can make.',
  },
  {
    question: 'What finish does the oak come in?',
    answer:
      'Most pieces come in a choice of six oil colours. Oil leaves the grain visible and can be refreshed later with a fresh coat.',
  },
];

export const COLLECTION_CONTENT: Record<string, CollectionContent> = {
  'solid-oak-mantel-beams': {
    seoTitle: 'Solid Oak Mantel Beams UK',
    seoDescription:
      'Handmade solid oak mantel beams, made to order in our UK workshop. Choice of sizes and six oil colours, with free UK delivery.',
    guideHeading: 'Choosing an oak mantel beam',
    guide: [
      'A solid oak mantel beam is a single length of European oak fixed above a fireplace or stove. Ours come in beam sizes from 3" x 4" to 10" x 6" and lengths from 3ft to 6.5ft, made to order and delivered free across the UK.',
      'An oak mantel beam gives a fireplace a solid, natural focal point. Ours are made from solid European oak, cut, joined and finished in our own workshop, so the grain you see is the grain all the way through.',
      'Pick the length to suit the chimney breast and the depth to suit what you want to display. If your fireplace has a stove or open fire, check the stove maker’s guidance on the clearance needed above the appliance before you fix a beam in place.',
      'Oak is a natural material, so grain, knots and small cracks vary from beam to beam. That variation is part of the look of a handmade piece.',
    ],
    specs: [
      {label: 'Beam size (front x top)', value: '3" x 4" up to 10" x 6" (sizes vary by length)'},
      {label: 'Length', value: '3ft to 6.5ft'},
      {label: 'Oil colours', value: 'White, Light Grey, Grey, Dark, Old Oak and Clear'},
      {label: 'Surface styles', value: 'Sanded, Lightly Worked or Heavily Worked'},
      {label: 'Fixings', value: 'Pre-drilled mounting holes and concealed fixings for solid walls'},
      {label: 'Size tolerance', value: 'Finished dimensions can vary by about ⅓ inch'},
      {label: 'Dispatch', value: 'Up to 5 days, then 2 to 3 working days delivery. Free UK delivery'},
    ],
    links: [
      {label: 'Solid oak mantel beam', to: '/products/solid-oak-mantel-beam'},
      {label: 'Flamed solid oak mantel beam', to: '/products/flamed-solid-oak-mantel-beam'},
      {label: 'Mantel beam with corbels', to: '/products/solid-oak-mantel-beam-with-corbels'},
      {label: 'Oak fireplace surrounds', to: '/collections/solid-oak-fireplace-surrounds'},
      {label: 'Oak floating shelves', to: '/collections/solid-oak-shelves'},
    ],
    faqs: [
      {
        question: 'Are your mantel beams solid oak or hollow?',
        answer:
          'They are made from solid European oak, not veneer or oak-effect board.',
      },
      {
        question: 'Can I put an oak mantel beam above a wood burner?',
        answer:
          'It depends on the stove and the distance. Check the stove manufacturer’s required clearance for combustible materials, and contact us if you need a different size to meet it.',
      },
      ...SHARED_FAQS,
    ],
  },
  'solid-oak-fireplace-surrounds': {
    seoTitle: 'Solid Oak Fireplace Surrounds UK',
    seoDescription:
      'Handmade solid oak fireplace surrounds, made to order in our UK workshop. Choice of sizes and six oil colours, with free UK delivery.',
    guideHeading: 'Choosing an oak fireplace surround',
    guide: [
      'A solid oak fireplace surround is a mantel beam with two matching uprights that frame the opening. Ours are made to order from European oak, with the beam and upright sizes chosen to suit your fireplace.',
      'A solid oak fireplace surround frames the fire opening and sets the tone for the room. Each one is made to order from solid European oak in our own workshop.',
      'Measure the width and height of your fireplace opening and the space around it before you choose a size. If you are fitting a stove or open fire, follow the manufacturer’s clearance guidance for timber near the heat.',
      'Choose from six oil colours, from light and natural to deeper tones. Oak varies naturally in grain and knots, so no two surrounds look exactly alike.',
    ],
    specs: [
      {label: 'Mantel beam (front x top x length)', value: '5" x 4" x 4ft up to 8" x 6" x 5ft'},
      {label: 'Upstands (front x depth x height)', value: '5" x 4" x 3ft up to 8" x 6" x 4ft'},
      {label: 'Oil colours', value: 'White, Light Grey, Grey, Dark, Old Oak and Clear'},
      {label: 'Surface styles', value: 'Sanded, Lightly Worked or Heavily Worked'},
      {label: 'Custom sizes', value: 'Contact us before ordering'},
      {label: 'Dispatch', value: 'Up to 5 days, then 2 to 3 working days delivery. Free UK delivery'},
    ],
    links: [
      {label: 'Solid oak fireplace surround', to: '/products/solid-oak-fireplace-surround'},
      {label: 'Solid oak mantel beam', to: '/products/solid-oak-mantel-beam'},
      {label: 'Oak mantel beams', to: '/collections/solid-oak-mantel-beams'},
    ],
    faqs: [
      {
        question: 'Is the surround made from solid oak?',
        answer:
          'Yes. Our surrounds are made from solid European oak and finished with oil in our own workshop.',
      },
      {
        question: 'How do I measure for a fireplace surround?',
        answer:
          'Measure the width and height of the opening and the wall space available around it. If you are unsure, email us your measurements and we will help you choose.',
      },
      ...SHARED_FAQS,
    ],
  },
  'solid-oak-shelves': {
    seoTitle: 'Solid Oak Floating Shelves UK',
    seoDescription:
      'Handmade solid oak floating shelves, made to order in our UK workshop. Choice of sizes and six oil colours, with free UK delivery.',
    guideHeading: 'Choosing solid oak shelves',
    guide: [
      'Our solid oak floating shelves are 4cm thick, 15 to 30cm deep and 30 to 150cm long, with hidden fixings or black brackets. Each is made to order and delivered free across the UK.',
      'Solid oak floating shelves are a simple way to add storage and display space without visible brackets. Ours are made to order from solid European oak, so they are strong, repairable and age well.',
      'Choose the length to suit your wall and the depth to suit what you will put on it. Fix into a suitable wall for the load, using fixings that match the wall type, whether that is masonry, stud or plasterboard.',
      'Oil leaves the oak grain visible and is easy to refresh. Expect natural differences in grain, knots and small cracks between shelves.',
    ],
    specs: [
      {label: 'Thickness', value: '4cm'},
      {label: 'Depth', value: '15cm to 30cm'},
      {label: 'Length', value: '30cm to 150cm'},
      {label: 'Fixings', value: 'Hidden fixings (arrives pre-drilled) or black brackets'},
      {label: 'Oil colours', value: 'White, Light Grey, Grey, Dark, Old Oak and Clear'},
      {label: 'Dispatch', value: 'Up to 5 days, then 2 to 3 working days delivery. Free UK delivery'},
    ],
    links: [
      {label: 'Solid oak floating shelf', to: '/products/solid-oak-floating-shelf'},
      {label: 'Solid oak shelf with black metal brackets', to: '/products/solid-oak-shelf-black-metal-brackets-4cm'},
      {label: 'Solid oak mantel beam', to: '/products/solid-oak-mantel-beam'},
      {label: 'Oak coat racks', to: '/collections/solid-oak-coat-racks'},
    ],
    faqs: [
      {
        question: 'Are these floating shelves solid oak?',
        answer:
          'Yes, they are made from solid European oak rather than oak veneer or oak-effect board.',
      },
      {
        question: 'How do I care for an oiled oak shelf?',
        answer:
          'Wipe with a damp cloth and re-oil occasionally to keep the finish even. Oil can be reapplied at home without sanding the whole piece back.',
      },
      ...SHARED_FAQS,
    ],
  },
  'solid-oak-coat-racks': {
    seoTitle: 'Solid Oak Coat Racks UK',
    seoDescription:
      'Handmade solid oak coat racks, made to order in our UK workshop. Choice of sizes and six oil colours, with free UK delivery.',
    guideHeading: 'Choosing an oak coat rack',
    guide: [
      'Our solid oak coat racks come with 2 to 12 hooks, from 40cm to 150cm long, in five hook colours. Each is made to order, supplied assembled with fixings for a solid wall.',
      'A wall-mounted oak coat rack makes a hallway tidier and warmer. Ours are made to order from solid European oak in our own workshop.',
      'Pick the width by how many coats and bags you need to hang, and fix the rack into a solid fixing point because coats pull outwards and downwards more than you expect.',
      'Choose from six oil colours to match your hallway. Natural grain and knots mean each rack is slightly different.',
    ],
    specs: [
      {label: 'Hooks', value: '2 to 12 per rack'},
      {label: 'Length', value: '40cm (2 hooks) to 150cm (12 hooks)'},
      {label: 'Height and depth', value: '17cm high, 10cm deep (rack with shelf)'},
      {label: 'Hook colours', value: 'Black, Chrome, Gold, Old Brass or Old Copper'},
      {label: 'Oil colours', value: 'White, Light Grey, Grey, Dark, Old Oak and Clear'},
      {label: 'Fixings', value: 'Supplied assembled, with fixings for a solid wall'},
      {label: 'Dispatch', value: 'Up to 5 days, then 2 to 3 working days delivery. Free UK delivery'},
    ],
    links: [
      {label: 'Coat rack with shelf', to: '/products/coat-rack-with-shelf'},
      {label: 'Coat rack rail', to: '/products/coat-rack-rail'},
      {label: 'Coat rack set of 2', to: '/products/coat-rack-set-of-2'},
      {label: 'Oak console tables', to: '/collections/console-tables'},
    ],
    faqs: [
      {
        question: 'Is the coat rack made from solid oak?',
        answer:
          'Yes. It is made from solid European oak and finished with oil in our own workshop.',
      },
      {
        question: 'How should I fix a coat rack to the wall?',
        answer:
          'Use fixings suited to your wall type and make sure at least some go into a solid fixing point. A rack that holds several heavy coats needs secure fixings.',
      },
      ...SHARED_FAQS,
    ],
  },
  'console-tables': {
    seoTitle: 'Solid Oak Console Tables UK',
    seoDescription:
      'Handmade solid oak console tables, made to order in our UK workshop. Choice of sizes and six oil colours, with free UK delivery.',
    guideHeading: 'Choosing an oak console table',
    guide: [
      'Our solid oak console tables have a 4cm thick oak top on black steel hairpin legs, in depths from 15 to 30cm and lengths from 60 to 150cm. Each is made to order and delivered free across the UK.',
      'A solid oak console table suits a hallway, landing or the wall behind a sofa. Ours are made to order from solid European oak in our own workshop.',
      'Measure the wall space and how far the table can project before it blocks a doorway or walkway. A narrower depth often suits a hallway best.',
      'Pick from six oil colours. Oak varies naturally in grain and knots, so each table has its own character.',
    ],
    specs: [
      {label: 'Tabletop thickness', value: '4cm'},
      {label: 'Tabletop depth', value: '15cm to 30cm'},
      {label: 'Tabletop length', value: '60cm to 150cm'},
      {label: 'Legs', value: 'Black steel three-rod hairpin legs, 71cm to 102cm high'},
      {label: 'Overall height', value: 'Leg height plus about 4cm for the top'},
      {label: 'Oil colours', value: 'White, Light Grey, Grey, Dark, Old Oak and Clear'},
      {label: 'Dispatch', value: 'Up to 5 days, then 2 to 3 working days delivery. Free UK delivery'},
    ],
    links: [
      {label: 'Solid oak console table with black hairpin legs', to: '/products/solid-oak-console-table-with-black-hairpin-legs'},
      {label: 'Oak floating shelves', to: '/collections/solid-oak-shelves'},
      {label: 'Oak coat racks', to: '/collections/solid-oak-coat-racks'},
      {label: 'Solid oak mantel beam', to: '/products/solid-oak-mantel-beam'},
    ],
    faqs: [
      {
        question: 'Are your console tables solid oak?',
        answer:
          'Yes. They are made from solid European oak rather than veneered board.',
      },
      {
        question: 'What size console table should I choose for a hallway?',
        answer:
          'Measure the wall length and leave space to walk past comfortably. If your hallway is narrow, ask us about a custom depth.',
      },
      ...SHARED_FAQS,
    ],
  },
};
