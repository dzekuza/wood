/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** When set, gates the whole storefront behind /coming-soon until this password is submitted. */
    SITE_PASSWORD?: string;
    /** Admin API access token (`shpat_…`). Server-only — it bypasses every
     *  Storefront visibility rule. Also used by the `scripts/*.mjs` tools. */
    SHOPIFY_ADMIN_TOKEN?: string;
    /** The real `*.myshopify.com` handle. Only needed when
     *  `PUBLIC_STORE_DOMAIN` is a custom/alias domain, which the Admin API
     *  does not answer on. */
    SHOPIFY_ADMIN_SHOP_DOMAIN?: string;
    /** Comma-separated Customer Account emails allowed to use the edit
     *  toolbar. Empty or unset means nobody is an admin. */
    ADMIN_ALLOWLIST_EMAILS?: string;
  }
}
