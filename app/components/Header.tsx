import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
  Money,
} from '@shopify/hydrogen';
import type {
  HeaderQuery,
  CartApiQueryFragment,
  SearchSuggestionsQuery,
} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {CurrencySwitcher} from '~/components/CurrencySwitcher';
import {HeaderSearch} from '~/components/HeaderSearch';
import {shouldHideCollection} from '~/lib/site';

/**
 * Shopify menu item `url` fields come back as fully-qualified URLs (the
 * shop's myshopify.com domain or its primary domain) — strip that down to a
 * path so `<NavLink to>` matches client-side routes instead of doing a full
 * page navigation. Anything else (an external link, or already-relative)
 * passes through unchanged.
 */
function resolveMenuItemUrl(
  url: string | null | undefined,
  primaryDomainUrl: string,
  publicStoreDomain: string,
) {
  if (!url) return null;
  if (
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
  ) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
}

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  searchSuggestions: Promise<SearchSuggestionsQuery | null>;
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

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
  searchSuggestions,
}: HeaderProps) {
  const {shop, menu, collections, localization} = header;
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
        />

        <HeaderSearch categories={categories} searchSuggestions={searchSuggestions} />

        <div className="header-topbar-ctas">
          <HeaderMenuMobileToggle />
          <SearchToggle />
          <AccountLink isLoggedIn={isLoggedIn} />
          <CurrencySwitcher localization={localization} />
          <CartToggle
            cart={cart}
            currencyCode={localization?.country.currency.isoCode ?? 'GBP'}
          />
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
  const items = menu?.items ?? [];

  if (viewport === 'mobile') {
    return (
      <nav className="header-menu-mobile" role="navigation">
        {items.map((item) => {
          const url = resolveMenuItemUrl(item.url, primaryDomainUrl, publicStoreDomain);
          if (!url) return null;
          return (
            <div key={item.id}>
              <NavLink
                end={url === '/'}
                onClick={close}
                prefetch="intent"
                to={url}
                className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}
              >
                {item.title}
              </NavLink>
              {item.items?.map((child) => {
                const childUrl = resolveMenuItemUrl(child.url, primaryDomainUrl, publicStoreDomain);
                if (!childUrl) return null;
                return (
                  <NavLink
                    key={child.id}
                    onClick={close}
                    prefetch="intent"
                    to={childUrl}
                    className={({isActive}) => `header-menu-item header-menu-item--child${isActive ? ' active' : ''}`}
                  >
                    {child.title}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="header-menu-desktop" role="navigation">
      {items.map((item) => {
        const url = resolveMenuItemUrl(item.url, primaryDomainUrl, publicStoreDomain);
        if (!url) return null;
        const children = item.items ?? [];

        if (children.length > 0) {
          return (
            <div className="header-dropdown" key={item.id}>
              <NavLink
                end={url === '/'}
                prefetch="intent"
                to={url}
                className={({isActive}) => `header-menu-item header-dropdown-toggle${isActive ? ' active' : ''}`}
              >
                {item.title}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </NavLink>
              <div className="header-dropdown-menu">
                {children.map((child) => {
                  const childUrl = resolveMenuItemUrl(child.url, primaryDomainUrl, publicStoreDomain);
                  if (!childUrl) return null;
                  return (
                    <NavLink key={child.id} prefetch="intent" to={childUrl} className="header-dropdown-item">
                      {child.title}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <NavLink
            key={item.id}
            end={url === '/'}
            prefetch="intent"
            to={url}
            className={({isActive}) => `header-menu-item${isActive ? ' active' : ''}`}
          >
            {item.title}
          </NavLink>
        );
      })}
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
  currencyCode,
}: {
  count: number;
  subtotal?: {amount?: string; currencyCode?: string};
  /** Currency for the empty-cart zero — an empty cart carries no cost of its own. */
  currencyCode: string;
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
        <Money
          data={{
            amount: subtotal?.amount ?? '0.0',
            currencyCode: (subtotal?.currencyCode ??
              currencyCode) as CartApiQueryFragment['cost']['subtotalAmount']['currencyCode'],
          }}
        />
      </span>
    </a>
  );
}

function CartToggle({
  cart,
  currencyCode,
}: Pick<HeaderProps, 'cart'> & {currencyCode: string}) {
  return (
    <Suspense fallback={<CartBadge count={0} currencyCode={currencyCode} />}>
      <Await resolve={cart}>
        <CartBanner currencyCode={currencyCode} />
      </Await>
    </Suspense>
  );
}

function CartBanner({currencyCode}: {currencyCode: string}) {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return (
    <CartBadge
      count={cart?.totalQuantity ?? 0}
      subtotal={cart?.cost?.subtotalAmount}
      currencyCode={currencyCode}
    />
  );
}
