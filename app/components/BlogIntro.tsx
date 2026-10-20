import {Link} from 'react-router';

const SHOP_LINKS = [
  {label: 'Oak mantel beams', to: '/collections/solid-oak-mantel-beams'},
  {label: 'Oak fireplace surrounds', to: '/collections/solid-oak-fireplace-surrounds'},
  {label: 'Oak shelves', to: '/collections/solid-oak-shelves'},
  {label: 'Oak coat racks', to: '/collections/solid-oak-coat-racks'},
  {label: 'Oak console tables', to: '/collections/console-tables'},
] as const;

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
        {SHOP_LINKS.map((link, index) => (
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
