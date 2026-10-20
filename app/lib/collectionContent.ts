/**
 * Search copy for the category pages: a keyword-led title and description,
 * a short buying guide and FAQs. Only facts the shop already publishes in
 * `llms.txt` are stated here — solid European oak, made to order, a choice of
 * sizes and six oil colours, custom sizes on request, free UK delivery,
 * dispatch in 5 to 10 working days (the same figure as the product page's
 * default lead time). Anything the merchant sets in Shopify
 * (`collection.seo`, `collection.description`) still wins over this copy.
 */

export type CollectionFaq = {question: string; answer: string};

export type CollectionContent = {
  seoTitle: string;
  seoDescription: string;
  guideHeading: string;
  guide: string[];
  faqs: CollectionFaq[];
};

const SHARED_FAQS: CollectionFaq[] = [
  {
    question: 'How long does delivery take and what does it cost?',
    answer:
      'Delivery is free across the UK. Every piece is made to order in our workshop, and it normally dispatches within 5 to 10 working days. Transit time is additional.',
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
      'An oak mantel beam gives a fireplace a solid, natural focal point. Ours are made from solid European oak, cut, joined and finished in our own workshop, so the grain you see is the grain all the way through.',
      'Pick the length to suit the chimney breast and the depth to suit what you want to display. If your fireplace has a stove or open fire, check the stove maker’s guidance on the clearance needed above the appliance before you fix a beam in place.',
      'Oak is a natural material, so grain, knots and small cracks vary from beam to beam. That variation is part of the look of a handmade piece.',
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
      'A solid oak fireplace surround frames the fire opening and sets the tone for the room. Each one is made to order from solid European oak in our own workshop.',
      'Measure the width and height of your fireplace opening and the space around it before you choose a size. If you are fitting a stove or open fire, follow the manufacturer’s clearance guidance for timber near the heat.',
      'Choose from six oil colours, from light and natural to deeper tones. Oak varies naturally in grain and knots, so no two surrounds look exactly alike.',
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
      'Solid oak floating shelves are a simple way to add storage and display space without visible brackets. Ours are made to order from solid European oak, so they are strong, repairable and age well.',
      'Choose the length to suit your wall and the depth to suit what you will put on it. Fix into a suitable wall for the load, using fixings that match the wall type, whether that is masonry, stud or plasterboard.',
      'Oil leaves the oak grain visible and is easy to refresh. Expect natural differences in grain, knots and small cracks between shelves.',
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
      'A wall-mounted oak coat rack makes a hallway tidier and warmer. Ours are made to order from solid European oak in our own workshop.',
      'Pick the width by how many coats and bags you need to hang, and fix the rack into a solid fixing point because coats pull outwards and downwards more than you expect.',
      'Choose from six oil colours to match your hallway. Natural grain and knots mean each rack is slightly different.',
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
      'A solid oak console table suits a hallway, landing or the wall behind a sofa. Ours are made to order from solid European oak in our own workshop.',
      'Measure the wall space and how far the table can project before it blocks a doorway or walkway. A narrower depth often suits a hallway best.',
      'Pick from six oil colours. Oak varies naturally in grain and knots, so each table has its own character.',
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
