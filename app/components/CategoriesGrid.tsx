import {Link} from 'react-router';

interface Category {
  title: string;
  count: number;
  image: string;
  to: string;
}

const CATEGORIES: Category[] = [
  {title: 'Mantel beams', count: 2, image: '/demo/category-mantel-beams.png', to: '/collections/all'},
  {title: 'Coat racks', count: 8, image: '/demo/category-coat-racks.png', to: '/collections/all'},
  {title: 'Door stops', count: 5, image: '/demo/category-door-stops.png', to: '/collections/all'},
  {title: 'Surround Mantels', count: 5, image: '/demo/category-surround-mantels.png', to: '/collections/all'},
  {title: 'Cube blocks', count: 5, image: '/demo/category-cube-blocks.png', to: '/collections/all'},
  {title: 'Shelves', count: 7, image: '/demo/category-shelves.png', to: '/collections/all'},
];

export function CategoriesGrid() {
  return (
    <section className="demo-categories">
      <div className="demo-categories-head">
        <h2>Our Categories</h2>
        <p className="demo-categories-sub">
          Delivery in days—not months. Welcome to the new standard.
        </p>
        <Link to="/collections" className="demo-categories-all">
          All Collections <i className="ti ti-arrow-up-right" aria-hidden />
        </Link>
      </div>

      <div className="demo-cat-grid">
        {CATEGORIES.map((category) => (
          <Link key={category.title} to={category.to} className="demo-cat-card">
            <span className="demo-cat-image">
              <img src={category.image} alt={category.title} loading="lazy" />
              <span className="demo-cat-arrow" aria-hidden>
                <i className="ti ti-arrow-up-right" />
              </span>
            </span>
            <span className="demo-cat-title">{category.title}</span>
            <span className="demo-cat-count">{category.count} products</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
