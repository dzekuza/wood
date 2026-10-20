import type {CollectionContent} from '~/lib/collectionContent';

/** Buying guide and FAQs under a category's product grid. */
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
