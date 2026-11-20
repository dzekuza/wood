import {Link} from 'react-router';
import {ALL_COLLECTION_LINKS} from '~/lib/internalLinks';


/** Opening copy for the blog listings, so the pages carry real text before the
 *  article grid and link through to the categories the guides support. */
export function BlogIntro() {
  return (
    <div className="blog-intro">
      <p>
        Practical advice from the workshop where our solid oak furniture is
        made. Here you will find guides on choosing the right size, fitting and
        fixing pieces safely, and caring for oak so it ages well, written for
        UK homes and chimney breasts.
      </p>
      <p>
        Every piece we sell is made to order from solid European oak, so the
        guides focus on what matters when you buy handmade timber: grain and
        natural variation, oil finishes, and how to fix heavy pieces to your
        walls.
      </p>
      <p className="blog-intro-links">
        Browse the range:{' '}
        {ALL_COLLECTION_LINKS.map((link, index) => (
          <span key={link.to}>
            {index > 0 && ', '}
            <Link to={link.to}>{link.label}</Link>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
