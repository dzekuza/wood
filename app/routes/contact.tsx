import {Link} from 'react-router';
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
    <>
      <div className="page-header page-header-story">
        <div className="cwf-wrap">
          <div className="page-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Contact</span>
          </div>
          <div className="page-header-inner">
            <div>
              <span className="eyebrow">Get in touch</span>
              <h1>
                Start with a question, a sketch, or a <em>room in mind</em>.
              </h1>
              <p className="blurb">
                We handle enquiries directly from the workshop. Use email for detailed project notes, or call
                for a quick conversation about lead time, timber, or arranging a visit to {WORKSHOP_LOCATION}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="section-linen">
        <div className="cwf-wrap">
          <div className="contact-shell">
            <div className="contact-primary-card">
              <div className="eyebrow">Direct contact</div>
              <h2 className="title">No ticket desk, no chatbot, no fake form.</h2>
              <p>
                We would rather answer fewer messages properly than hide behind a generic inbox. Reach out
                directly and we will respond with the right next step.
              </p>
              <div className="contact-action-row">
                <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary">
                  Email the workshop <i className="ti ti-arrow-right" />
                </a>
                <a href={`tel:${CONTACT_PHONE_HREF}`} className="btn btn-line">
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

      <section className="section-linen-cont">
        <div className="cwf-wrap">
          <div className="shead">
            <div>
              <div className="eyebrow">What to send</div>
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
    </>
  );
}
