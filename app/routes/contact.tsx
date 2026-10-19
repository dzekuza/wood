import {useLoaderData} from 'react-router';
import type {Route} from './+types/contact';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {CONTACT_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
import {COMPANY, CONTACT_EMAIL, SITE_NAME} from '~/lib/site';
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

        {/* Email is the only channel, so the page is the hero plus one card —
            no chatbot/ticket-desk disclaimers or process steps around it. */}
        <section className="section-white">
          <div className="archive-wrap">
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact-email-card">
              <span className="contact-channel-icon">
                <i className="ti ti-mail" aria-hidden="true" />
              </span>
              <span className="contact-channel-copy">
                <EditableText
                  as="span"
                  className="contact-channel-label"
                  field="contact.channels.0.label"
                >
                  Email
                </EditableText>
                <strong>{CONTACT_EMAIL}</strong>
                <EditableText as="span" field="contact.channels.0.copy">
                  We reply to every message from the workshop, usually within
                  one working day.
                </EditableText>
              </span>
              <span className="btn btn-primary btn-pill">
                Email the workshop <i className="ti ti-arrow-right" aria-hidden="true" />
              </span>
            </a>
            <address className="contact-company">
              <strong>{COMPANY.legalName}</strong>
              <span>
                {COMPANY.address.locality} {COMPANY.address.postcode}
              </span>
              <span>
                Company no. {COMPANY.companyNumber} · VAT no. {COMPANY.vatNumber}
              </span>
            </address>
          </div>
        </section>
      </div>
      <EditToolbar />
    </EditToolbarProvider>
  );
}
