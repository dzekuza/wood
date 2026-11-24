import {
  COMPANY,
  CONTACT_EMAIL,
  CONTACT_PHONE_HREF,
  EBAY_STORE_URL,
  ETSY_SHOP_URL,
  SITE_NAME,
  SOCIAL_LINKS,
} from '~/lib/site';
import {getCanonicalUrl} from '~/lib/seo';

/** JSON-LD builders. Each returns one schema.org node for `seoMeta({jsonLd})`. */

const CONTEXT = 'https://schema.org';

/** Stable node id so other schema (AboutPage, ContactPage, Product, Article) can reference the Organization. */
export const ORGANIZATION_ID = `${getCanonicalUrl('/')}#organization`;

export function organizationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    // Customers and search queries write the name several ways ("craftwood").
    alternateName: ['CraftWood Furniture', 'CraftWoodFurniture', 'CraftWood'],
    url: getCanonicalUrl('/'),
    vatID: COMPANY.vatNumber,
    identifier: COMPANY.companyNumber,
    telephone: CONTACT_PHONE_HREF,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.locality,
      addressRegion: 'Rhondda Cynon Taf',
      postalCode: COMPANY.address.postcode,
      addressCountry: COMPANY.address.country,
    },
    logo: getCanonicalUrl('/favicon-192.png'),
    email: CONTACT_EMAIL,
    areaServed: 'GB',
    knowsAbout: [
      'Solid European oak furniture',
      'Solid oak mantel beams',
      'Oak fireplace surrounds',
      'Solid oak floating shelves',
      'Solid oak coat racks',
      'Solid oak console tables',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE_HREF,
      areaServed: 'GB',
      availableLanguage: 'en',
    },
    sameAs: [...SOCIAL_LINKS.map((link) => link.url), ETSY_SHOP_URL, EBAY_STORE_URL],
  };
}

export function websiteJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getCanonicalUrl('/'),
    publisher: {'@id': ORGANIZATION_ID},
    potentialAction: {
      '@type': 'SearchAction',
      target: {'@type': 'EntryPoint', urlTemplate: `${getCanonicalUrl('/search')}?q={search_term_string}`},
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{name: string; path: string}>) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: [{name: 'Home', path: '/'}, ...items].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items?: Array<{name: string; path: string; image?: string | null}>;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    name,
    description,
    url: getCanonicalUrl(path),
    isPartOf: {'@type': 'WebSite', name: SITE_NAME, url: getCanonicalUrl('/')},
    ...(items && items.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: getCanonicalUrl(item.path),
              ...(item.image ? {image: item.image} : {}),
            })),
          },
        }
      : {}),
  };
}

/** `AboutPage` whose subject is the Organization node published alongside it. */
export function aboutPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'AboutPage',
    name,
    description,
    url: getCanonicalUrl(path),
    isPartOf: {'@type': 'WebSite', name: SITE_NAME, url: getCanonicalUrl('/')},
    about: {'@id': ORGANIZATION_ID},
    mainEntity: {'@id': ORGANIZATION_ID},
  };
}

/** `ContactPage` linked to the canonical Organization node. */
export function contactPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'ContactPage',
    name,
    description,
    url: getCanonicalUrl(path),
    isPartOf: {'@type': 'WebSite', name: SITE_NAME, url: getCanonicalUrl('/')},
    about: {'@id': ORGANIZATION_ID},
    mainEntity: {'@id': ORGANIZATION_ID},
  };
}

/** `Blog` node listing the articles shown on the page. */
export function blogJsonLd({
  name,
  description,
  path,
  posts,
}: {
  name: string;
  description?: string;
  path: string;
  posts: Array<{headline: string; path: string; publishedAt: string}>;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Blog',
    name,
    ...(description ? {description} : {}),
    url: getCanonicalUrl(path),
    publisher: {'@id': ORGANIZATION_ID},
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.headline,
      url: getCanonicalUrl(post.path),
      datePublished: post.publishedAt,
    })),
  };
}

export function faqJsonLd(faqs: Array<{question: string; answer: string}>) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {'@type': 'Answer', text: faq.answer},
    })),
  };
}

function stripHtmlText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&pound;/gi, '£')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts Question/Answer pairs from an editorial article's "Questions people
 * ask" or "Common questions" `<h2>` section so guide articles emit `FAQPage`
 * structured data automatically without duplicating copy in code.
 */
export function extractFaqsFromArticleHtml(
  html: string,
): Array<{question: string; answer: string}> {
  const faqHeadingMatch = html.match(
    /<h2[^>]*>[^<]*(?:questions|faq)[^<]*<\/h2>([\s\S]*?)(?=<h2\b|$)/i,
  );
  if (!faqHeadingMatch) return [];

  const section = faqHeadingMatch[1];
  const faqs: Array<{question: string; answer: string}> = [];
  const qaPattern = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi;

  for (const match of section.matchAll(qaPattern)) {
    const question = stripHtmlText(match[1]);
    const answer = stripHtmlText(match[2]);
    if (question && answer) {
      faqs.push({question, answer});
    }
  }

  return faqs;
}

export function productJsonLd({
  name,
  description,
  path,
  images,
  sku,
  gtin,
  price,
  priceRange,
  availableForSale,
}: {
  name: string;
  description?: string;
  path: string;
  images: string[];
  sku?: string | null;
  /** Barcode from the variant; only emitted when it is a valid GTIN length. */
  gtin?: string | null;
  price?: {amount: string; currencyCode: string} | null;
  /** Full min–max range across available variants when a product has multiple sizes/finishes. */
  priceRange?: {
    lowPrice: number;
    highPrice: number;
    currencyCode: string;
    offerCount: number;
  } | null;
  availableForSale?: boolean;
}) {
  const url = getCanonicalUrl(path);

  const singleOffer = price
    ? {
        '@type': 'Offer',
        url,
        price: Number(price.amount).toFixed(2),
        priceCurrency: price.currencyCode,
        itemCondition: `${CONTEXT}/NewCondition`,
        availability: `${CONTEXT}/${availableForSale ? 'InStock' : 'OutOfStock'}`,
        seller: {'@type': 'Organization', '@id': ORGANIZATION_ID, name: SITE_NAME},
        // Delivery is free on every UK order, with no minimum spend.
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {'@type': 'MonetaryAmount', value: '0', currency: 'GBP'},
          shippingDestination: {'@type': 'DefinedRegion', addressCountry: 'GB'},
          // Dispatch within up to 5 days, then 2 to 3 working days in transit.
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {'@type': 'QuantitativeValue', minValue: 0, maxValue: 5, unitCode: 'DAY'},
            transitTime: {'@type': 'QuantitativeValue', minValue: 2, maxValue: 3, unitCode: 'DAY'},
          },
        },
        // Mirrors /policies/refund-policy: 30 days to request a return.
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'GB',
          returnPolicyCategory: `${CONTEXT}/MerchantReturnFiniteReturnWindow`,
          merchantReturnDays: 30,
          merchantReturnLink: getCanonicalUrl('/policies/refund-policy'),
        },
      }
    : null;

  const offers =
    singleOffer &&
    priceRange &&
    priceRange.offerCount > 1 &&
    priceRange.highPrice > priceRange.lowPrice
      ? {
          '@type': 'AggregateOffer',
          url,
          lowPrice: priceRange.lowPrice.toFixed(2),
          highPrice: priceRange.highPrice.toFixed(2),
          priceCurrency: priceRange.currencyCode,
          offerCount: priceRange.offerCount,
          offers: [singleOffer],
        }
      : singleOffer;

  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name,
    ...(description ? {description} : {}),
    ...(images.length ? {image: images} : {}),
    ...(sku ? {sku, mpn: sku} : {}),
    ...(gtin && /^(\d{8}|\d{12,14})$/.test(gtin.trim()) ? {gtin: gtin.trim()} : {}),
    url,
    brand: {'@type': 'Brand', name: SITE_NAME},
    manufacturer: {'@type': 'Organization', '@id': ORGANIZATION_ID, name: SITE_NAME},
    // Every product in the shop is made from solid European oak.
    material: 'Solid European oak',
    ...(offers ? {offers} : {}),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
  image,
  publishedAt,
  modifiedAt,
  authorName,
}: {
  headline: string;
  description?: string;
  path: string;
  image?: string | null;
  publishedAt: string;
  modifiedAt?: string | null;
  authorName?: string | null;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline,
    ...(description ? {description} : {}),
    ...(image ? {image: [image]} : {}),
    inLanguage: 'en-GB',
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    mainEntityOfPage: getCanonicalUrl(path),
    author: {'@type': authorName ? 'Person' : 'Organization', name: authorName || SITE_NAME},
    publisher: {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      logo: {'@type': 'ImageObject', url: getCanonicalUrl('/favicon-192.png')},
    },
  };
}
