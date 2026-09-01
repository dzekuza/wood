import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';
import {CONTACT_EMAIL} from '~/lib/site';
import {HOME_CONTENT_DEFAULTS, type HomeContent} from '~/lib/homeContent';

export interface ContactBannerProps {
  content?: HomeContent['contact'];
}

export function ContactBanner({
  content = HOME_CONTENT_DEFAULTS.contact,
}: ContactBannerProps) {
  return (
    <section className="demo-contact-wrap">
      <div className="demo-contact">
        <img className="demo-contact-bg" src="/demo/contact-bg.svg" alt="" aria-hidden />

        <div className="demo-contact-left">
          <div className="demo-contact-heading">
            <span className="demo-contact-divider" aria-hidden />
            <EditableText as="h2" field="contact.heading">
              {content.heading}
            </EditableText>
            <EditableText as="p" field="contact.subheading">
              {content.subheading}
            </EditableText>
          </div>
          <Link to="/contact" className="demo-contact-etsy">
            <EditableText field="contact.ctaLabel">
              {content.ctaLabel}
            </EditableText>
          </Link>
        </div>

        <div className="demo-contact-columns">
          <div className="demo-contact-col">
            <div className="demo-contact-block">
              <span className="demo-contact-label">General inquiries</span>
              <div className="demo-contact-lines">
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
