const ADMIN_API_VERSION = '2025-01';

type MarketingState = 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'PENDING';

type AdminGraphQLError = {
  message: string;
};

type AdminUserError = {
  field?: string[] | null;
  message: string;
};

type NewsletterLookupResponse = {
  customers: {
    nodes: Array<{
      id: string;
      defaultEmailAddress?: {
        emailAddress: string;
        marketingState: MarketingState;
        marketingOptInLevel: string | null;
        marketingUpdatedAt: string | null;
      } | null;
    }>;
  };
};

type NewsletterMutationResponse = {
  customerCreate?: {
    userErrors: AdminUserError[];
  };
  customerEmailMarketingConsentUpdate?: {
    userErrors: AdminUserError[];
  };
};

export type NewsletterSignupResult =
  | {status: 'success'; message: string}
  | {status: 'duplicate'; message: string}
  | {status: 'error'; message: string};

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function subscribeEmailToNewsletter({
  adminToken,
  storeDomain,
  email,
}: {
  adminToken?: string;
  storeDomain?: string;
  email: string;
}): Promise<NewsletterSignupResult> {
  if (!adminToken || !storeDomain) {
    return {
      status: 'error',
      message: 'Newsletter signup is not configured right now. Please email us directly instead.',
    };
  }

  const normalizedEmail = normalizeNewsletterEmail(email);
  const existingCustomer = await lookupCustomerByEmail({
    adminToken,
    email: normalizedEmail,
    storeDomain,
  });

  if (existingCustomer) {
    if (existingCustomer.defaultEmailAddress?.marketingState === 'SUBSCRIBED') {
      return {
        status: 'duplicate',
        message: 'You are already on the list. We will write when something new reaches the bench.',
      };
    }

    await adminGraphQL<NewsletterMutationResponse>({
      adminToken,
      query: NEWSLETTER_CONSENT_UPDATE_MUTATION,
      storeDomain,
      variables: {
        input: {
          customerId: existingCustomer.id,
          emailMarketingConsent: {
            consentUpdatedAt: new Date().toISOString(),
            marketingOptInLevel: 'SINGLE_OPT_IN',
            marketingState: 'SUBSCRIBED',
          },
        },
      },
    });

    return {
      status: 'success',
      message: 'You are subscribed. Expect occasional workshop notes and first notice on new releases.',
    };
  }

  await adminGraphQL<NewsletterMutationResponse>({
    adminToken,
    query: NEWSLETTER_CUSTOMER_CREATE_MUTATION,
    storeDomain,
    variables: {
      input: {
        email: normalizedEmail,
        emailMarketingConsent: {
          consentUpdatedAt: new Date().toISOString(),
          marketingOptInLevel: 'SINGLE_OPT_IN',
          marketingState: 'SUBSCRIBED',
        },
      },
    },
  });

  return {
    status: 'success',
    message: 'You are subscribed. Expect occasional workshop notes and first notice on new releases.',
  };
}

async function lookupCustomerByEmail({
  adminToken,
  email,
  storeDomain,
}: {
  adminToken: string;
  email: string;
  storeDomain: string;
}) {
  const data = await adminGraphQL<NewsletterLookupResponse>({
    adminToken,
    query: NEWSLETTER_LOOKUP_QUERY,
    storeDomain,
    variables: {
      query: `email:${email}`,
    },
  });

  return data.customers.nodes[0] ?? null;
}

async function adminGraphQL<T>({
  adminToken,
  query,
  storeDomain,
  variables,
}: {
  adminToken: string;
  query: string;
  storeDomain: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(
    `https://${storeDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const payload = (await response.json()) as {
    data?: T;
    errors?: AdminGraphQLError[];
  };

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(payload.errors?.[0]?.message ?? 'Shopify Admin API request failed.');
  }

  const userErrors = collectUserErrors(payload.data as NewsletterMutationResponse);
  if (userErrors.length > 0) {
    throw new Error(userErrors[0].message);
  }

  return payload.data;
}

function collectUserErrors(data: NewsletterMutationResponse) {
  return [
    ...(data.customerCreate?.userErrors ?? []),
    ...(data.customerEmailMarketingConsentUpdate?.userErrors ?? []),
  ];
}

const NEWSLETTER_LOOKUP_QUERY = `
  query NewsletterCustomerLookup($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        defaultEmailAddress {
          emailAddress
          marketingState
          marketingOptInLevel
          marketingUpdatedAt
        }
      }
    }
  }
`;

const NEWSLETTER_CUSTOMER_CREATE_MUTATION = `
  mutation NewsletterCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

const NEWSLETTER_CONSENT_UPDATE_MUTATION = `
  mutation NewsletterConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;
