import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

export type ArticleCardData = {
  handle: string;
  title: string;
  publishedAt: string;
  image?: {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  blog: {handle: string};
};

/**
 * Shared `.art-card` — used by the blog listing grid (`blogs.$blogHandle._index`)
 * and the "You may also like" strip on the article page itself.
 */
export function ArticleCard({
  article,
  loading,
  headingLevel: Heading = 'h3',
}: {
  article: ArticleCardData;
  loading?: HTMLImageElement['loading'];
  /** `h2` when the card sits directly under the page's h1 (the blog listings),
   *  so heading levels do not skip. */
  headingLevel?: 'h2' | 'h3';
}) {
  const publishedAt = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <Link
      className="art-card"
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      prefetch="intent"
    >
      {article.image && (
        <div className="art-card-img">
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="16/9"
            data={article.image}
            loading={loading}
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        </div>
      )}
      <div className="art-card-body">
        <div className="art-card-date">{publishedAt}</div>
        <Heading className="art-card-title">{article.title}</Heading>
        <span className="art-card-cta">
          Read more <i className="ti ti-arrow-right" />
        </span>
      </div>
    </Link>
  );
}
