import type {UpsellSurchargesQuery} from 'storefrontapi.generated';

export type UpsellOption = {
  key: string;
  label: string;
  /** Must match a variant title on the group's surcharge product. Omit for the free/default option. */
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
  options: UpsellOption[];
};

/**
 * To add a new upsell group:
 * 1. Create a hidden Shopify product (status can stay unpublished/draft-like via
 *    not adding it to any collection) with one variant per paid option, titled
 *    to match `variantTitle` below exactly.
 * 2. Add a group entry here.
 * The PDP form, cart line creation, and cart line display all read this array —
 * no other code changes are needed.
 */
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

export const UPSELL_GROUPS: UpsellGroup[] = [
  {
    id: 'workingType',
    label: 'Working type',
    surchargeProductHandle: 'working-type-surcharge',
    defaultOptionKey: 'sanded',
    options: [
      {key: 'sanded', label: 'Sanded'},
      {
        key: 'lightly',
        label: 'Lightly Worked',
        variantTitle: 'Lightly Worked',
      },
      {
        key: 'heavily',
        label: 'Heavily Worked',
        variantTitle: 'Heavily Worked',
      },
    ],
  },
  {
    id: 'heightAllowance',
    label: 'Height allowance',
    surchargeProductHandle: 'height-allowance-surcharge',
    defaultOptionKey: 'standard',
    options: [
      {key: 'standard', label: 'Standard'},
      {key: 'plus1ft', label: '+1 ft', variantTitle: '+1 ft'},
      {key: 'plus2ft', label: '+2 ft', variantTitle: '+2 ft'},
      {key: 'plus3ft', label: '+3 ft', variantTitle: '+3 ft'},
    ],
  },
];
