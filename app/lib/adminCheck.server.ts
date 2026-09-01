import {CUSTOMER_EMAIL_QUERY} from '~/graphql/customer-account/CustomerEmailQuery';

/**
 * "Admin" is not a separate login — it is a logged-in Shopify Customer Account
 * (`account_.login`) whose email is listed in `ADMIN_ALLOWLIST_EMAILS`. The
 * check re-runs per request, so removing an email revokes access immediately.
 */
interface CustomerEmailQueryResult {
  customer?: {
    emailAddress?: {emailAddress?: string} | null;
  } | null;
}

/** Structural subset of Hydrogen's `context.customerAccount` this check needs. */
interface CustomerAccountLike {
  isLoggedIn: () => Promise<boolean>;
  query: <T>(
    query: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<{data?: T; errors?: unknown[]}>;
}

export interface AdminCheckContext {
  customerAccount: CustomerAccountLike;
  env: {ADMIN_ALLOWLIST_EMAILS?: string};
}

export async function isAdminCustomer(
  context: AdminCheckContext,
): Promise<boolean> {
  // Local dev: everyone is an admin, so the toolbar can be worked on without a
  // Customer Account login (which needs a tunnel to work on localhost anyway).
  // `import.meta.env.DEV` is statically replaced with `false` in a production
  // build, so this branch is dead code on Oxygen — it cannot be flipped on by
  // an env var or a header. It does mean anyone who can reach your dev server
  // can edit: don't run `--host` on an untrusted network.
  if (import.meta.env.DEV) return true;

  const allowlist = (context.env.ADMIN_ALLOWLIST_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Nobody is an admin until the allowlist is configured — checked before the
  // session lookup so an unconfigured storefront costs no extra request.
  if (!allowlist.length) return false;
  if (!(await context.customerAccount.isLoggedIn())) return false;

  const {data, errors} =
    await context.customerAccount.query<CustomerEmailQueryResult>(
      CUSTOMER_EMAIL_QUERY,
    );
  if (errors?.length) return false;

  const email = data?.customer?.emailAddress?.emailAddress;
  return email ? allowlist.includes(email.toLowerCase()) : false;
}
