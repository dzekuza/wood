import {Link} from 'react-router';

export interface Category {
  title: string;
  image: string | null;
  to: string;
}

export function CategoriesGrid({categories}: {categories: Category[]}) {
  if (!categories.length) return null;

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
        {categories.map((category) => (
          <Link key={category.title} to={category.to} className="demo-cat-card">
            <span className="demo-cat-image">
              {category.image && (
                <img src={category.image} alt={category.title} loading="lazy" />
              )}
              <span className="demo-cat-arrow" aria-hidden>
                <i className="ti ti-arrow-up-right" />
              </span>
            </span>
            <span className="demo-cat-title">{category.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
