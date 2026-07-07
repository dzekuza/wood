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
