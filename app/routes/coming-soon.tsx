import {data, redirect, useActionData} from 'react-router';
import type {Route} from './+types/coming-soon';
import {SITE_NAME} from '~/lib/site';

export const meta: Route.MetaFunction = () => {
  return [{title: `${SITE_NAME} | Coming soon`}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {session} = context;

  if (session.get('site_unlocked')) {
    throw redirect('/');
  }

  return null;
}

export async function action({request, context}: Route.ActionArgs) {
  const {session, env} = context;
  const formData = await request.formData();
  const password = String(formData.get('password') || '').trim();
  const sitePassword = env.SITE_PASSWORD;

  if (!sitePassword || password === sitePassword) {
    session.set('site_unlocked', true);
    throw redirect('/');
  }

  return data({error: 'Incorrect password. Please try again.'}, {status: 401});
}

export default function ComingSoon() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="coming-soon">
      <div className="coming-soon-inner">
        <img
          src="/logo.svg"
          alt={SITE_NAME}
          className="coming-soon-logo"
          width={170}
          height={48}
        />

        <div className="eyebrow coming-soon-eyebrow">Coming soon</div>
        <h1 className="coming-soon-title">
          Something new is being <em>crafted.</em>
        </h1>
        <p className="coming-soon-lede">
          We&apos;re building the next chapter of {SITE_NAME}. If you have
          the password, you can take an early look.
        </p>

        <form method="post" className="coming-soon-form" noValidate>
          <label htmlFor="password" className="coming-soon-label">
            Password
          </label>
          <div className="coming-soon-field">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              required
            />
            <button type="submit" className="btn btn-primary">
              Enter
            </button>
          </div>
          {actionData?.error && (
            <p className="coming-soon-error" role="alert">
              {actionData.error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
