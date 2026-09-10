import {useLoaderData} from 'react-router';
import type {Route} from './+types/contact';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {CONTACT_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
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
                Start with a question, a sketch, or a room in mind.
              </EditableText>
            </div>
            <EditableText as="p" className="archive-hero-blurb" field="contact.hero.blurb">
              We handle enquiries directly from the workshop. Email us your project notes — the room, the
              piece, or the dimension you have in mind — and we will come back with lead time and options.
            </EditableText>
          </div>
        </div>

        <section className="section-white">
          <div className="archive-wrap">
            <div className="contact-shell">
              <div className="contact-primary-card">
                <EditableText as="h2" className="title" field="contact.primary.heading">
                  No ticket desk, no chatbot, no fake form.
                </EditableText>
                <EditableText as="p" field="contact.primary.blurb">
                  We would rather answer fewer messages properly than hide behind a generic inbox. Reach out
                  directly and we will respond with the right next step.
                </EditableText>
                <div className="contact-action-row">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary btn-pill">
                    Email the workshop <i className="ti ti-arrow-right" />
                  </a>
                </div>
              </div>

              <aside className="contact-info-card">
                {CONTACT_CHANNELS.map((channel, index) => (
                  <a key={channel.label} href={channel.href} className="contact-channel">
                    <span className="contact-channel-icon">
                      <i className={`ti ${channel.icon}`} />
                    </span>
                    <span className="contact-channel-copy">
                      <EditableText
                        as="span"
                        className="contact-channel-label"
                        field={`contact.channels.${index}.label`}
                      >
                        {channel.label}
                      </EditableText>
                      <strong>{channel.value}</strong>
                      <EditableText as="span" field={`contact.channels.${index}.copy`}>
                        {channel.copy}
                      </EditableText>
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
                <EditableText as="h2" className="title" field="contact.steps.heading">
                  The more practical the enquiry, the faster we can help.
                </EditableText>
              </div>
            </div>
            <div className="contact-steps">
              {CONTACT_STEPS.map((step, index) => (
                <article key={step} className="contact-step">
                  <span className="stepnum">0{index + 1}</span>
                  <EditableText as="p" field={`contact.steps.${index}`}>
                    {step}
                  </EditableText>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      <EditToolbar />
    </EditToolbarProvider>
  );
}
