import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {useFavourites} from '~/hooks/useFavourites';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const NAV_ITEMS = [
  {title: 'Collections', url: '/collections'},
  {title: 'Workshop', url: '/pages/workshop'},
  {title: 'Materials', url: '/pages/materials'},
  {title: 'Journal', url: '/blogs/journal'},
  {title: 'Showroom', url: '/pages/showroom'},
  {title: 'Contact', url: '/pages/contact'},
];

export function Header({header, isLoggedIn, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="header">
      <div className="header-inner">
      {/* Logo */}
      <NavLink prefetch="intent" to="/" className="header-logo" end>
        <img src="/darkwood.svg" alt={shop.name} />
      </NavLink>

      {/* Centered nav */}
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />

      {/* Right CTAs */}
      <div className="header-ctas">
        <HeaderMenuMobileToggle />
        <SearchToggle />
        <AccountLink isLoggedIn={isLoggedIn} />
        <FavouritesLink />
        <CartToggle cart={cart} />
      </div>
      </div>
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();

  if (viewport === 'mobile') {
    return (
      <nav className="header-menu-mobile" role="navigation">
        <NavLink end onClick={close} prefetch="intent" to="/" className="header-menu-item">
          Home
        </NavLink>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.url}
            className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}
            onClick={close}
            prefetch="intent"
            to={item.url}
          >
            {item.title}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav className="header-menu-desktop" role="navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.url}
          className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}
          prefetch="intent"
          to={item.url}
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

function FavouritesLink() {
  const {favourites} = useFavourites();
  const count = favourites.length;
  return (
    <NavLink prefetch="intent" to="/pages/favourites" aria-label={`Favourites (${count})`} style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 8, height: 8, borderRadius: '50%',
          background: '#e07b39', display: 'block',
        }} />
      )}
    </NavLink>
  );
}

function AccountLink({isLoggedIn}: Pick<HeaderProps, 'isLoggedIn'>) {
  return (
    <NavLink prefetch="intent" to="/account" aria-label="Account" style={{display: 'flex', alignItems: 'center'}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </NavLink>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button className="header-menu-mobile-toggle reset" onClick={() => open('mobile')} aria-label="Open menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="2" strokeLinecap="round">
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
    <button className="reset" onClick={() => open('search')} aria-label="Search" style={{display: 'flex', alignItems: 'center'}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
}

function CartBadge({count}: {count: number}) {
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
      style={{display: 'flex', alignItems: 'center', position: 'relative'}}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 8, height: 8, borderRadius: '50%',
          background: '#e07b39', display: 'block',
        }} />
      )}
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
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
