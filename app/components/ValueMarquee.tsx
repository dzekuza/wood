const VALUE_PROPS = [
  'Solid European Oak',
  'Handcrafted Since 2014',
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
            <span className="demo-marquee-dot" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
