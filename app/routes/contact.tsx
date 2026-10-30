import {useLoaderData} from 'react-router';
import type {Route} from './+types/contact';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {CONTACT_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
import {
  COMPANY,
  COMPANY_ADDRESS_LINE,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  SITE_NAME,
} from '~/lib/site';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: `Contact | ${SITE_NAME}`,
    description:
      'Speak with Craft Wood Furniture about commissions, lead times, and solid-timber pieces currently in production.',
    path: '/contact',
  });

export async function loader({context, request}: Route.LoaderArgs) {
  return {
    pageContent: await loadPageContentState(context, request, CONTACT_SLUG),
  };
}

export default function ContactPage() {
  const {pageContent} = useLoaderData<typeof loader>();

  return (
    <EditToolbarProvider slug={CONTACT_SLUG} initialState={pageContent} label="Contact page copy">
      <div className="archive-page">
        <Breadcrumbs items={[{label: 'Contact'}]} />
        <div className="archive-hero">
          <div className="archive-wrap">
            <div className="archive-hero-inner">
              <EditableText as="h1" className="archive-hero-title" field="contact.hero.heading">
                Get in touch.
              </EditableText>
            </div>
            <EditableText as="p" className="archive-hero-blurb" field="contact.hero.blurb">
              Questions about a size, a finish or an order? Email the workshop and we will get back to
              you with the details.
            </EditableText>
          </div>
        </div>

        {/* Three equal-weight ways to reach the workshop — email and phone are
            links, the address card is static. A grid, not a stacked column,
            so the row fills the page width instead of leaving half of it
            blank next to one narrow card. */}
        <section className="section-white">
          <div className="archive-wrap">
            <div className="contact-channels">
              <a href={`mailto:${CONTACT_EMAIL}`} className="contact-channel-card">
                <span className="contact-channel-icon">
                  <i className="ti ti-mail" aria-hidden="true" />
                </span>
                <EditableText
                  as="span"
                  className="contact-channel-label"
                  field="contact.channels.0.label"
                >
                  Email
                </EditableText>
                <strong className="contact-channel-value">{CONTACT_EMAIL}</strong>
                <EditableText as="p" className="contact-channel-copy" field="contact.channels.0.copy">
                  We reply to every message from the workshop, usually within
                  one working day.
                </EditableText>
                <span className="btn btn-primary btn-pill contact-channel-cta">
                  Email the workshop <i className="ti ti-arrow-right" aria-hidden="true" />
                </span>
              </a>

              <a href={`tel:${CONTACT_PHONE_HREF}`} className="contact-channel-card">
                <span className="contact-channel-icon">
                  <i className="ti ti-phone" aria-hidden="true" />
                </span>
                <EditableText
                  as="span"
                  className="contact-channel-label"
                  field="contact.channels.1.label"
                >
                  Phone
                </EditableText>
                <strong className="contact-channel-value">{CONTACT_PHONE_DISPLAY}</strong>
                <EditableText as="p" className="contact-channel-copy" field="contact.channels.1.copy">
                  Call the workshop directly for quick questions.
                </EditableText>
                <span className="btn btn-line btn-pill contact-channel-cta">
                  Call {CONTACT_PHONE_DISPLAY}
                </span>
              </a>

              <address className="contact-channel-card contact-channel-card-static">
                <span className="contact-channel-icon">
                  <i className="ti ti-map-pin" aria-hidden="true" />
                </span>
                <span className="contact-channel-label">Visit us</span>
                <strong className="contact-channel-value">{COMPANY.legalName}</strong>
                <p className="contact-channel-copy">{COMPANY_ADDRESS_LINE}</p>
                <p className="contact-channel-meta">
                  Company no. {COMPANY.companyNumber} · VAT no. {COMPANY.vatNumber}
                </p>
              </address>
            </div>
          </div>
        </section>
      </div>
      <EditToolbar />
    </EditToolbarProvider>
  );
}
