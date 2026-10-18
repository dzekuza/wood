import {CANONICAL_HOST} from '~/lib/site';

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

/** Title, description and canonical link for a route's `meta` export. */
export function seoMeta({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}) {
  return [
    {title},
    ...(description ? [{name: 'description', content: description}] : []),
    {tagName: 'link', rel: 'canonical', href: getCanonicalUrl(path)},
  ];
}
