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
 * The tile shows a wood grain close-up, so its title names the oil finish that
 * grain represents — the same six names shoppers pick from in the PDP's "Oil
 * Colour" option — not the underlying collection. A category with no name here
 * falls back to its own title rather than dropping out of the grid.
 */
const TEXTURE_NAMES: Record<string, string> = {
  'solid-oak-mantel-beams': 'Dark Oil',
  'solid-oak-shelves': 'Grey Oil',
  'solid-oak-door-stops': 'Old Oak Oil',
  'solid-oak-cube-blocks': 'Clear Oil',
  'solid-oak-fireplace-surrounds': 'Light Grey Oil',
  'solid-oak-coat-racks': 'White Oil',
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
  const textureCategories = categories.filter(
    (category) => categoryHandle(category) in TEXTURE_IMAGES,
  );

  if (!textureCategories.length) return null;

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
          {textureCategories.map((category) => {
            const image = textureImageFor(category);
            const name = textureNameFor(category);
            return (
              <div key={category.title} className="demo-tex-card">
                <span className="demo-tex-swatch">
                  {image && <img src={image} alt={name} loading="lazy" />}
                </span>
                <span className="demo-tex-title">{name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
