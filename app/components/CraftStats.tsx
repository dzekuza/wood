import {Link} from 'react-router';

const STATS = [
  {value: '27+', label: 'Years of craft', theme: 'sand'},
  {value: '4', label: 'Person workshop', theme: 'cream'},
  {value: '4.9★', label: 'Average rating', theme: 'sage'},
  {value: '25-Yr', label: 'Repair guarantee', theme: 'peach'},
] as const;

export function CraftStats() {
  return (
    <section className="demo-stats">
      <div className="demo-stats-grid">
        <div className="demo-stats-left">
          <div className="demo-stats-feature">
            <p className="demo-stats-feature-title">Meet the Makers</p>
            <Link to="/about" className="demo-btn demo-btn-outline-dark demo-btn-sm">
              Meet the Makers
            </Link>
          </div>

          <div className="demo-stats-2x2">
            {STATS.map((stat) => (
              <div className={`demo-stat-card demo-stat-${stat.theme}`} key={stat.label}>
                <p className="demo-stat-value">{stat.value}</p>
                <p className="demo-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-stats-photo">
          <img
            src="/demo/workshop.jpg"
            alt="Craftsman shaping timber in the workshop"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
