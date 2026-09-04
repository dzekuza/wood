import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';
import type {Category} from '~/components/CategoriesGrid';
import {HOME_CONTENT_DEFAULTS, type HomeSectionHead} from '~/lib/homeContent';

/**
 * Category images crop the whole piece; the textures strip wants the grain
 * instead, so each category points at a close-up shot. A category with no
 * close-up falls back to its normal image rather than dropping out of the grid.
 */
const TEXTURE_IMAGES: Record<string, string> = {
  'solid-oak-mantel-beams': '/demo/texture-mantel-beams.jpg',
  'solid-oak-shelves': '/demo/texture-shelves.jpg',
  'solid-oak-door-stops': '/demo/texture-door-stops.jpg',
  'solid-oak-cube-blocks': '/demo/texture-cube-blocks.jpg',
  'solid-oak-fireplace-surrounds': '/demo/texture-surround-mantels.jpg',
  'solid-oak-coat-racks': '/demo/texture-coat-racks.jpg',
};

/**
 * The tile shows a wood grain close-up, so its title names that grain/finish,
 * not the underlying collection — a category with no name here falls back to
 * its own title rather than dropping out of the grid.
 */
const TEXTURE_NAMES: Record<string, string> = {
  'solid-oak-mantel-beams': 'Rustic Oak',
  'solid-oak-shelves': 'Smoked Oak',
  'solid-oak-door-stops': 'Golden Oak',
  'solid-oak-cube-blocks': 'Natural Oak',
  'solid-oak-fireplace-surrounds': 'Ash Grey',
  'solid-oak-coat-racks': 'Whitewashed Oak',
};

function categoryHandle(category: Category) {
  return category.to.split('/').filter(Boolean).pop() ?? '';
}

function textureImageFor(category: Category) {
  return TEXTURE_IMAGES[categoryHandle(category)] ?? category.image;
}

function textureNameFor(category: Category) {
  return TEXTURE_NAMES[categoryHandle(category)] ?? category.title;
}

export interface TexturesGridProps {
  categories: Category[];
  content?: HomeSectionHead;
}

export function TexturesGrid({
  categories,
  content = HOME_CONTENT_DEFAULTS.textures,
}: TexturesGridProps) {
  if (!categories.length) return null;

  return (
    <section className="demo-textures">
      <div className="demo-textures-inner">
        <div className="demo-textures-head">
          <EditableText as="h2" field="textures.heading">
            {content.heading}
          </EditableText>
          <EditableText
            as="p"
            className="demo-textures-sub"
            field="textures.subheading"
          >
            {content.subheading}
          </EditableText>
          <Link to="/collections/all" className="demo-textures-all">
            <EditableText field="textures.linkLabel">
              {content.linkLabel}
            </EditableText>{' '}
            <i className="ti ti-arrow-up-right" aria-hidden />
          </Link>
        </div>

        <div className="demo-tex-grid">
          {categories.map((category) => {
            const image = textureImageFor(category);
            const name = textureNameFor(category);
            return (
              <Link key={category.title} to={category.to} className="demo-tex-card">
                <span className="demo-tex-swatch">
                  {image && <img src={image} alt={name} loading="lazy" />}
                  <span className="demo-tex-arrow" aria-hidden>
                    <i className="ti ti-arrow-up-right" />
                  </span>
                </span>
                <span className="demo-tex-title">{name}</span>
                {typeof category.count === 'number' && (
                  <span className="demo-tex-count">
                    {category.count} {category.count === 1 ? 'product' : 'products'}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
