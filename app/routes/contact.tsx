import type {Route} from './+types/contact';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {
  CONTACT_EMAIL,
  SITE_NAME,
} from '~/lib/site';

const CONTACT_CHANNELS = [
  {
    icon: 'ti-mail',
    label: 'Email',
    href: `mailto:${CONTACT_EMAIL}`,
    value: CONTACT_EMAIL,
    copy: 'Best for commissions, lead times, and trade enquiries.',
  },
];

const CONTACT_STEPS = [
  'Share the room, piece, or dimension you are considering.',
  'We will reply with lead time, timber options, and next best steps.',
  'Bespoke commissions are quoted and reviewed over email before anything is cut.',
];

export const meta: Route.MetaFunction = () => [
  {title: `Contact | ${SITE_NAME}`},
  {
    name: 'description',
    content:
      'Speak with Craft Wood Furniture about commissions, lead times, and solid-timber pieces currently in production.',
  },
];

export default function ContactPage() {
  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'Contact'}]} />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">
              Start with a question, a sketch, or a <em>room in mind</em>.
            </h1>
          </div>
          <p className="archive-hero-blurb">
            We handle enquiries directly from the workshop. Email us your project notes — the room, the
            piece, or the dimension you have in mind — and we will come back with lead time and options.
          </p>
        </div>
      </div>

      <section className="section-white">
        <div className="archive-wrap">
          <div className="contact-shell">
            <div className="contact-primary-card">
              <h2 className="title">No ticket desk, no chatbot, no fake form.</h2>
              <p>
                We would rather answer fewer messages properly than hide behind a generic inbox. Reach out
                directly and we will respond with the right next step.
              </p>
              <div className="contact-action-row">
                <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary btn-pill">
                  Email the workshop <i className="ti ti-arrow-right" />
                </a>
              </div>
            </div>

            <aside className="contact-info-card">
              {CONTACT_CHANNELS.map((channel) => (
                <a key={channel.label} href={channel.href} className="contact-channel">
                  <span className="contact-channel-icon">
                    <i className={`ti ${channel.icon}`} />
                  </span>
                  <span className="contact-channel-copy">
                    <span className="contact-channel-label">{channel.label}</span>
                    <strong>{channel.value}</strong>
                    <span>{channel.copy}</span>
                  </span>
                </a>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="section-white-cont">
        <div className="archive-wrap">
          <div className="shead">
            <div>
              <h2 className="title">The more practical the enquiry, the faster we can help.</h2>
            </div>
          </div>
          <div className="contact-steps">
            {CONTACT_STEPS.map((step, index) => (
              <article key={step} className="contact-step">
                <span className="stepnum">0{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
