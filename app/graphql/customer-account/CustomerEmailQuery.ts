// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
// Lives here rather than beside `adminCheck.server.ts` so codegen validates it
// against the **customer-account** schema — the `default` codegen project
// globs all of `app/**` against the Storefront schema, where `Customer` has no
// `emailAddress` field.
export const CUSTOMER_EMAIL_QUERY = `#graphql
  query CustomerEmailForAdminCheck {
    customer {
      emailAddress {
        emailAddress
      }
    }
  }
` as const;
