import {Link} from 'react-router';

export type SidebarCategory = {
  id: string;
  handle: string;
  title: string;
  count: number;
  image?: {url: string; altText?: string | null} | null;
};

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
      <h4>Categories</h4>
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
                <img
                  src={category.image.url}
                  alt={category.image.altText ?? category.title}
                  loading="lazy"
                />
              </span>
            )}
            <span className="sidebar-category-text">
              <span className="sidebar-category-name">{category.title}</span>
              <span className="sidebar-category-count">
                {category.count} {category.count === 1 ? 'product' : 'products'}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
