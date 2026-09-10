import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';

const STATS = [
  {value: '27+', label: 'Years of craft', theme: 'sand'},
  {value: '4', label: 'Person workshop', theme: 'cream'},
  {value: '4.9★', label: 'Average rating', theme: 'sage'},
  {value: '100%', label: 'Solid oak, no veneer', theme: 'peach'},
] as const;

export function CraftStats() {
  return (
    <section className="demo-stats">
      <div className="demo-stats-grid">
        <div className="demo-stats-left">
          <div className="demo-stats-feature">
            <EditableText as="p" className="demo-stats-feature-title" field="stats.featureTitle">
              Meet the Makers
            </EditableText>
            <Link to="/about" className="demo-btn demo-btn-outline-dark demo-btn-sm">
              <EditableText field="stats.featureCtaLabel">Meet the Makers</EditableText>
            </Link>
          </div>

          <div className="demo-stats-2x2">
            {STATS.map((stat, index) => (
              <div className={`demo-stat-card demo-stat-${stat.theme}`} key={stat.label}>
                <EditableText as="p" className="demo-stat-value" field={`stats.items.${index}.value`}>
                  {stat.value}
                </EditableText>
                <EditableText as="p" className="demo-stat-label" field={`stats.items.${index}.label`}>
                  {stat.label}
                </EditableText>
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
