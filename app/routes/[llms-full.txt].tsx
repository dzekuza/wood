import type {Route} from './+types/[llms-full.txt]';
import {
  COMPANY_LEGAL_LINE,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  EBAY_STORE_URL,
  ETSY_SHOP_URL,
  SITE_NAME,
  STORE_REVIEW_COUNT,
  shouldHideCollection,
} from '~/lib/site';
import {ETSY_RATINGS_BY_HANDLE, ETSY_SHOP_RATING} from '~/data/etsy-ratings';
import {COLLECTION_CONTENT} from '~/lib/collectionContent';
import {getCanonicalUrl} from '~/lib/seo';
import {editorialCache} from '~/lib/cache';
import {filterHiddenProducts} from '~/lib/upsells';

/**
 * Full-catalogue markdown index for AI assistants and shopping agents
 * (llmstxt.org `llms-full.txt` convention). Dynamically reads live products,
 * GBP price ranges, and blog guides from the Storefront API so facts never drift.
 */
export async function loader({context: {storefront}}: Route.LoaderArgs) {
  const {products, collections, blogs} = await storefront.query(LLMS_FULL_QUERY, {
    cache: editorialCache(storefront),
  });

  const visibleProducts = filterHiddenProducts(products.nodes);
  const visibleCollections = collections.nodes.filter(
    (c) => !shouldHideCollection({handle: c.handle, title: c.title}),
  );
  const articles = blogs.nodes
    .flatMap((blog) =>
      blog.articles.nodes.map((article) => ({
        ...article,
        blogHandle: blog.handle,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  const lines: string[] = [
    `# ${SITE_NAME} — Full Catalogue & Reference`,
    '',
    `> Handmade solid European oak furniture, made to order in our UK workshop (Tonypandy, Wales) and delivered free across the UK.`,
    '',
    '## Brand & Workshop Facts',
    `- Trading name: ${SITE_NAME} (also written CraftWood Furniture / CraftWoodFurniture)`,
    `- Legal entity: ${COMPANY_LEGAL_LINE}`,
    `- Contact: ${CONTACT_EMAIL} | ${CONTACT_PHONE_DISPLAY}`,
    `- Material: 100% solid European oak (no veneer, no MDF, no chipboard, no flat-pack)`,
    `- Finishes: Six oil colours — White, Light Grey, Grey, Dark, Old Oak, and Clear`,
    `- Lead time: Made to order; dispatches within up to 5 days, delivery takes 2 to 3 working days`,
    `- Delivery: Free UK delivery on all orders, no minimum spend`,
    `- Custom sizes: Available on request before ordering via ${CONTACT_EMAIL}`,
    `- Returns: 30 days to request a return (${getCanonicalUrl('/policies/refund-policy')})`,
    `- Verified customer reviews: ${ETSY_SHOP_RATING.average.toFixed(2)}/5 across ${STORE_REVIEW_COUNT.toLocaleString('en-GB')} Etsy reviews (${ETSY_SHOP_URL}#reviews)`,
    `- Official marketplace channels: Etsy (${ETSY_SHOP_URL}) and eBay UK (${EBAY_STORE_URL})`,
    '',
    '## Categories & Specifications',
  ];

  for (const collection of visibleCollections) {
    const content = COLLECTION_CONTENT[collection.handle];
    lines.push('');
    lines.push(
      `### ${content?.heading ?? collection.title} — ${getCanonicalUrl(`/collections/${collection.handle}`)}`,
    );
    if (content) {
      lines.push(content.guide[0]);
      for (const spec of content.specs) {
        lines.push(`- **${spec.label}:** ${spec.value}`);
      }
    } else if (collection.description) {
      lines.push(collection.description.replace(/\s+/g, ' ').trim());
    }
  }

  lines.push('');
  lines.push('## Products (Live GBP Prices)');

  for (const product of visibleProducts) {
    const min = Number(product.priceRange.minVariantPrice.amount);
    const max = Number(product.priceRange.maxVariantPrice.amount);
    const priceText =
      max > min
        ? `£${min.toFixed(2)} – £${max.toFixed(2)} GBP`
        : `£${min.toFixed(2)} GBP`;
    const rating = ETSY_RATINGS_BY_HANDLE[product.handle];
    const desc = (product.seo?.description || product.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 260);

    lines.push('');
    lines.push(`### ${product.title}`);
    lines.push(`- URL: ${getCanonicalUrl(`/products/${product.handle}`)}`);
    lines.push(`- Price: ${priceText} (includes free UK delivery)`);
    if (rating) {
      lines.push(
        `- Customer rating on Etsy: ${rating.average.toFixed(2)}/5 (${rating.count} reviews)`,
      );
    }
    if (desc) {
      lines.push(`- Summary: ${desc}`);
    }
  }

  lines.push('');
  lines.push('## Advice, Sizing & Installation Guides');
  for (const article of articles) {
    lines.push(
      `- [${article.title}](${getCanonicalUrl(`/blogs/${article.blogHandle}/${article.handle}`)})`,
    );
  }

  lines.push('');
  lines.push('## Frequently Asked Questions');
  for (const [handle, content] of Object.entries(COLLECTION_CONTENT)) {
    lines.push('');
    lines.push(`### ${content.heading} (${getCanonicalUrl(`/collections/${handle}`)})`);
    for (const faq of content.faqs) {
      lines.push(`- **${faq.question}** ${faq.answer}`);
    }
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60}`,
    },
  });
}

const LLMS_FULL_QUERY = `#graphql
  query LlmsFullCatalog($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 50, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        tags
        description
        seo {
          description
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
    collections(first: 30) {
      nodes {
        handle
        title
        description
      }
    }
    blogs(first: 5) {
      nodes {
        handle
        articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            handle
            title
            publishedAt
          }
        }
      }
    }
  }
` as const;
