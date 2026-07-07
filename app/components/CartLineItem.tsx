import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, Money, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const allChildren = childrenMap[id] ?? [];
  // Surcharge add-ons (any configured upsell group, e.g. "Working type")
  // render inline next to this line's options instead of as a nested cart
  // line of their own.
  const surchargeChildren = allChildren.filter((child) =>
    child.attributes?.some((a) => a.key === 'Surcharge for'),
  );
  const lineItemChildren = allChildren.filter(
    (child) => !surchargeChildren.includes(child),
  );
  const childrenLabelId = `cart-line-children-${id}`;

  const meaningfulOptions = selectedOptions.filter(
    (o) => o.value !== 'Default Title',
  );

  return (
    <li key={id} className="cart-line">
      <div className="cart-line-inner">
        <div className="cart-line-img">
          {image && (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={80}
              loading="lazy"
              width={80}
            />
          )}
        </div>

        <div className="cart-line-body">
          <div className="cart-line-top">
            <Link
              className="cart-line-name"
              prefetch="intent"
              to={lineItemUrl}
              onClick={() => layout === 'aside' && close()}
            >
              {product.title}
            </Link>
            <div className="cart-line-price">
              <ProductPrice price={line?.cost?.totalAmount} />
            </div>
          </div>

          {(meaningfulOptions.length > 0 || surchargeChildren.length > 0) && (
            <div className="cart-line-opts">
              {meaningfulOptions.map((o) => o.value).join(' · ')}
              {surchargeChildren.map((child) => {
                const upsellOption = child.attributes?.find(
                  (a) => a.key === 'Upsell option',
                )?.value;
                return (
                  <span key={child.id} className="cart-line-surcharge">
                    {meaningfulOptions.length > 0 ? ' · ' : ''}
                    {upsellOption}
                    {' ('}
                    <Money as="span" data={child.cost?.totalAmount} />
                    {')'}
                  </span>
                );
              })}
            </div>
          )}

          <div className="cart-line-bottom">
            <CartLineQuantity line={line} />
          </div>
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="cart-line-actions">
      <div className="cart-line-quantity">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            −
          </button>
        </CartLineUpdateButton>
        <span className="cart-qty-value">{quantity}</span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
          >
            +
          </button>
        </CartLineUpdateButton>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button disabled={disabled} type="submit" className="cart-line-remove">
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @param lineIds - line ids affected by the update
 * @returns
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
