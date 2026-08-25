import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
  Money,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {HeaderSearch} from '~/components/HeaderSearch';
import {FLAGSHIP_PAGE_ROUTES, shouldHideCollection} from '~/lib/site';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

// Pages with a full-bleed hero right below the header, where the header
// should float transparently over it instead of pushing it down.
const HERO_OVERLAY_ROUTES = new Set(['/landing-oak']);

function useHeaderOverlay() {
  const {pathname} = useLocation();
  const isOverlay = HERO_OVERLAY_ROUTES.has(pathname);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isOverlay) return;
    setIsScrolled(window.scrollY > 40);
    function onScroll() {
      setIsScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOverlay]);

  return {isOverlay, isScrolled: isOverlay && isScrolled};
}

export function Header({header, isLoggedIn, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu, collections} = header;
  const {isOverlay, isScrolled} = useHeaderOverlay();
  const categories = (collections?.nodes ?? []).filter(
    (collection) =>
      !shouldHideCollection({
        handle: collection.handle,
        title: collection.title,
      }),
  );
  const headerClassName = [
    'header',
    isOverlay && 'header--overlay',
    isScrolled && 'is-scrolled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <AnnouncementBar />
      <div className="header-topbar">
        <NavLink prefetch="intent" to="/" className="header-logo" end>
          <img src="/darkwood.svg" alt={shop.name} />
        </NavLink>

        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
          categories={categories}
        />

        <HeaderSearch />

        <div className="header-topbar-ctas">
          <HeaderMenuMobileToggle />
          <SearchToggle />
          <AccountLink isLoggedIn={isLoggedIn} />
          <CartToggle cart={cart} />
        </div>
      </div>
    </header>
  );
}

type Category = {id: string; title: string; handle: string};

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
  categories = [],
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  categories?: Category[];
}) {
  const {close} = useAside();

  if (viewport === 'mobile') {
    return (
      <nav className="header-menu-mobile" role="navigation">
        <NavLink end onClick={close} prefetch="intent" to="/" className="header-menu-item">Home</NavLink>
        <NavLink onClick={close} prefetch="intent" to="/collections/all" className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>All Products</NavLink>
        {categories.map((c) => (
          <NavLink key={c.id} onClick={close} prefetch="intent" to={`/collections/${c.handle}`} className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>
            {c.title}
          </NavLink>
        ))}
        <NavLink onClick={close} prefetch="intent" to={FLAGSHIP_PAGE_ROUTES.contact} className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>Contact</NavLink>
        <NavLink onClick={close} prefetch="intent" to="/blogs" className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>Journal</NavLink>
      </nav>
    );
  }

  return (
    <nav className="header-menu-desktop" role="navigation">
      <NavLink prefetch="intent" to="/collections/all" className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>
        All Products
      </NavLink>
      {categories.length > 0 && (
        <div className="header-dropdown">
          <span className="header-menu-item header-dropdown-toggle">
            By Category <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
          <div className="header-dropdown-menu">
            {categories.map((c) => (
              <NavLink key={c.id} prefetch="intent" to={`/collections/${c.handle}`} className="header-dropdown-item">
                {c.title}
              </NavLink>
            ))}
          </div>
        </div>
      )}
      <NavLink prefetch="intent" to="/blogs" className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>
        Journal
      </NavLink>
      <NavLink prefetch="intent" to={FLAGSHIP_PAGE_ROUTES.contact} className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}>
        Contact
      </NavLink>
    </nav>
  );
}

function AccountLink({isLoggedIn}: Pick<HeaderProps, 'isLoggedIn'>) {
  return (
    <NavLink prefetch="intent" to="/account" aria-label="Account" className="header-account-btn">
      <i className="ti ti-user" aria-hidden />
      <span className="header-account-label">Account</span>
    </NavLink>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button className="header-menu-mobile-toggle reset" onClick={() => open('mobile')} aria-label="Open menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="reset header-icon-link" onClick={() => open('search')} aria-label="Search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
}

function CartBadge({
  count,
  subtotal,
}: {
  count: number;
  subtotal?: {amount?: string; currencyCode?: string};
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {cart, prevCart, shop, url: window.location.href || ''} as CartViewPayload);
      }}
      aria-label={`Cart (${count} items)`}
      className="header-cart-btn"
    >
      <i className="ti ti-shopping-cart" aria-hidden />
      <span className="header-cart-amount">
        {subtotal?.amount && subtotal.currencyCode ? (
          <Money data={{amount: subtotal.amount, currencyCode: subtotal.currencyCode as CartApiQueryFragment['cost']['subtotalAmount']['currencyCode']}} />
        ) : (
          '$0.00'
        )}
      </span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return (
    <CartBadge
      count={cart?.totalQuantity ?? 0}
      subtotal={cart?.cost?.subtotalAmount}
    />
  );
}
