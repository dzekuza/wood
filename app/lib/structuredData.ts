import {COMPANY, CONTACT_EMAIL, SITE_NAME, SOCIAL_LINKS} from '~/lib/site';
import {getCanonicalUrl} from '~/lib/seo';

/** JSON-LD builders. Each returns one schema.org node for `seoMeta({jsonLd})`. */

const CONTEXT = 'https://schema.org';

export function organizationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: getCanonicalUrl('/'),
    vatID: COMPANY.vatNumber,
    identifier: COMPANY.companyNumber,
    address: {
      '@type': 'PostalAddress',
      addressLocality: COMPANY.address.locality,
      addressRegion: 'Rhondda Cynon Taf',
      postalCode: COMPANY.address.postcode,
      addressCountry: COMPANY.address.country,
    },
    logo: getCanonicalUrl('/favicon-192.png'),
    email: CONTACT_EMAIL,
    areaServed: 'GB',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: CONTACT_EMAIL,
      areaServed: 'GB',
      availableLanguage: 'en',
    },
    sameAs: SOCIAL_LINKS.map((link) => link.url),
  };
}

export function websiteJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getCanonicalUrl('/'),
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

export function productJsonLd({
  name,
  description,
  path,
  images,
  sku,
  gtin,
  price,
  availableForSale,
  rating,
}: {
  name: string;
  description?: string;
  path: string;
  images: string[];
  sku?: string | null;
  /** Barcode from the variant; only emitted when it is a valid GTIN length. */
  gtin?: string | null;
  price?: {amount: string; currencyCode: string} | null;
  availableForSale?: boolean;
  rating?: {average: number; count: number} | null;
}) {
  const url = getCanonicalUrl(path);

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
    // Every product in the shop is made from solid European oak.
    material: 'Solid European oak',
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: Number(price.amount).toFixed(2),
            priceCurrency: price.currencyCode,
            itemCondition: `${CONTEXT}/NewCondition`,
            availability: `${CONTEXT}/${availableForSale ? 'InStock' : 'OutOfStock'}`,
            seller: {'@type': 'Organization', name: SITE_NAME},
            // Delivery is free on every UK order, with no minimum spend.
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {'@type': 'MonetaryAmount', value: '0', currency: 'GBP'},
              shippingDestination: {'@type': 'DefinedRegion', addressCountry: 'GB'},
            },
            // Mirrors /policies/refund-policy: 30 days to request a return.
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'GB',
              returnPolicyCategory: `${CONTEXT}/MerchantReturnFiniteReturnWindow`,
              merchantReturnDays: 30,
              merchantReturnLink: getCanonicalUrl('/policies/refund-policy'),
            },
          },
        }
      : {}),
    ...(rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
  image,
  publishedAt,
  authorName,
}: {
  headline: string;
  description?: string;
  path: string;
  image?: string | null;
  publishedAt: string;
  authorName?: string | null;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline,
    ...(description ? {description} : {}),
    ...(image ? {image: [image]} : {}),
    datePublished: publishedAt,
    mainEntityOfPage: getCanonicalUrl(path),
    author: {'@type': authorName ? 'Person' : 'Organization', name: authorName || SITE_NAME},
    publisher: {'@type': 'Organization', name: SITE_NAME, logo: {'@type': 'ImageObject', url: getCanonicalUrl('/favicon-192.png')}},
  };
}
