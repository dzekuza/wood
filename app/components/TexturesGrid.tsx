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

function textureImageFor(category: Category) {
  const handle = category.to.split('/').filter(Boolean).pop() ?? '';
  return TEXTURE_IMAGES[handle] ?? category.image;
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

        {/* Purely decorative wood grain/finish close-ups — not a second
            category nav, so no title/count/link on the tiles themselves. */}
        <div className="demo-tex-grid">
          {categories.map((category) => {
            const image = textureImageFor(category);
            if (!image) return null;
            return (
              <span key={category.title} className="demo-tex-card">
                <span className="demo-tex-swatch">
                  <img src={image} alt="" loading="lazy" />
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
