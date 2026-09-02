---
tags: [frontend, shopify, merchant-editable, stable]
updated: 2026-09-02
---

# Product add-ons (Working type, Height allowance, …)

Optional paid extras shown as extra option rows on the PDP, priced by a hidden
"add-on product" in Shopify. **Entirely merchant-managed — adding, renaming,
repricing, retiring, or re-targeting an add-on needs no code change and no
deploy.**

Code: [[utils|`app/lib/upsells.ts`]], consumed by `products.$handle.tsx` and
rendered by `ProductForm`.

## The model

There are two roles a product can play.

### 1. An **add-on product** — defines one option row

Any product tagged **`addon`**. It never appears in listings (see *Hiding*).

| Field | Meaning |
|---|---|
| Tag `addon` | Marks it as an add-on; keeps it out of all storefront listings |
| `custom.addon_label` | The PDP row heading, e.g. "Working type". Falls back to the product title |
| `custom.addon_free_option` | The no-cost choice, e.g. "Sanded". **Blank = every choice is paid** |
| Each **variant** | One paid choice — variant title is the button label, variant price is the surcharge |

### 2. A **catalog product** — opts in to add-on rows

| Field | Meaning |
|---|---|
| `custom.addon_products` | List of product references pointing at the add-on products this product offers |

**Unset or empty means no add-ons.** Order of the references is the order the
rows render in.

## Merchant workflows

**Attach / detach an add-on**
Product → Metafields → **Add-ons** → product picker → tick or untick. Done.

**Reprice or rename a choice**
Edit the variant on the add-on product. Title = label, price = surcharge.

**Add a whole new add-on type** (e.g. "Edge profile")
1. Duplicate an existing add-on product.
2. Tag it `addon`.
3. Set `custom.addon_label` ("Edge profile") and `custom.addon_free_option`
   ("Square", or leave blank if there is no free choice).
4. Give it one variant per paid choice, priced.
5. Attach it to products via **Add-ons**.

**Retire an add-on**
Untick it on the products that use it, or archive the product.

## Hiding add-on products from the storefront

Add-on products must be published to **Wood Headless** (the PDP reads their
prices through the Storefront API), so they cannot be hidden by unpublishing.
They are excluded two ways, both keyed on the `addon` tag:

- `EXCLUDE_HIDDEN_PRODUCTS_QUERY` (`-tag:addon`) in the search query, and
- `filterHiddenProducts()` client-side — **required**, because the Storefront
  API silently ignores `-tag:` negation whenever a `sortKey` is also passed.

> [!warning] Listing queries must select `tags`
> `filterHiddenProducts()` filters on `node.tags`. Any new product-listing
> query must select `tags` or add-on products will leak into it.

## Cart

Untouched by this design and fully attribute-driven. A chosen paid option adds
a **second cart line** for the add-on variant, tagged with `Surcharge for` =
the parent product title; `CartMain` pairs it back to the parent line so it
renders nested rather than as its own row. Labels come from `group.label` /
`option.label`, so renaming an add-on in Shopify flows through automatically.

## Gotchas

- Metafield definitions **must have `access.storefront = PUBLIC_READ`** or the
  Storefront API returns `null` and every add-on silently disappears. This
  defaults to `NONE` on definitions created through the Admin API.
- `custom.addon_groups` (the old text-list metafield) is **superseded** and
  unused — safe to delete in Admin. See [[decisions-log]] ADR-0011.
