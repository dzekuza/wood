import {Link} from 'react-router';
import type {Route} from './+types/about';
import {SITE_NAME, WORKSHOP_LOCATION} from '~/lib/site';

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
    <>
      <div className="page-header page-header-story">
        <div className="cwf-wrap">
          <div className="page-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>About</span>
          </div>
          <div className="page-header-inner">
            <div>
              <span className="eyebrow">The workshop</span>
              <h1>
                Made slowly, by hand, in the <em>Cotswolds</em>.
              </h1>
              <p className="blurb">
                Craft Wood Furniture is a small workshop in {WORKSHOP_LOCATION}. We build solid-timber
                furniture the old way: careful stock selection, visible joinery, and finishes meant to age
                well in lived-in rooms.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="section-linen">
        <div className="cwf-wrap">
          <div className="story-grid">
            <div className="story-copy">
              <div className="eyebrow">What we believe</div>
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

      <section className="section-linen-cont">
        <div className="cwf-wrap">
          <div className="shead">
            <div>
              <div className="eyebrow">How we work</div>
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

      <section className="section-linen-cont">
        <div className="cwf-wrap">
          <div className="story-cta">
            <div>
              <div className="eyebrow">Visit or enquire</div>
              <h2 className="title">See the timber, the bench, and the work in progress.</h2>
              <p>
                We welcome appointments for commissions, material reviews, and in-person viewings of current
                pieces nearing completion.
              </p>
            </div>
            <div className="story-cta-actions">
              <Link to="/contact" className="btn btn-primary">
                Plan a visit <i className="ti ti-arrow-right" />
              </Link>
              <Link to="/collections/all" className="btn btn-line">
                Browse the collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
