/**
 * Inline copy overrides for a page, keyed by a dotted field id
 * (`hero.0.blurb`). Shared by client and server — no secrets, no Admin API
 * imports, so it is safe to pull into a component.
 *
 * This layer sits *on top of* the `home_page` metaobject
 * (see `homeContent.ts`): a field is only overridden once an admin has edited
 * it inline, so the precedence is
 * `page_content override → home_page metaobject → HOME_CONTENT_DEFAULTS`.
 */
export type PageContentMap = Record<string, string>;

/** `'none'` means no draft exists; the toolbar is idle. */
export type DraftStatus = 'none' | 'editing' | 'ready';

export interface PageContentState {
  publishedData: PageContentMap;
  /** Admin-only: null for shoppers, and for admins with no draft in progress. */
  draftData: PageContentMap | null;
  draftStatus: DraftStatus;
  isAdmin: boolean;
}

export const EMPTY_PAGE_CONTENT: PageContentState = {
  publishedData: {},
  draftData: null,
  draftStatus: 'none',
  isAdmin: false,
};

/**
 * Slug of the landing page's `page_content` entry. Lives here, not in
 * `pageContent.server.ts`: the component tree names it too
 * (`<EditToolbarProvider slug={LANDING_SLUG}>`), and React Router only strips
 * server code from `loader`/`action`/`middleware`/`headers` — a value a
 * *component* imports drags its whole module into the client bundle.
 */
export const LANDING_SLUG = 'index';

/** Builds a stable dotted field id — `fieldId('hero', 0, 'blurb')`. */
export function fieldId(...parts: Array<string | number>): string {
  return parts.join('.');
}
