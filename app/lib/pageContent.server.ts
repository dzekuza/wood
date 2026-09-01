import {CacheShort, createWithCache} from '@shopify/hydrogen';
import {
  EMPTY_PAGE_CONTENT,
  type DraftStatus,
  type PageContentMap,
  type PageContentState,
} from '~/lib/pageContent';
import {isAdminCustomer, type AdminCheckContext} from '~/lib/adminCheck.server';
import {
  adminCredentials,
  shopifyAdminGraphQL,
  type ShopifyAdminEnv,
} from '~/lib/shopifyAdmin.server';

/**
 * Inline-edited copy lives in a `page_content` metaobject, one entry per page,
 * keyed by Shopify's built-in handle (= the page slug).
 *
 * It is read and written **only** through the Admin API. Storefront visibility
 * in Shopify is whole-type, not per-field, so exposing `published_data`
 * publicly would expose `draft_data` with it — reading everything server-side
 * with the Admin token avoids that, and keeps the token off the client.
 */
const METAOBJECT_TYPE = 'page_content';

export interface ActionResult {
  success: boolean;
  error?: string;
}

interface PageContentRow {
  publishedData: PageContentMap;
  draftData: PageContentMap | null;
  draftStatus: DraftStatus;
}

interface LoaderLikeContext extends AdminCheckContext {
  env: ShopifyAdminEnv & {ADMIN_ALLOWLIST_EMAILS?: string};
  storefront: {cache?: Cache};
  waitUntil?: (promise: Promise<unknown>) => void;
}

// No `#graphql` tag on either document: codegen's `default` project validates
// every tagged document in `app/**` against the **Storefront** schema, and
// these are Admin API operations. Untagged, they are ignored by codegen —
// there is no local Admin schema to check them against.
const GET_QUERY = `
  query PageContent($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      publishedData: field(key: "published_data") { value }
      draftData: field(key: "draft_data") { value }
      draftStatus: field(key: "draft_status") { value }
    }
  }
` as const;

const UPSERT_MUTATION = `
  mutation UpsertPageContent(
    $handle: MetaobjectHandleInput!
    $metaobject: MetaobjectUpsertInput!
  ) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { handle }
      userErrors { field message code }
    }
  }
` as const;

interface GetQueryResult {
  metaobjectByHandle: {
    publishedData: {value: string} | null;
    draftData: {value: string} | null;
    draftStatus: {value: string} | null;
  } | null;
}

interface UpsertMutationResult {
  metaobjectUpsert: {
    metaobject: {handle: string} | null;
    userErrors: Array<{field: string[] | null; message: string; code: string}>;
  };
}

/** A stored map is a JSON string; a corrupt one must not take the page down. */
function parseMap(value: string | null | undefined): PageContentMap {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as PageContentMap)
      : {};
  } catch {
    return {};
  }
}

const EMPTY_ROW: PageContentRow = {
  publishedData: {},
  draftData: null,
  draftStatus: 'none',
};

async function readRow(
  env: ShopifyAdminEnv,
  slug: string,
): Promise<PageContentRow> {
  const credentials = adminCredentials(env);
  if (!credentials) return EMPTY_ROW;

  const data = await shopifyAdminGraphQL<GetQueryResult>(
    credentials,
    GET_QUERY,
    {handle: {type: METAOBJECT_TYPE, handle: slug}},
  );

  const node = data.metaobjectByHandle;
  const draftStatus = (node?.draftStatus?.value as DraftStatus) ?? 'none';
  return {
    publishedData: parseMap(node?.publishedData?.value),
    draftData:
      draftStatus === 'none' ? null : parseMap(node?.draftData?.value),
    draftStatus,
  };
}

interface UpsertFields {
  published_data?: PageContentMap;
  draft_data?: PageContentMap;
  draft_status?: DraftStatus;
}

async function upsert(
  env: ShopifyAdminEnv,
  slug: string,
  fields: UpsertFields,
): Promise<ActionResult> {
  const credentials = adminCredentials(env);
  if (!credentials) {
    return {success: false, error: 'Shopify Admin API is not configured'};
  }

  const data = await shopifyAdminGraphQL<UpsertMutationResult>(
    credentials,
    UPSERT_MUTATION,
    {
      handle: {type: METAOBJECT_TYPE, handle: slug},
      metaobject: {
        fields: Object.entries(fields).map(([key, value]) => ({
          key,
          // Only `draft_status` is a plain string; the two maps are JSON.
          value: key === 'draft_status' ? String(value) : JSON.stringify(value ?? {}),
        })),
      },
    },
  );

  const errors = data.metaobjectUpsert.userErrors;
  if (errors.length) {
    return {success: false, error: errors.map((e) => e.message).join('; ')};
  }
  return {success: true};
}

/**
 * The read path a page loader uses. Shoppers get published copy off a short
 * Oxygen cache — one Admin request amortised across visitors — while admins
 * always read live, so a Publish is visible on the very next load.
 *
 * Never throws: an unconfigured or unreachable CMS renders the page's coded
 * copy rather than a 500.
 */
export async function loadPageContentState(
  context: LoaderLikeContext,
  request: Request,
  slug: string,
): Promise<PageContentState> {
  try {
    const isAdmin = await isAdminCustomer(context);

    if (isAdmin) {
      const row = await readRow(context.env, slug);
      return {...row, isAdmin: true};
    }

    const cache = context.storefront.cache;
    const published = cache
      ? await createWithCache({
          cache,
          waitUntil: context.waitUntil ?? (() => {}),
          request,
        }).run(
          {
            cacheKey: ['page-content', slug],
            cacheStrategy: CacheShort(),
            shouldCacheResult: () => true,
          },
          () => readRow(context.env, slug).then((row) => row.publishedData),
        )
      : (await readRow(context.env, slug)).publishedData;

    return {...EMPTY_PAGE_CONTENT, publishedData: published};
  } catch (error) {
    console.error('[edit-toolbar] failed to load page content', error);
    return EMPTY_PAGE_CONTENT;
  }
}

/** Uncached admin read — used by the toolbar's own refetch after a mutation. */
export async function getPageContent(
  env: ShopifyAdminEnv,
  slug: string,
): Promise<PageContentRow> {
  return readRow(env, slug);
}

/** Idempotent: a draft that already exists is left untouched. */
export async function ensureDraft(
  env: ShopifyAdminEnv,
  slug: string,
): Promise<ActionResult> {
  const row = await readRow(env, slug);
  if (row.draftStatus !== 'none') return {success: true};
  // The draft starts as a copy of what is live, so an admin edits the page
  // they can see rather than an empty map.
  return upsert(env, slug, {
    draft_data: row.publishedData,
    draft_status: 'editing',
  });
}

export async function saveDraft(
  env: ShopifyAdminEnv,
  slug: string,
  patch: PageContentMap,
): Promise<ActionResult> {
  const row = await readRow(env, slug);
  return upsert(env, slug, {
    draft_data: {...(row.draftData ?? row.publishedData), ...patch},
    draft_status: 'editing',
  });
}

export async function publishDraft(
  env: ShopifyAdminEnv,
  slug: string,
): Promise<ActionResult> {
  const row = await readRow(env, slug);
  if (!row.draftData) return {success: false, error: 'No draft to publish'};
  return upsert(env, slug, {
    published_data: row.draftData,
    draft_data: {},
    draft_status: 'none',
  });
}

/** Discards the draft. Published copy is untouched. */
export async function resetDraft(
  env: ShopifyAdminEnv,
  slug: string,
): Promise<ActionResult> {
  return upsert(env, slug, {draft_data: {}, draft_status: 'none'});
}
