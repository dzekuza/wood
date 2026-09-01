import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {SocialLinks} from '~/components/SocialLinks';
import {FLAGSHIP_PAGE_ROUTES} from '~/lib/site';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

/**
 * Only routes that actually resolve belong here. The previous list linked to a
 * dozen `/pages/*` handles that have no Shopify page behind them (materials,
 * process, bespoke, showroom, guarantee, delivery, trial, care, repairs) plus
 * two collections and a gift-card product that do not exist — every one of them
 * a 404. Add a link back only once its page is live.
 */
const FOOTER_COLS = [
  {
    heading: 'Shop',
    links: [
      {title: 'All products', url: '/collections/all'},
      {title: 'By category', url: '/collections'},
    ],
  },
  {
    heading: 'Workshop',
    links: [
      {title: 'Our makers', url: FLAGSHIP_PAGE_ROUTES.about},
      {title: 'Journal', url: '/blogs'},
    ],
  },
  {
    heading: 'Care',
    links: [{title: 'Contact', url: FLAGSHIP_PAGE_ROUTES.contact}],
  },
];

export function Footer({footer: footerPromise, header, publicStoreDomain}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="site-footer">
            <div className="footer-inner">
              {/* Brand column */}
              <div className="footer-brand-col">
                <NavLink to="/" className="footer-logo-link">
                  <img src="/logo.svg" alt={header.shop.name} className="footer-logo-img" />
                </NavLink>
                <p className="footer-tagline">
                  Solid-timber furniture, cut, joined and finished by hand in our own workshop. No flat-pack, no veneers — just timber, time and patience.
                </p>
                <div className="footer-socials">
                  <SocialLinks linkClassName="footer-social-btn" />
                </div>
              </div>

              {/* Link columns */}
              {FOOTER_COLS.map((col) => (
                <div key={col.heading} className="footer-nav-col">
                  <div className="footer-col-heading">{col.heading}</div>
                  <ul className="footer-col-links">
                    {col.links.map((link) => (
                      <li key={link.url}>
                        <NavLink prefetch="intent" to={link.url}>{link.title}</NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="footer-bottom">
              <div className="footer-bottom-inner">
                <span className="footer-copy">© Craft Wood Furniture Ltd</span>
                <nav className="footer-bottom-links">
                  <NavLink prefetch="intent" to="/policies/privacy-policy">Privacy</NavLink>
                  <NavLink prefetch="intent" to="/policies/terms-of-service">Terms</NavLink>
                </nav>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
