import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/about';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {EditableText} from '~/components/EditableText';
import {EditToolbar} from '~/components/EditToolbar';
import {EditToolbarProvider} from '~/components/EditToolbarProvider';
import {ABOUT_SLUG} from '~/lib/pageContent';
import {loadPageContentState} from '~/lib/pageContent.server';
import {SITE_NAME} from '~/lib/site';

const ABOUT_PILLARS = [
  {
    title: 'Timber first',
    body: 'Every piece starts with solid hardwood chosen for grain, movement, and repairability. No veneers, no shortcuts, no flat-pack logic.',
  },
  {
    title: 'Joinery that shows',
    body: 'Mortise-and-tenon frames, draw-bored joints, and hand-finished edges are part of the design, not hidden behind trim.',
  },
  {
    title: 'Built to stay in use',
    body: 'We make furniture for daily wear, future repairs, and long ownership rather than seasonal replacement.',
  },
];

const ABOUT_FACTS = [
  {value: '4', label: 'makers on the bench'},
  {value: '25', label: 'years of repair cover'},
  {value: '120+', label: 'hours in a dining table'},
];

export const meta: Route.MetaFunction = () => [
  {title: `About the Workshop | ${SITE_NAME}`},
  {
    name: 'description',
    content:
      'Meet the workshop behind Craft Wood Furniture and learn how each solid-timber piece is joined, finished, and built for long ownership.',
  },
];

export async function loader({context, request}: Route.LoaderArgs) {
  return {
    pageContent: await loadPageContentState(context, request, ABOUT_SLUG),
  };
}

export default function AboutPage() {
  const {pageContent} = useLoaderData<typeof loader>();

  return (
    <EditToolbarProvider slug={ABOUT_SLUG} initialState={pageContent} label="About page copy">
      <div className="archive-page">
        <Breadcrumbs items={[{label: 'About'}]} />
        <div className="archive-hero">
          <div className="archive-wrap">
            <div className="archive-hero-inner">
              <EditableText as="h1" className="archive-hero-title" field="about.hero.heading">
                Made slowly, by hand, in the Cotswolds.
              </EditableText>
            </div>
            <EditableText as="p" className="archive-hero-blurb" field="about.hero.blurb">
              Craft Wood Furniture is a small workshop. We build solid-timber
              furniture the old way: careful stock selection, visible joinery, and finishes meant to age
              well in lived-in rooms.
            </EditableText>
          </div>
        </div>

        <section className="section-white">
          <div className="archive-wrap">
            <div className="story-grid">
              <div className="story-copy">
                <EditableText as="h2" className="title" field="about.story.heading">
                  Furniture should feel honest before it feels impressive.
                </EditableText>
                <EditableText as="p" field="about.story.body1">
                  We build pieces that show their material, their structure, and the time they took to make.
                  You can see the joins, feel the handwork, and repair them decades later.
                </EditableText>
                <EditableText as="p" field="about.story.body2">
                  That means fewer hidden fixings, fewer synthetic surfaces, and more attention to proportion,
                  timber movement, and how a room changes around a piece over time.
                </EditableText>
              </div>
              <div className="story-panel">
                {ABOUT_FACTS.map((fact, index) => (
                  <div key={fact.label} className="story-stat">
                    <EditableText
                      as="span"
                      className="story-stat-value"
                      field={`about.facts.${index}.value`}
                    >
                      {fact.value}
                    </EditableText>
                    <EditableText
                      as="span"
                      className="story-stat-label"
                      field={`about.facts.${index}.label`}
                    >
                      {fact.label}
                    </EditableText>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-white-cont">
          <div className="archive-wrap">
            <div className="shead">
              <div>
                <EditableText as="h2" className="title" field="about.pillars.heading">
                  A small bench, a short material chain, and zero rush.
                </EditableText>
              </div>
            </div>
            <div className="story-pillars">
              {ABOUT_PILLARS.map((pillar, index) => (
                <article key={pillar.title} className="story-card">
                  <EditableText as="h3" field={`about.pillars.${index}.title`}>
                    {pillar.title}
                  </EditableText>
                  <EditableText as="p" field={`about.pillars.${index}.body`}>
                    {pillar.body}
                  </EditableText>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-white-cont">
          <div className="archive-wrap">
            <div className="story-cta">
              <div>
                <EditableText as="h2" className="title" field="about.cta.heading">
                  See the timber, the bench, and the work in progress.
                </EditableText>
                <EditableText as="p" field="about.cta.blurb">
                  We welcome appointments for commissions, material reviews, and in-person viewings of current
                  pieces nearing completion.
                </EditableText>
              </div>
              <div className="story-cta-actions">
                <Link to="/contact" className="btn btn-primary btn-pill">
                  Plan a visit <i className="ti ti-arrow-right" />
                </Link>
                <Link to="/collections/all" className="btn btn-line btn-pill">
                  Browse the collection
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <EditToolbar />
    </EditToolbarProvider>
  );
}
