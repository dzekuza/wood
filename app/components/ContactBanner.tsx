import {Link} from 'react-router';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  WORKSHOP_LOCATION,
  WORKSHOP_VISIT_NOTE,
} from '~/lib/site';

export function ContactBanner() {
  return (
    <section className="demo-contact-wrap">
      <div className="demo-contact">
        <img className="demo-contact-bg" src="/demo/contact-bg.svg" alt="" aria-hidden />

        <div className="demo-contact-left">
          <div className="demo-contact-heading">
            <span className="demo-contact-divider" aria-hidden />
            <h2>Contact us</h2>
            <p>Have a question? Let&rsquo;s reach us</p>
          </div>
          <Link to="/contact" className="demo-contact-etsy">
            Contact the workshop
          </Link>
        </div>

        <div className="demo-contact-columns">
          <div className="demo-contact-col">
            <div className="demo-contact-block">
              <span className="demo-contact-label">General inquiries</span>
              <div className="demo-contact-lines">
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                <a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY}</a>
              </div>
            </div>
          </div>

          <div className="demo-contact-col">
            <div className="demo-contact-block">
              <span className="demo-contact-label">Workshop</span>
              <p className="demo-contact-address">
                {WORKSHOP_LOCATION}
                <br />
                {WORKSHOP_VISIT_NOTE}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
