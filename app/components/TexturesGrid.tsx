import {Link} from 'react-router';

interface Texture {
  title: string;
  count: number;
  image: string;
  to: string;
}

const TEXTURES: Texture[] = [
  {title: 'Mantel beams', count: 2, image: '/demo/texture-mantel-beams.jpg', to: '/collections/all'},
  {title: 'Shelves', count: 7, image: '/demo/texture-shelves.jpg', to: '/collections/all'},
  {title: 'Door stops', count: 5, image: '/demo/texture-door-stops.jpg', to: '/collections/all'},
  {title: 'Cube blocks', count: 5, image: '/demo/texture-cube-blocks.jpg', to: '/collections/all'},
  {title: 'Surround Mantels', count: 5, image: '/demo/texture-surround-mantels.jpg', to: '/collections/all'},
  {title: 'Coat racks', count: 8, image: '/demo/texture-coat-racks.jpg', to: '/collections/all'},
];

export function TexturesGrid() {
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
        {TEXTURES.map((texture) => (
          <Link key={texture.title} to={texture.to} className="demo-tex-card">
            <span className="demo-tex-swatch">
              <img src={texture.image} alt={texture.title} loading="lazy" />
              <span className="demo-tex-arrow" aria-hidden>
                <i className="ti ti-arrow-up-right" />
              </span>
            </span>
            <span className="demo-tex-title">{texture.title}</span>
            <span className="demo-tex-count">{texture.count} products</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
