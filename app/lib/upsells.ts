import type {ProductFragment} from 'storefrontapi.generated';

/** Shopify tag marking a product as an add-on (surcharge) rather than a real
 * catalog item. Tagging is how merchants keep new add-ons out of listings —
 * see `filterHiddenProducts`. */
export const ADDON_TAG = 'addon';

/** Storefront search-query clause excluding add-on products from listings. */
export const EXCLUDE_HIDDEN_PRODUCTS_QUERY = `-tag:${ADDON_TAG}`;

export type UpsellOption = {
  key: string;
  label: string;
  /** Present for paid options — the label doubles as the price lookup key against the group's surcharge variant. */
  variantTitle?: string;
};

/** One referenced add-on product, as returned by the PDP query. */
export type AddonProductReference = NonNullable<
  NonNullable<ProductFragment['addonProducts']>['references']
>['nodes'][number];

export type UpsellSurchargeVariant = Extract<
  AddonProductReference,
  {__typename?: 'Product'}
>['variants']['nodes'][number];

export type UpsellGroup = {
  /** The add-on product's id — stable across renames, unlike a handle. */
  id: string;
  /** Option-row heading on the PDP. */
  label: string;
  defaultOptionKey: string;
  /** Label for the always-free option, or null when every choice is paid. */
  defaultOptionLabel: string | null;
};

/** Loader-shaped data: each resolved group paired with its selectable options. */
export type UpsellGroupData = {
  group: UpsellGroup;
  options: Array<{option: UpsellOption; variant: UpsellSurchargeVariant | null}>;
};

/** Option key for a group's free choice. Paid options key off their variant id. */
export const FREE_OPTION_KEY = 'default';

/**
 * Add-on groups are defined entirely in Shopify — no code changes needed to
 * add, rename, reprice, or retire one:
 *
 * - An **add-on product** is any product tagged `addon`, carrying metafields
 *   `custom.addon_label` (the PDP row heading, e.g. "Working type") and
 *   `custom.addon_free_option` (the no-cost choice, e.g. "Sanded"; blank means
 *   every choice is paid). Each variant is one paid choice — its title is the
 *   button label and its price the surcharge.
 * - A **catalog product** opts in via `custom.addon_products`, a
 *   list-of-product-references metafield pointing at the add-on products it
 *   offers. Merchants pick these from a product picker in the admin.
 *
 * Unset or empty means this product shows no add-ons.
 */
export function buildUpsellGroups(
  references: readonly AddonProductReference[] | null | undefined,
): UpsellGroupData[] {
  if (!references?.length) return [];

  return references.flatMap((reference) => {
    if (reference.__typename !== 'Product') return [];

    const label = reference.addonLabel?.value?.trim() || reference.title;
    const freeLabel = reference.addonFreeOption?.value?.trim() || null;
    const variants = reference.variants.nodes;

    // A group with no free choice and no variants has nothing to render.
    if (!freeLabel && variants.length === 0) return [];

    const group: UpsellGroup = {
      id: reference.id,
      label,
      defaultOptionKey: freeLabel ? FREE_OPTION_KEY : variants[0].id,
      defaultOptionLabel: freeLabel,
    };

    const options: UpsellGroupData['options'] = [
      ...(freeLabel
        ? [{option: {key: FREE_OPTION_KEY, label: freeLabel}, variant: null}]
        : []),
      // Paid options come straight from the add-on product's live variants, so
      // adding/renaming/repricing a variant in Shopify admin shows up here.
      ...variants.map((variant) => ({
        option: {key: variant.id, label: variant.title, variantTitle: variant.title},
        variant,
      })),
    ];

    return [{group, options}];
  });
}

/**
 * Add-on products must stay out of customer-facing listings. The Storefront
 * API's `-tag:` search negation is silently ignored whenever a `sortKey` is
 * also passed to `products(...)`, so any listing that sorts must additionally
 * filter them out client-side.
 */
export function filterHiddenProducts<T extends {tags?: string[] | null}>(
  nodes: T[],
): T[] {
  return nodes.filter((node) => !node.tags?.includes(ADDON_TAG));
}
