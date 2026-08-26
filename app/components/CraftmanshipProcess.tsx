import {Link} from 'react-router';
import {
  RoughCutIcon,
  DrawnMarkedIcon,
  JointedByHandIcon,
  OiledFinishedIcon,
} from '~/components/ProcessIcons';

const STEPS = [
  {
    icon: RoughCutIcon,
    title: 'Rough-cut',
    description:
      'Every board starts as rough-sawn timber, hand-selected by Will for grain and character.',
  },
  {
    icon: DrawnMarkedIcon,
    title: 'Drawn & marked',
    description:
      'Tom draws each joint by hand before a single cut is made — no two pieces are ever identical.',
  },
  {
    icon: JointedByHandIcon,
    title: 'Jointed by hand',
    description:
      "Iris cuts and fits every joint on the bench, the same way it's been done for generations.",
  },
  {
    icon: OiledFinishedIcon,
    title: 'Oiled & finished',
    description: 'Sam hand-oils each piece, backed by our 25-year repair guarantee.',
  },
];

export function CraftmanshipProcess() {
  return (
    <section className="demo-process">
      <div className="demo-process-head">
        <h2>Craft wood Furniture</h2>
        <p className="demo-process-sub">
          We are working since 2014. Handcrafted coat racks, fireplace mantels,
          shelves and solid oak accents made to bring warmth, function and
          character to every room.
        </p>
        <Link to="/collections" className="demo-btn demo-btn-outline-light">
          Explore Collections
        </Link>
      </div>

      <div className="demo-process-body">
        <div className="demo-process-photo">
          <img src="/demo/workshop.jpg" alt="Craftsman shaping timber in the workshop" />
        </div>

        <div className="demo-process-grid">
          {STEPS.map((step) => (
            <div className="demo-process-card" key={step.title}>
              <step.icon />
              {/* Title + body are one block so the card can push the icon to
                  the top and this to the bottom, whatever the copy length. */}
              <div className="demo-process-card-copy">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
