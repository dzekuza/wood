import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {seoMeta} from '~/lib/seo';
import {SITE_NAME} from '~/lib/site';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: `Policies | ${SITE_NAME}`,
    description: `Delivery, returns, privacy and terms for ${SITE_NAME}.`,
    path: '/policies',
  });

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="archive-page">
      <Breadcrumbs items={[{label: 'Policies'}]} />
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">Policies</h1>
          </div>
        </div>
      </div>
      <section className="cms-page-shell">
        <div className="archive-wrap">
          <ul className="policy-list">
            {policies.map((policy) => (
              <li key={policy.id}>
                <Link to={`/policies/${policy.handle}`} className="policy-list-link">
                  <span>{policy.title}</span>
                  <i className="ti ti-arrow-right" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
