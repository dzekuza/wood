import {Link} from 'react-router';
import type {Route} from './+types/about';
import {Breadcrumbs} from '~/components/Breadcrumbs';
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

export default function AboutPage() {
  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'About'}]} />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">
              Made slowly, by hand, in the <em>Cotswolds</em>.
            </h1>
          </div>
          <p className="archive-hero-blurb">
            Craft Wood Furniture is a small workshop. We build solid-timber
            furniture the old way: careful stock selection, visible joinery, and finishes meant to age
            well in lived-in rooms.
          </p>
        </div>
      </div>

      <section className="section-white">
        <div className="archive-wrap">
          <div className="story-grid">
            <div className="story-copy">
              <h2 className="title">Furniture should feel honest before it feels impressive.</h2>
              <p>
                We build pieces that show their material, their structure, and the time they took to make.
                You can see the joins, feel the handwork, and repair them decades later.
              </p>
              <p>
                That means fewer hidden fixings, fewer synthetic surfaces, and more attention to proportion,
                timber movement, and how a room changes around a piece over time.
              </p>
            </div>
            <div className="story-panel">
              {ABOUT_FACTS.map((fact) => (
                <div key={fact.label} className="story-stat">
                  <span className="story-stat-value">{fact.value}</span>
                  <span className="story-stat-label">{fact.label}</span>
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
              <h2 className="title">A small bench, a short material chain, and zero rush.</h2>
            </div>
          </div>
          <div className="story-pillars">
            {ABOUT_PILLARS.map((pillar) => (
              <article key={pillar.title} className="story-card">
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-white-cont">
        <div className="archive-wrap">
          <div className="story-cta">
            <div>
              <h2 className="title">See the timber, the bench, and the work in progress.</h2>
              <p>
                We welcome appointments for commissions, material reviews, and in-person viewings of current
                pieces nearing completion.
              </p>
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
  );
}
