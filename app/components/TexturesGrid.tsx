import {Link} from 'react-router';
import type {Category} from '~/components/CategoriesGrid';

const TEXTURE_IMAGES: Record<string, string> = {
  'solid-oak-mantel-beams': '/demo/texture-mantel-beams.jpg',
  'solid-oak-shelves': '/demo/texture-shelves.jpg',
  'solid-oak-door-stops': '/demo/texture-door-stops.jpg',
  'solid-oak-cube-blocks': '/demo/texture-cube-blocks.jpg',
  'solid-oak-fireplace-surrounds': '/demo/texture-surround-mantels.jpg',
  'solid-oak-coat-racks': '/demo/texture-coat-racks.jpg',
};

function textureImageFor(category: Category) {
  const handle = category.to.split('/').filter(Boolean).pop() ?? '';
  return TEXTURE_IMAGES[handle] ?? category.image;
}

export function TexturesGrid({categories}: {categories: Category[]}) {
  if (!categories.length) return null;

  return (
    <section className="demo-textures">
      <div className="demo-textures-head">
        <h2>Our Textures</h2>
        <p className="demo-textures-sub">
          Handcrafted coat racks, fireplace mantels, shelves and solid oak
          accents—made to bring warmth, function.
        </p>
        <Link to="/collections/all" className="demo-textures-all">
          All Products <i className="ti ti-arrow-up-right" aria-hidden />
        </Link>
      </div>

      <div className="demo-tex-grid">
        {categories.map((category) => {
          const image = textureImageFor(category);
          return (
            <Link key={category.title} to={category.to} className="demo-tex-card">
              <span className="demo-tex-swatch">
                {image && <img src={image} alt={category.title} loading="lazy" />}
                <span className="demo-tex-arrow" aria-hidden>
                  <i className="ti ti-arrow-up-right" />
                </span>
              </span>
              <span className="demo-tex-title">{category.title}</span>
              {typeof category.count === 'number' && (
                <span className="demo-tex-count">
                  {category.count} {category.count === 1 ? 'product' : 'products'}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
