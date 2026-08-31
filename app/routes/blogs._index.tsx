import {useLoaderData} from 'react-router';
import type {Route} from './+types/blogs._index';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ArticleCard} from '~/components/ArticleCard';
import {SITE_NAME} from '~/lib/site';

export const meta: Route.MetaFunction = () => {
  return [{title: `Journal | ${SITE_NAME}`}];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {blogs} = await context.storefront.query(BLOGS_QUERY);

  // Flatten every blog's articles into one feed, newest first — the store
  // only has one editorial blog ("News") today, but this holds up if a
  // second is added without needing a code change.
  const articles = blogs.nodes
    .flatMap((blog) => blog.articles.nodes)
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  return {articles};
}

export default function Blogs() {
  const {articles} = useLoaderData<typeof loader>();

  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'Journal'}]} />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">Stories from the bench.</h1>
          </div>
          <p className="archive-hero-blurb">Finish notes, workshop process, and interiors that are meant to age well.</p>
        </div>
      </div>
      <section className="blog-index-section">
        <div className="archive-wrap">
          <div className="blog-articles-grid">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  fragment JournalArticle on Article {
    id
    handle
    title
    publishedAt
    image {
      id
      altText
      url
      width
      height
    }
    blog {
      handle
    }
  }
  query Blogs($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blogs(first: 10) {
      nodes {
        handle
        articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            ...JournalArticle
          }
        }
      }
    }
  }
` as const;
