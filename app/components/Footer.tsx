import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {CONTACT_EMAIL, FLAGSHIP_PAGE_ROUTES} from '~/lib/site';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

const FOOTER_COLS = [
  {
    heading: 'Shop',
    links: [
      {title: 'Study', url: '/collections/study'},
      {title: 'Storage', url: '/collections/storage'},
      {title: 'Gift card', url: '/products/gift-card'},
    ],
  },
  {
    heading: 'Workshop',
    links: [
      {title: 'Our makers', url: FLAGSHIP_PAGE_ROUTES.about},
      {title: 'Materials', url: '/pages/materials'},
      {title: 'Process', url: '/pages/process'},
      {title: 'Bespoke commissions', url: '/pages/bespoke'},
      {title: 'Visit us', url: '/pages/showroom'},
      {title: 'Journal', url: '/blogs'},
    ],
  },
  {
    heading: 'Care',
    links: [
      {title: '25-year guarantee', url: '/pages/guarantee'},
      {title: 'Delivery', url: '/pages/delivery'},
      {title: 'At-home trial', url: '/pages/trial'},
      {title: 'Care guides', url: '/pages/care'},
      {title: 'Repairs', url: '/pages/repairs'},
      {title: 'Contact', url: FLAGSHIP_PAGE_ROUTES.contact},
    ],
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
                  Solid-timber furniture, made by a four-person workshop in the Cotswolds since 1998. No flat-pack, no veneers — just timber, time and patience.
                </p>
                <div className="footer-socials">
                  <a href="https://instagram.com" aria-label="Instagram" className="footer-social-btn" target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                    </svg>
                  </a>
                  <a href="https://pinterest.com" aria-label="Pinterest" className="footer-social-btn" target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.96-2.64.93 0 1.38.7 1.38 1.53 0 .93-.6 2.33-.9 3.63-.26 1.08.53 1.96 1.59 1.96 1.9 0 3.37-2 3.37-4.9 0-2.56-1.84-4.35-4.47-4.35-3.04 0-4.82 2.28-4.82 4.64 0 .92.35 1.9.79 2.44.09.1.1.2.07.3l-.29 1.19c-.05.18-.16.22-.36.13-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.73 7.35-6.73 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.54-1.27l-.69 2.59c-.25.96-.93 2.16-1.38 2.89.04.01.08.02.12.02z"/>
                    </svg>
                  </a>
                  <a href="https://youtube.com" aria-label="YouTube" className="footer-social-btn" target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                  <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email" className="footer-social-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </a>
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
                <span className="footer-copy">© Craft Wood Furniture Ltd · est. 1998 · Aldsworth, Cotswolds</span>
                <nav className="footer-bottom-links">
                  <NavLink prefetch="intent" to="/policies/privacy-policy">Privacy</NavLink>
                  <NavLink prefetch="intent" to="/policies/terms-of-service">Terms</NavLink>
                  <NavLink prefetch="intent" to="/pages/trade">Trade enquiries</NavLink>
                </nav>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
