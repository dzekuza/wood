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

        <div className="demo-contact-heading">
          <span className="demo-contact-divider" aria-hidden />
          <EditableText as="h2" field="contact.heading">
            {content.heading}
          </EditableText>
          <EditableText as="p" field="contact.subheading">
            {content.subheading}
          </EditableText>
        </div>

        {/* Email is the only contact channel, so the block offers exactly one
            action instead of a link to a page that repeats the same address. */}
        <div className="demo-contact-actions">
          <a href={`mailto:${CONTACT_EMAIL}`} className="demo-contact-email">
            {CONTACT_EMAIL}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="demo-contact-cta">
            <EditableText field="contact.ctaLabel">
              {content.ctaLabel}
            </EditableText>
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
