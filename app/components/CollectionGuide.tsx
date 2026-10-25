import {Link} from 'react-router';
import type {CollectionContent} from '~/lib/collectionContent';

/** Buying guide, key facts, related links and FAQs under a category's grid. */
export function CollectionGuide({content}: {content: CollectionContent}) {
  return (
    <section className="archive-guide">
      <div className="archive-wrap">
        <h2 className="archive-guide-title">{content.guideHeading}</h2>
        <div className="archive-guide-body">
          {content.guide.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {content.specs.length > 0 && (
          <dl className="archive-specs">
            {content.specs.map((spec) => (
              <div key={spec.label} className="archive-spec">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {content.links.length > 0 && (
          <nav className="archive-related" aria-label="Related products and categories">
            <h3 className="archive-related-title">Explore more</h3>
            <ul>
              {content.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} prefetch="intent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <h2 className="archive-faq-title">Frequently asked questions</h2>
        <div className="faq-list">
          {content.faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p className="faq-item-body">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
