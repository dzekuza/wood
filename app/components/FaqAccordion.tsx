import {useState} from 'react';

const FAQS = [
  {
    q: 'What kind of wood do you use?',
    a: 'All our pieces are cut from solid European oak — no MDF, veneer or particleboard. Each board is hand-selected in our Cotswolds workshop for grain and character.',
  },
  {
    q: 'Do you offer custom sizes?',
    a: "Yes — most pieces can be made to your exact height, depth and length. Get in touch with your measurements and we'll quote a made-to-order price.",
  },
  {
    q: 'How long does delivery take?',
    a: "Because everything is made to order, most pieces ship within 2–3 weeks. Larger commissions and fireplace surrounds can take a little longer — we'll confirm a timeline when you order.",
  },
  {
    q: 'How do I care for my oak furniture?',
    a: 'A light re-oil once or twice a year keeps the finish looking its best. Avoid direct heat sources and standing water — full care guides are on our Care page.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="demo-faq">
      <div className="demo-faq-head">
        <h2>FAQ</h2>
        <p>Answers to the questions we hear most from new customers.</p>
      </div>

      <div className="demo-faq-list">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div className={`demo-faq-item${isOpen ? ' is-open' : ''}`} key={faq.q}>
              <button
                type="button"
                className="demo-faq-question reset"
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <i className={`ti ${isOpen ? 'ti-minus' : 'ti-plus'}`} aria-hidden />
                <span>{faq.q}</span>
              </button>
              {isOpen && <p className="demo-faq-answer">{faq.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
