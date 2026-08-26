import type {ComponentType} from 'react';
import {Link} from 'react-router';
import {
  RoughCutIcon,
  DrawnMarkedIcon,
  JointedByHandIcon,
  OiledFinishedIcon,
} from '~/components/ProcessIcons';
import {
  HOME_CONTENT_DEFAULTS,
  type HomeContent,
  type ProcessIconKey,
} from '~/lib/homeContent';

/** The illustrations are hand-drawn SVGs, so the metaobject stores a key and
 *  the component resolves it here. Adding an icon means adding it to this map
 *  *and* to the `icon` field's choices on the `home_process_step` definition. */
const PROCESS_ICONS: Record<ProcessIconKey, ComponentType> = {
  'rough-cut': RoughCutIcon,
  'drawn-marked': DrawnMarkedIcon,
  'jointed-by-hand': JointedByHandIcon,
  'oiled-finished': OiledFinishedIcon,
};

export interface CraftmanshipProcessProps {
  content?: HomeContent['process'];
}

export function CraftmanshipProcess({
  content = HOME_CONTENT_DEFAULTS.process,
}: CraftmanshipProcessProps) {
  return (
    <section className="demo-process">
      <div className="demo-process-head">
        <h2>{content.heading}</h2>
        <p className="demo-process-sub">{content.subheading}</p>
        <Link to="/collections" className="demo-btn demo-btn-outline-light">
          {content.ctaLabel}
        </Link>
      </div>

      <div className="demo-process-body">
        <div className="demo-process-photo">
          <img src={content.image.url} alt={content.image.altText ?? ''} />
        </div>

        <div className="demo-process-grid">
          {content.steps.map((step) => {
            const Icon = PROCESS_ICONS[step.icon];
            return (
              <div className="demo-process-card" key={step.title}>
                <Icon />
                {/* Title + body are one block so the card can push the icon to
                    the top and this to the bottom, whatever the copy length. */}
                <div className="demo-process-card-copy">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
