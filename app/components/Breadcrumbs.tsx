import {Fragment} from 'react';
import {Link} from 'react-router';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

const CHEVRON = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Shared breadcrumb trail — `.crumbbar`/`.crumb`/`.crumb-here` styling lives
 * in app.css (also used inline by products.$handle.tsx). `items` excludes
 * Home; it's always prepended. The last item renders as the current page
 * (no link) unless it carries its own `to`.
 */
export function Breadcrumbs({items}: {items: BreadcrumbItem[]}) {
  const trail: BreadcrumbItem[] = [{label: 'Home', to: '/'}, ...items];

  return (
    <div className="crumbbar">
      <div className="archive-wrap">
        <div className="crumb">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <Fragment key={item.label}>
                {item.to && !isLast ? (
                  <Link to={item.to}>{item.label}</Link>
                ) : (
                  <span className={isLast ? 'crumb-here' : undefined}>{item.label}</span>
                )}
                {!isLast && CHEVRON}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
