import {useEffect, useRef} from 'react';
import {AnalyticsEvent, useAnalytics} from '@shopify/hydrogen';

type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js';
const CONSENT_EVENT = 'visitorConsentCollected';

/**
 * GA4, loaded only once the visitor has accepted analytics in Shopify's
 * privacy banner (`analytics_processing`). Renders nothing. It rides on
 * Hydrogen's analytics events, so it must sit inside `Analytics.Provider`.
 *
 * Checkout lives on Shopify's domain, so `purchase` is not sent from here.
 */
export function GoogleAnalytics({measurementId}: {measurementId: string}) {
  const {subscribe, register, canTrack} = useAnalytics();
  const subscribed = useRef(false);
  const loaded = useRef(false);
  const lastPageUrl = useRef<string | null>(null);
  const lastSentUrl = useRef<string | null>(null);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    const {ready} = register('Google Analytics 4');

    const load = () => {
      if (loaded.current) return;
      loaded.current = true;
      window.dataLayer = window.dataLayer ?? [];
      window.gtag = function gtag() {
        // gtag.js only understands the `arguments` object, not an array.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {send_page_view: false});
      const script = document.createElement('script');
      script.async = true;
      script.src = `${GTAG_SRC}?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    };

    const send = (...args: GtagArgs) => {
      if (!canTrack()) return;
      load();
      window.gtag?.(...args);
    };

    const sendPageView = (url: string) => {
      if (!canTrack() || url === lastSentUrl.current) return;
      lastSentUrl.current = url;
      send('event', 'page_view', {
        page_location: url,
        page_title: document.title,
      });
    };

    subscribe(AnalyticsEvent.PAGE_VIEWED, ({url}) => {
      lastPageUrl.current = url;
      sendPageView(url);
    });

    subscribe(AnalyticsEvent.PRODUCT_VIEWED, ({products}) => {
      send('event', 'view_item', {
        currency: 'GBP',
        value: Number(products[0]?.price ?? 0),
        items: products.map((product) => ({
          item_id: product.id,
          item_name: product.title,
          item_variant: product.variantTitle,
          item_brand: product.vendor,
          price: Number(product.price),
          quantity: product.quantity,
        })),
      });
    });

    subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, ({currentLine}) => {
      if (!currentLine) return;
      send('event', 'add_to_cart', {
        currency: currentLine.cost.totalAmount.currencyCode,
        value: Number(currentLine.cost.totalAmount.amount),
        items: [
          {
            item_id: currentLine.merchandise.product.id,
            item_name: currentLine.merchandise.product.title,
            item_variant: currentLine.merchandise.title,
            quantity: currentLine.quantity,
          },
        ],
      });
    });

    // A shopper who accepts after the first page has loaded: start tracking and
    // report the page they are already on.
    const onConsent = () => {
      if (lastPageUrl.current) sendPageView(lastPageUrl.current);
    };
    document.addEventListener(CONSENT_EVENT, onConsent);

    ready();
  }, [subscribe, register, canTrack, measurementId]);

  return null;
}
