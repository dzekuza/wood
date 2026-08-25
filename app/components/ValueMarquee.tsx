const VALUE_PROPS = [
  'Solid European Oak',
  'Handcrafted Since 1998',
  '25-Year Repair Guarantee',
  'Free UK Delivery',
  'Made in the Cotswolds',
];

export function ValueMarquee() {
  const items = [...VALUE_PROPS, ...VALUE_PROPS];

  return (
    <div className="demo-marquee">
      <div className="demo-marquee-track">
        {items.map((item, i) => (
          <span className="demo-marquee-item" key={i}>
            {item}
            <i className="ti ti-point-filled" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
