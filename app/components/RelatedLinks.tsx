import {Link} from 'react-router';
import type {InternalLink} from '~/lib/internalLinks';

/** A titled row of internal links, styled by the shared `.archive-related` rules. */
export function RelatedLinks({
  title,
  label,
  links,
}: {
  title: string;
  label: string;
  links: InternalLink[];
}) {
  if (links.length === 0) return null;

  return (
    <nav className="archive-related" aria-label={label}>
      <h3 className="archive-related-title">{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} prefetch="intent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
