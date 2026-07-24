import type {UpsellSurchargesQuery} from 'storefrontapi.generated';

export type UpsellOption = {
  key: string;
  label: string;
  /** Present for paid options — the label doubles as the price lookup key against the group's surcharge variant. */
  variantTitle?: string;
};

export type UpsellSurchargeVariant =
  UpsellSurchargesQuery['products']['nodes'][number]['variants']['nodes'][number];

/** Loader-shaped data: each configured group paired with its resolved variant (if any) per option. */
export type UpsellGroupData = {
  group: UpsellGroup;
  options: Array<{option: UpsellOption; variant: UpsellSurchargeVariant | null}>;
};

export type UpsellGroup = {
  id: string;
  label: string;
  /** Handle of a hidden Shopify product whose variants price each paid option. */
  surchargeProductHandle: string;
  defaultOptionKey: string;
  /** Label for the always-free option (has no backing Shopify variant). */
  defaultOptionLabel: string;
};

/**
 * Merchants can scope which upsell groups appear on a given product via a
 * Shopify product metafield: namespace `custom`, key `addon_groups`, type
 * "List of single line text values" — one Storefront -> Admin -> Custom data
 * -> Products definition, no code changes needed after that.
 *
 * The value is a JSON array of `UpsellGroup.id`s, e.g. ["workingType"].
 * - Metafield not set at all -> every group in UPSELL_GROUPS applies (legacy
 *   default, keeps existing products unaffected).
 * - Metafield set to `[]` -> no upsell groups show on that product.
 * - Metafield set to specific ids -> only those groups show, in the order
 *   they're defined in UPSELL_GROUPS below.
 */
export function resolveUpsellGroupsForProduct(metafieldValue?: string | null): UpsellGroup[] {
  if (metafieldValue == null) return UPSELL_GROUPS;

  let enabledIds: unknown;
  try {
    enabledIds = JSON.parse(metafieldValue);
  } catch {
    return UPSELL_GROUPS;
  }

  if (!Array.isArray(enabledIds)) return UPSELL_GROUPS;

  const enabled = new Set(enabledIds);
  return UPSELL_GROUPS.filter((group) => enabled.has(group.id));
}

/**
 * To add a new upsell group:
 * 1. Create a hidden Shopify product (status can stay unpublished/draft-like via
 *    not adding it to any collection) with one variant per paid option — each
 *    variant's title becomes that option's button label on the PDP, so name
 *    variants exactly as you want them to read to shoppers (e.g. "+2 ft").
 * 2. Add a group entry here (id, label, surchargeProductHandle, and the
 *    always-free default option's key/label).
 * The PDP form, cart line creation, and cart line display all read this array
 * plus the surcharge product's live variants — no other code changes are
 * needed, and adding/renaming/repricing a variant in Shopify admin now shows
 * up on the PDP automatically.
 */
export const UPSELL_GROUPS: UpsellGroup[] = [
  {
    id: 'workingType',
    label: 'Working type',
    surchargeProductHandle: 'working-type-surcharge',
    defaultOptionKey: 'sanded',
    defaultOptionLabel: 'Sanded',
  },
  {
    id: 'heightAllowance',
    label: 'Height allowance',
    surchargeProductHandle: 'height-allowance-surcharge',
    defaultOptionKey: 'standard',
    defaultOptionLabel: 'Standard',
  },
];
