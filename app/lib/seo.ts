import {CANONICAL_HOST, SITE_NAME} from '~/lib/site';

/** Google truncates snippets at roughly this length. */
const META_DESCRIPTION_MAX = 155;

/** Absolute canonical URL on the production domain. Pass the path only — any
 *  filter, sort or pagination query string is deliberately left off, so every
 *  variant of a listing points search engines back at the one clean URL. */
export function getCanonicalUrl(path: string) {
  return `https://${CANONICAL_HOST}${path}`;
}

/**
 * The first non-empty candidate, whitespace collapsed and cut at a word
 * boundary to fit a search snippet. Pass the merchant's SEO field first, then
 * the content fallback, then a written default, so a page always gets one.
 */
export function toMetaDescription(...candidates: Array<string | null | undefined>) {
  const text = candidates
    .map((candidate) => candidate?.replace(/\s+/g, ' ').trim())
    .find(Boolean);
  if (!text) return undefined;
  if (text.length <= META_DESCRIPTION_MAX) return text;

  const cut = text.slice(0, META_DESCRIPTION_MAX - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

export type SeoImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Share-card fallback for pages without a picture of their own. A 1200x630
 *  crop of the hero photo (~135 KB); the full hero is 2.8 MB, which some
 *  platforms refuse to fetch for link previews. */
export const DEFAULT_SHARE_IMAGE: SeoImage = {
  url: `https://${CANONICAL_HOST}/images/share-default.jpg`,
  altText: 'Handmade solid oak furniture',
  width: 1200,
  height: 630,
};

/**
 * Everything a route's `meta` export needs for search and sharing: title,
 * description, canonical link, Open Graph and Twitter tags, an optional
 * `noindex`, and any JSON-LD blocks (see `~/lib/structuredData`).
 */
export function seoMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd = [],
}: {
  title: string;
  description?: string;
  path: string;
  image?: SeoImage | null;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  jsonLd?: Array<Record<string, unknown>>;
}) {
  const url = getCanonicalUrl(path);
  const share = image ?? DEFAULT_SHARE_IMAGE;

  return [
    {title},
    ...(description ? [{name: 'description', content: description}] : []),
    {tagName: 'link', rel: 'canonical', href: url},
    ...(noindex ? [{name: 'robots', content: 'noindex, follow'}] : []),
    {property: 'og:site_name', content: SITE_NAME},
    {property: 'og:locale', content: 'en_GB'},
    {property: 'og:type', content: type === 'product' ? 'og:product' : type},
    {property: 'og:title', content: title},
    ...(description ? [{property: 'og:description', content: description}] : []),
    {property: 'og:url', content: url},
    {property: 'og:image', content: share.url},
    ...(share.altText ? [{property: 'og:image:alt', content: share.altText}] : []),
    ...(share.width ? [{property: 'og:image:width', content: String(share.width)}] : []),
    ...(share.height ? [{property: 'og:image:height', content: String(share.height)}] : []),
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    ...(description ? [{name: 'twitter:description', content: description}] : []),
    {name: 'twitter:image', content: share.url},
    ...jsonLd.map((data) => ({'script:ld+json': data})),
  ];
}
