import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';

const BENEFITS = [
  {icon: 'ti-shield-check', title: 'Durability'},
  {icon: 'ti-tree', title: 'Sustainability'},
  {icon: 'ti-hammer', title: 'Handcrafted'},
  {icon: 'ti-hourglass-empty', title: 'Timeless Design'},
  {icon: 'ti-droplet-off', title: 'Low Maintenance'},
  {icon: 'ti-certificate', title: 'Built to Last'},
];

const HEADING_LINES = ['Six reasons our furniture', 'outlasts the trend'];

export function OakBenefits() {
  return (
    <section className="demo-benefits">
      <div className="demo-benefits-head">
        <EditableText as="p" className="demo-benefits-eyebrow" field="benefits.eyebrow">
          Why Solid Oak
        </EditableText>
        <h2 className="demo-benefits-heading">
          {HEADING_LINES.map((line, i) => (
            <span key={i}>
              <EditableText field={`benefits.heading.${i}`}>{line}</EditableText>
              {i < HEADING_LINES.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <Link to="/collections/all" className="demo-btn demo-btn-solid-dark">
          <EditableText field="benefits.ctaLabel">Shop All</EditableText>
        </Link>
      </div>

      <div className="demo-benefits-grid">
        {BENEFITS.map((benefit, index) => (
          <div className="demo-benefit-card" key={benefit.title}>
            <span className="demo-benefit-icon">
              <i className={`ti ${benefit.icon}`} />
            </span>
            <EditableText as="p" className="demo-benefit-title" field={`benefits.items.${index}.title`}>
              {benefit.title}
            </EditableText>
          </div>
        ))}
      </div>
    </section>
  );
}
