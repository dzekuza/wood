import type {HomeContentQuery} from 'storefrontapi.generated';

/**
 * Homepage copy and imagery live in Shopify metaobjects so the shop owner can
 * edit them from Admin → Content → Metaobjects without a deploy.
 *
 *   home_page (singleton, handle "main")  — every section's headings
 *     ├── hero_slides   → list of `home_hero_slide`
 *     └── process_steps → list of `home_process_step`
 *
 * Every field falls back to the constants below, so a missing metaobject (or a
 * storefront that hasn't been seeded — see [[storefront-environments]]) renders
 * the same page it always did rather than an empty one.
 */

export interface HomeImage {
  url: string;
  altText: string | null;
}

export interface HomeCta {
  label: string;
  to: string;
}

export interface HomeHeroSlide {
  image: string;
  heading: string[];
  blurb: string;
  primaryCta: HomeCta;
  secondaryCta: HomeCta;
}

/**
 * The process steps the shop actually performs. Retiring a step means removing
 * it here — `parseProcessSteps` then drops any metaobject entry still using the
 * old key, so the page is correct before someone gets round to deleting the
 * entry in Admin. `jointed-by-hand` and `oiled-finished` were retired
 * 2026-09-01: the shop does no hand-jointing, and the oiling card carried a
 * guarantee claim that is no longer made.
 */
export type ProcessIconKey = 'rough-cut' | 'drawn-marked';

export interface HomeProcessStep {
  icon: ProcessIconKey;
  title: string;
  description: string;
}

export interface HomeSectionHead {
  heading: string;
  subheading: string;
  linkLabel: string;
}

export interface HomeContent {
  heroSlides: HomeHeroSlide[];
  categories: HomeSectionHead;
  popular: {heading: string; ctaLabel: string};
  testimonials: {heading: string};
  process: {
    heading: string;
    subheading: string;
    ctaLabel: string;
    image: HomeImage;
    steps: HomeProcessStep[];
  };
  contact: {heading: string; subheading: string; ctaLabel: string};
}

/* ─── Defaults ──────────────────────────────────────────────────────────────
 * These mirror the seeded metaobject values. They are the safety net, not the
 * source of truth — edit the metaobject in Admin, not this file. */

export const HOME_CONTENT_DEFAULTS: HomeContent = {
  heroSlides: [
    {
      image: '/demo/hero-1.png',
      heading: ['Timeless Oak.', 'Made for Your Home.'],
      blurb:
        'Handcrafted coat racks, fireplace mantels, shelves and solid oak accents—made to bring warmth, function and character to every room.',
      primaryCta: {label: 'Shop All Products', to: '/collections/all'},
      secondaryCta: {label: 'Explore Categories', to: '/collections'},
    },
  ],
  categories: {
    heading: 'Our Categories',
    subheading: 'Delivery in days—not months. Welcome to the new standard.',
    linkLabel: 'All Categories',
  },
  popular: {heading: 'Most popular', ctaLabel: 'Explore Categories'},
  testimonials: {heading: 'What our customers say'},
  process: {
    heading: 'Craft wood Furniture',
    subheading:
      'We are working since 2014. Handcrafted coat racks, fireplace mantels, shelves and solid oak accents made to bring warmth, function and character to every room.',
    ctaLabel: 'Explore Categories',
    image: {
      url: '/demo/workshop.jpg',
      altText: 'Craftsman shaping timber in the workshop',
    },
    steps: [
      {
        icon: 'rough-cut',
        title: 'Rough-cut',
        description:
          'Every board starts as rough-sawn timber, hand-selected by Will for grain and character.',
      },
      {
        icon: 'drawn-marked',
        title: 'Drawn & marked',
        description:
          'Tom draws each joint by hand before a single cut is made — no two pieces are ever identical.',
      },
    ],
  },
  contact: {
    heading: 'Contact us',
    subheading: 'Have a question? Let’s reach us',
    ctaLabel: 'Contact the workshop',
  },
};

const PROCESS_ICON_KEYS: ProcessIconKey[] = ['rough-cut', 'drawn-marked'];

/* ─── Parsing ───────────────────────────────────────────────────────────────
 * Metaobject fields come back as `{value: string} | null`. A field the merchant
 * left blank is an empty string, which should fall back just like a missing one
 * — hence `text()` treating both the same. */

type MetaobjectField = {value?: string | null} | null | undefined;

function text(field: MetaobjectField, fallback: string): string {
  const value = field?.value?.trim();
  return value ? value : fallback;
}

/** Multi-line fields drive `<br>`-separated headings — one row per line. */
function lines(field: MetaobjectField, fallback: string[]): string[] {
  const parsed = field?.value
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return parsed?.length ? parsed : fallback;
}

function isProcessIcon(value: string | undefined): value is ProcessIconKey {
  return PROCESS_ICON_KEYS.includes(value as ProcessIconKey);
}

type HomeMetaobject = NonNullable<HomeContentQuery['home']>;

function parseHeroSlides(home: HomeMetaobject): HomeHeroSlide[] {
  const nodes = home.heroSlides?.references?.nodes ?? [];
  const fallback = HOME_CONTENT_DEFAULTS.heroSlides[0];

  const slides = nodes.map((node) => ({
    image: node.image?.reference?.image?.url ?? fallback.image,
    heading: lines(node.heading, fallback.heading),
    blurb: text(node.blurb, fallback.blurb),
    primaryCta: {
      label: text(node.primaryCtaLabel, fallback.primaryCta.label),
      to: text(node.primaryCtaUrl, fallback.primaryCta.to),
    },
    secondaryCta: {
      label: text(node.secondaryCtaLabel, fallback.secondaryCta.label),
      to: text(node.secondaryCtaUrl, fallback.secondaryCta.to),
    },
  }));

  return slides.length ? slides : HOME_CONTENT_DEFAULTS.heroSlides;
}

function parseProcessSteps(home: HomeMetaobject): HomeProcessStep[] {
  const nodes = home.processSteps?.references?.nodes ?? [];

  const steps = nodes.flatMap<HomeProcessStep>((node, index) => {
    const iconValue = node.icon?.value?.trim() || undefined;
    const fallback =
      HOME_CONTENT_DEFAULTS.process.steps[index] ??
      HOME_CONTENT_DEFAULTS.process.steps[0];

    let icon: ProcessIconKey | undefined;
    if (iconValue) {
      // A named-but-unknown icon is a step this codebase has retired. Drop it
      // rather than rendering it under a borrowed icon — metaobject entries
      // outlive the code that knows what to do with them, and the page should
      // be right the moment the code says so, not once someone tidies Admin.
      if (!isProcessIcon(iconValue)) return [];
      icon = iconValue;
    } else {
      // A blank icon is a merchant omission, not a retirement: keep the step
      // and borrow the positional default.
      icon = fallback?.icon;
    }
    if (!icon) return [];

    return [
      {
        icon,
        title: text(node.title, fallback?.title ?? ''),
        description: text(node.description, fallback?.description ?? ''),
      },
    ];
  });

  return steps.length ? steps : HOME_CONTENT_DEFAULTS.process.steps;
}

export function buildHomeContent(
  data: HomeContentQuery | undefined,
): HomeContent {
  const home = data?.home;
  if (!home) return HOME_CONTENT_DEFAULTS;

  const defaults = HOME_CONTENT_DEFAULTS;
  const processImage = home.processImage?.reference?.image;

  return {
    heroSlides: parseHeroSlides(home),
    categories: {
      heading: text(home.categoriesHeading, defaults.categories.heading),
      subheading: text(
        home.categoriesSubheading,
        defaults.categories.subheading,
      ),
      linkLabel: text(home.categoriesLinkLabel, defaults.categories.linkLabel),
    },
    popular: {
      heading: text(home.popularHeading, defaults.popular.heading),
      ctaLabel: text(home.popularCtaLabel, defaults.popular.ctaLabel),
    },
    testimonials: {
      heading: text(home.testimonialsHeading, defaults.testimonials.heading),
    },
    process: {
      heading: text(home.processHeading, defaults.process.heading),
      subheading: text(home.processSubheading, defaults.process.subheading),
      ctaLabel: text(home.processCtaLabel, defaults.process.ctaLabel),
      image: {
        url: processImage?.url ?? defaults.process.image.url,
        altText: processImage?.altText ?? defaults.process.image.altText,
      },
      steps: parseProcessSteps(home),
    },
    contact: {
      heading: text(home.contactHeading, defaults.contact.heading),
      subheading: text(home.contactSubheading, defaults.contact.subheading),
      ctaLabel: text(home.contactCtaLabel, defaults.contact.ctaLabel),
    },
  };
}

/* ─── GraphQL ───────────────────────────────────────────────────────────── */

const HOME_MEDIA_IMAGE_FRAGMENT = `#graphql
  fragment HomeMediaImage on MediaImage {
    image {
      url
      altText
      width
      height
    }
  }
` as const;

export const HOME_CONTENT_QUERY = `#graphql
  ${HOME_MEDIA_IMAGE_FRAGMENT}
  query HomeContent($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    home: metaobject(handle: {type: "home_page", handle: "main"}) {
      id
      heroSlides: field(key: "hero_slides") {
        references(first: 12) {
          nodes {
            ... on Metaobject {
              id
              image: field(key: "image") {
                reference { ...HomeMediaImage }
              }
              heading: field(key: "heading") { value }
              blurb: field(key: "blurb") { value }
              primaryCtaLabel: field(key: "primary_cta_label") { value }
              primaryCtaUrl: field(key: "primary_cta_url") { value }
              secondaryCtaLabel: field(key: "secondary_cta_label") { value }
              secondaryCtaUrl: field(key: "secondary_cta_url") { value }
            }
          }
        }
      }
      categoriesHeading: field(key: "categories_heading") { value }
      categoriesSubheading: field(key: "categories_subheading") { value }
      categoriesLinkLabel: field(key: "categories_link_label") { value }
      popularHeading: field(key: "popular_heading") { value }
      popularCtaLabel: field(key: "popular_cta_label") { value }
      testimonialsHeading: field(key: "testimonials_heading") { value }
      processHeading: field(key: "process_heading") { value }
      processSubheading: field(key: "process_subheading") { value }
      processCtaLabel: field(key: "process_cta_label") { value }
      processImage: field(key: "process_image") {
        reference { ...HomeMediaImage }
      }
      processSteps: field(key: "process_steps") {
        references(first: 12) {
          nodes {
            ... on Metaobject {
              id
              icon: field(key: "icon") { value }
              title: field(key: "title") { value }
              description: field(key: "description") { value }
            }
          }
        }
      }
      contactHeading: field(key: "contact_heading") { value }
      contactSubheading: field(key: "contact_subheading") { value }
      contactCtaLabel: field(key: "contact_cta_label") { value }
    }
  }
` as const;
