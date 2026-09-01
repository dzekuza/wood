/**
 * Minimal Admin GraphQL client. Server-only — never import this from a
 * component; the Admin token bypasses every Storefront visibility rule.
 *
 * The scripts in `scripts/*.mjs` talk to the same API with the same token,
 * so the env var name is deliberately shared (`SHOPIFY_ADMIN_TOKEN`).
 */
const ADMIN_API_VERSION = '2026-04';

export interface ShopifyAdminEnv {
  SHOPIFY_ADMIN_TOKEN?: string;
  /** Only needed when `PUBLIC_STORE_DOMAIN` is a custom/alias domain — the
   *  Admin API is only reachable on the real `*.myshopify.com` handle. */
  SHOPIFY_ADMIN_SHOP_DOMAIN?: string;
  PUBLIC_STORE_DOMAIN?: string;
}

interface AdminCredentials {
  token: string;
  shopDomain: string;
}

/** Null when the storefront is not configured for Admin access — callers treat
 *  that as "no CMS", not as an error, so a missing token cannot 500 a page. */
export function adminCredentials(env: ShopifyAdminEnv): AdminCredentials | null {
  const token = env.SHOPIFY_ADMIN_TOKEN;
  const shopDomain = env.SHOPIFY_ADMIN_SHOP_DOMAIN || env.PUBLIC_STORE_DOMAIN;
  if (!token || !shopDomain) return null;
  return {token, shopDomain};
}

export async function shopifyAdminGraphQL<T>(
  credentials: AdminCredentials,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(
    `https://${credentials.shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': credentials.token,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const body = (await response.json()) as {
    data?: T;
    errors?: Array<{message: string}>;
  };

  if (body.errors?.length) {
    throw new Error(
      `Shopify Admin API error: ${body.errors.map((e) => e.message).join('; ')}`,
    );
  }
  if (!body.data) {
    throw new Error(
      `Shopify Admin API returned no data (status ${response.status})`,
    );
  }
  return body.data;
}
