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
import {useUnitSystem} from '~/hooks/useUnitSystem';
import {FLAGSHIP_PAGE_ROUTES, shouldHideCollection} from '~/lib/site';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';


export function Header({header, isLoggedIn, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu, collections} = header;
  const categories = (collections?.nodes ?? []).filter(
    (collection) =>
      !shouldHideCollection({
        handle: collection.handle,
        title: collection.title,
      }),
  );
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
        categories={categories}
      />

      {/* Right CTAs */}
      <div className="header-ctas">
        <UnitToggle />
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

function UnitToggle() {
  const {unit, setUnit} = useUnitSystem();
  return (
    <div className="unit-toggle" role="group" aria-label="Measurement units">
      <button
        type="button"
        className={`unit-toggle-opt${unit === 'imperial' ? ' is-active' : ''}`}
        aria-pressed={unit === 'imperial'}
        onClick={() => setUnit('imperial')}
      >
        in
      </button>
      <button
        type="button"
        className={`unit-toggle-opt${unit === 'metric' ? ' is-active' : ''}`}
        aria-pressed={unit === 'metric'}
        onClick={() => setUnit('metric')}
      >
        cm
      </button>
    </div>
  );
}

function FavouritesLink() {
  const {favourites} = useFavourites();
  const count = favourites.length;
  const badgeLabel = count > 99 ? '99+' : String(count);
  return (
    <NavLink
      prefetch="intent"
      to="/pages/favourites"
      aria-label={`Favourites (${count})`}
      className="header-icon-link"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {count > 0 && <span className="header-icon-badge">{badgeLabel}</span>}
    </NavLink>
  );
}

function AccountLink({isLoggedIn}: Pick<HeaderProps, 'isLoggedIn'>) {
  return (
    <NavLink prefetch="intent" to="/account" aria-label="Account" className="header-icon-link">
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
    <button className="reset header-icon-link" onClick={() => open('search')} aria-label="Search">
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
      className="header-icon-link"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(243,239,234,0.7)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && <span className="header-icon-badge">{count}</span>}
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
