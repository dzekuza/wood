import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {
  compareCategories,
  shouldHideCollection,
  type SortableCategory,
} from '~/lib/site';

export type SidebarCategory = {
  id: string;
  handle: string;
  title: string;
  count: number;
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
};

type SidebarCategoryNode = SortableCategory & {
  id: string;
  title: string;
  image?: SidebarCategory['image'];
  products: {nodes: unknown[]};
};

/** Shared by `collections.all` and `collections.$handle` so both sidebars list
 *  the same categories in the same, merchant-controlled order. */
export function buildSidebarCategories(
  nodes: SidebarCategoryNode[],
): SidebarCategory[] {
  return nodes
    .filter((node) => !shouldHideCollection(node))
    .sort(compareCategories)
    .slice(0, 8)
    .map((node) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      image: node.image,
      count: node.products.nodes.length,
    }));
}

/**
 * "Categories" block for the shop sidebar — collections with their thumbnail,
 * shown as a vertical list alongside Availability/Price instead of the old
 * horizontal row above the page. `activeHandle` marks the collection the
 * shopper is currently viewing (unused on the all-products page). Passed
 * into `CollectionFilters` as `categoriesSlot` so it renders between Price
 * and Availability (the sidebar's fixed order) inside that component's own
 * `.filters-content` wrapper — this returns only the `.fblock`, no wrapper
 * of its own, to avoid nesting `.filters-content` divs.
 */
export function CollectionCategoryNav({
  categories,
  activeHandle,
}: {
  categories: SidebarCategory[];
  activeHandle?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="fblock category-nav">
      <h2>Categories</h2>
      <div className="sidebar-category-list">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/collections/${category.handle}`}
            prefetch="intent"
            className={`sidebar-category-item${category.handle === activeHandle ? ' is-active' : ''}`}
          >
            {category.image && (
              <span className="sidebar-category-img">
                <Image
                  data={category.image}
                  alt={category.image.altText ?? category.title}
                  aspectRatio="1/1"
                  sizes="40px"
                  loading="lazy"
                />
              </span>
            )}
            <span className="sidebar-category-text">
              <span className="sidebar-category-name">{category.title}</span>
              {/* Counts distinct products; each one also comes in several
                  sizes and oil finishes, which a bare "1 product" undersells. */}
              <span className="sidebar-category-count">
                {category.count} {category.count === 1 ? 'product' : 'products'}{' '}
                + size &amp; finish variations
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
