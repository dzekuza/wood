import type {Route} from './+types/contact';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  SITE_NAME,
  WORKSHOP_HOURS,
  WORKSHOP_LOCATION,
  WORKSHOP_VISIT_NOTE,
} from '~/lib/site';

const CONTACT_CHANNELS = [
  {
    icon: 'ti-mail',
    label: 'Email',
    href: `mailto:${CONTACT_EMAIL}`,
    value: CONTACT_EMAIL,
    copy: 'Best for commissions, lead times, and trade enquiries.',
  },
  {
    icon: 'ti-phone',
    label: 'Phone',
    href: `tel:${CONTACT_PHONE_HREF}`,
    value: CONTACT_PHONE_DISPLAY,
    copy: 'Call during workshop hours for quick availability questions.',
  },
];

const CONTACT_STEPS = [
  'Share the room, piece, or dimension you are considering.',
  'We will reply with lead time, timber options, and next best steps.',
  'Appointments for workshop visits and bespoke reviews are arranged directly.',
];

export const meta: Route.MetaFunction = () => [
  {title: `Contact | ${SITE_NAME}`},
  {
    name: 'description',
    content:
      'Speak with Craft Wood Furniture about commissions, workshop visits, lead times, and solid-timber pieces currently in production.',
  },
];

export default function ContactPage() {
  return (
    <div className="archive-page">
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">
              Start with a question, a sketch, or a <em>room in mind</em>.
            </h1>
          </div>
          <p className="archive-hero-blurb">
            We handle enquiries directly from the workshop. Use email for detailed project notes, or call
            for a quick conversation about lead time, timber, or arranging a visit to {WORKSHOP_LOCATION}.
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
                <a href={`tel:${CONTACT_PHONE_HREF}`} className="btn btn-line btn-pill">
                  Call {CONTACT_PHONE_DISPLAY}
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
              <div className="contact-note">
                <div className="contact-note-label">Workshop hours</div>
                <p>{WORKSHOP_HOURS[0]}</p>
                <p>{WORKSHOP_HOURS[1]}</p>
              </div>
              <div className="contact-note">
                <div className="contact-note-label">Visit the workshop</div>
                <p>{WORKSHOP_LOCATION}</p>
                <p>{WORKSHOP_VISIT_NOTE}</p>
              </div>
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
