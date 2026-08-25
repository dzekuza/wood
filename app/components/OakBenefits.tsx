import {Link} from 'react-router';

const BENEFITS = [
  {icon: 'ti-shield-check', title: 'Durability'},
  {icon: 'ti-tree', title: 'Sustainability'},
  {icon: 'ti-hammer', title: 'Handcrafted'},
  {icon: 'ti-hourglass-empty', title: 'Timeless Design'},
  {icon: 'ti-droplet-off', title: 'Low Maintenance'},
  {icon: 'ti-certificate', title: 'Built to Last'},
];

export function OakBenefits() {
  return (
    <section className="demo-benefits">
      <div className="demo-benefits-head">
        <p className="demo-benefits-eyebrow">Why Solid Oak</p>
        <h2 className="demo-benefits-heading">
          Six reasons our furniture
          <br />
          outlasts the trend
        </h2>
        <Link to="/collections/all" className="demo-btn demo-btn-solid-dark">
          Shop All
        </Link>
      </div>

      <div className="demo-benefits-grid">
        {BENEFITS.map((benefit) => (
          <div className="demo-benefit-card" key={benefit.title}>
            <span className="demo-benefit-icon">
              <i className={`ti ${benefit.icon}`} />
            </span>
            <p className="demo-benefit-title">{benefit.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
