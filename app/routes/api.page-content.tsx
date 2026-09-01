import {data as json} from 'react-router';
import type {Route} from './+types/api.page-content';
import {isAdminCustomer} from '~/lib/adminCheck.server';
import {
  ensureDraft,
  getPageContent,
  publishDraft,
  resetDraft,
  saveDraft,
} from '~/lib/pageContent.server';
import type {PageContentMap} from '~/lib/pageContent';

/**
 * The toolbar's write endpoint. `isAdminCustomer` is the *only* gate on
 * `draft_data` — the Admin token bypasses Shopify's own visibility rules — so
 * any new route reading this metaobject has to repeat the check.
 */
type Intent = 'ensure-draft' | 'save' | 'publish' | 'reset';

interface RequestBody {
  intent?: Intent;
  slug?: string;
  patch?: PageContentMap;
}

export async function action({request, context}: Route.ActionArgs) {
  if (!(await isAdminCustomer(context))) {
    return json({success: false, error: 'Not authorized'}, {status: 401});
  }

  const body = (await request.json()) as RequestBody;
  const slug = body.slug;
  if (!slug) {
    return json({success: false, error: 'slug is required'}, {status: 400});
  }

  const {env} = context;

  switch (body.intent) {
    case 'ensure-draft':
      return json(await ensureDraft(env, slug));
    case 'save':
      return json(await saveDraft(env, slug, body.patch ?? {}));
    case 'publish':
      return json(await publishDraft(env, slug));
    case 'reset':
      return json(await resetDraft(env, slug));
    default:
      return json({success: false, error: 'Unknown intent'}, {status: 400});
  }
}

/** Admin-only refetch after a mutation. Pages read their own copy in their
 *  loader (`loadPageContentState`), so shoppers never call this. */
export async function loader({request, context}: Route.LoaderArgs) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) {
    return json({error: 'slug query param is required'}, {status: 400});
  }

  if (!(await isAdminCustomer(context))) {
    return json({error: 'Not authorized'}, {status: 401});
  }

  const row = await getPageContent(context.env, slug);
  return json({...row, isAdmin: true});
}
