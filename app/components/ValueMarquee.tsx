import {EditableText} from '~/components/EditableText';

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
          // The track is the props doubled back-to-back for a seamless CSS
          // loop — both copies must always show the same text, so they share
          // one field id (`i % VALUE_PROPS.length`) rather than getting their
          // own and being editable independently.
          <span className="demo-marquee-item" key={i}>
            <EditableText field={`values.${i % VALUE_PROPS.length}`}>{item}</EditableText>
            <span className="demo-marquee-dot" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
