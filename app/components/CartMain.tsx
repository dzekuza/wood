import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  const addChild = (parentId: string, line: CartLine) => {
    if (!children[parentId]) children[parentId] = [];
    children[parentId].push(line);
  };

  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      addChild(line.parentRelationship.parent.id, line);
    }
    if ('lineComponents' in line) {
      const nested = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, kids] of Object.entries(nested)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...kids);
      }
    }
  }

  // Add-on lines (e.g. the "Working type" surcharge) are added to the cart as
  // their own line rather than a real Shopify bundle component, tagged with a
  // "Surcharge for" attribute naming the product they belong to. Pair them
  // with that product's line here so they render nested instead of as their
  // own top-level cart row.
  const nestedIds = new Set(Object.values(children).flat().map((l) => l.id));
  for (const line of lines) {
    if (nestedIds.has(line.id)) continue;
    const surchargeFor = line.attributes?.find(
      (a) => a.key === 'Surcharge for',
    )?.value;
    if (!surchargeFor) continue;
    const candidates = lines.filter(
      (l) =>
        l.id !== line.id &&
        !nestedIds.has(l.id) &&
        !l.attributes?.some((a) => a.key === 'Surcharge for') &&
        l.merchandise.product.title === surchargeFor,
    );
    if (candidates.length === 1) addChild(candidates[0].id, line);
  }

  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);
  const nestedLineIds = new Set(
    Object.values(childrenMap)
      .flat()
      .map((line) => line.id),
  );

  return (
    <section
      className={className}
      aria-label={layout === 'page' ? 'Cart page' : 'Cart drawer'}
    >
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Line items
        </p>
        <div className="cart-lines-wrapper">
          <ul aria-labelledby="cart-lines">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                ('parentRelationship' in line &&
                  line.parentRelationship?.parent) ||
                nestedLineIds.has(line.id)
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </section>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className="cart-empty-state">
      <svg className="cart-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <p>Your basket is empty. Find something built to last.</p>
      <Link to="/collections" onClick={close} prefetch="viewport">
        Browse collection
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </Link>
    </div>
  );
}
