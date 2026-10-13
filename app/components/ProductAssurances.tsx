import {Fragment, type ReactNode} from 'react';
import {EditableText} from '~/components/EditableText';

interface Assurance {
  icon: ReactNode;
  title: string;
  detail: string;
}

/** Tabler outline paths, drawn inside the shared `.pdp-assure-icon` svg. */
const ICONS = {
  truck: (
    <>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  hammer: (
    <>
      <path d="M11.414 10l-7.383 7.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l7.407 -7.385" />
      <path d="M18.121 15.293l2.586 -2.586a1 1 0 0 0 0 -1.414l-7.586 -7.586a1 1 0 0 0 -1.414 0l-2.586 2.586a1 1 0 0 0 0 1.414l7.586 7.586a1 1 0 0 0 1.414 0z" />
    </>
  ),
  package: (
    <>
      <path d="M12 3l8 4.5v9l-8 4.5l-8 -4.5v-9l8 -4.5" />
      <path d="M12 12l8 -4.5" />
      <path d="M12 12v9" />
      <path d="M12 12l-8 -4.5" />
      <path d="M16 5.25l-8 4.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
};

/** Coded defaults; the toolbar overrides them under `product.assure.{i}.*`.
 *  Tile 0's title is the lead time, so it is fed in rather than listed here. */
const ASSURANCES: Assurance[] = [
  {icon: ICONS.truck, title: '', detail: 'Made to order'},
  {icon: ICONS.hammer, title: 'Crafted Solid Oak', detail: 'Shaped, sanded and finished'},
  {icon: ICONS.package, title: 'Free UK delivery', detail: 'Carefully packed for transit'},
  {icon: ICONS.leaf, title: 'Solid European Oak', detail: 'Natural grain, unique character'},
];

const GUARANTEES = ['Secure checkout', '30-day returns', 'Free UK delivery included'];

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** "Secure checkout · 30-day returns · …" strip under the add-to-cart row. */
export function ProductGuarantees() {
  return (
    <div className="pdp-guarantee">
      {GUARANTEES.map((label, index) => (
        <Fragment key={label}>
          {index > 0 ? <span className="pdp-guarantee-sep">·</span> : null}
          <span>
            {index === 0 ? <LockIcon /> : null}
            <EditableText field={`product.guarantee.${index}`}>{label}</EditableText>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * The four assurance tiles on the PDP. Copy is shared by every product (slug
 * `product`), except tile 0's title — the lead time, which stays per-product
 * via the `custom.lead_time` metafield.
 */
export function ProductAssurances({leadTime}: {leadTime: string}) {
  return (
    <div className="pdp-assure">
      {ASSURANCES.map((item, index) => (
        <div key={item.detail} className="pdp-assure-item">
          <svg className="pdp-assure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {item.icon}
          </svg>
          <div>
            {index === 0 ? (
              <strong className="pdp-assure-strong">{leadTime}</strong>
            ) : (
              <EditableText as="span" className="pdp-assure-strong" field={`product.assure.${index}.title`}>
                {item.title}
              </EditableText>
            )}
            <EditableText as="span" className="pdp-assure-small" field={`product.assure.${index}.detail`}>
              {item.detail}
            </EditableText>
          </div>
        </div>
      ))}
    </div>
  );
}
