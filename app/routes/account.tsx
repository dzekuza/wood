import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="account-page">
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-header-inner">
            <div>
              <span className="eyebrow">Customer account</span>
              <h1>{heading}</h1>
            </div>
          </div>
        </div>
      </div>
      <section className="account-shell">
        <div className="cwf-wrap">
          <AccountMenu />
          <div className="account-content">
            <Outlet context={{customer}} />
          </div>
        </div>
      </section>
    </div>
  );
}

function AccountMenu() {
  function getAccountNavClass({
    isActive,
    isPending,
  }: {
    isActive: boolean;
    isPending: boolean;
  }) {
    return `account-menu-link${isActive ? ' active' : ''}${isPending ? ' pending' : ''}`;
  }

  return (
    <nav role="navigation" className="account-menu">
      <NavLink to="/account/orders" className={getAccountNavClass}>
        Orders
      </NavLink>
      <NavLink to="/account/profile" className={getAccountNavClass}>
        Profile
      </NavLink>
      <NavLink to="/account/addresses" className={getAccountNavClass}>
        Addresses
      </NavLink>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button type="submit" className="account-menu-link">
        Sign out
      </button>
    </Form>
  );
}
