import type {ComponentType} from 'react';
import {Link} from 'react-router';
import {EditableText} from '~/components/EditableText';
import {RoughCutIcon, DrawnMarkedIcon} from '~/components/ProcessIcons';
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
        <EditableText as="h2" field="process.heading">
          {content.heading}
        </EditableText>
        <EditableText
          as="p"
          className="demo-process-sub"
          field="process.subheading"
        >
          {content.subheading}
        </EditableText>
        <Link to="/collections" className="demo-btn demo-btn-outline-light">
          <EditableText field="process.ctaLabel">{content.ctaLabel}</EditableText>
        </Link>
      </div>

      <div className="demo-process-body">
        <div className="demo-process-photo">
          <img src={content.image.url} alt={content.image.altText ?? ''} />
        </div>

        <div className="demo-process-grid">
          {content.steps.map((step, index) => {
            const Icon = PROCESS_ICONS[step.icon];
            return (
              <div className="demo-process-card" key={step.title}>
                <Icon />
                {/* Title + body are one block so the card can push the icon to
                    the top and this to the bottom, whatever the copy length. */}
                <div className="demo-process-card-copy">
                  <EditableText as="h3" field={`process.steps.${index}.title`}>
                    {step.title}
                  </EditableText>
                  <EditableText
                    as="p"
                    field={`process.steps.${index}.description`}
                  >
                    {step.description}
                  </EditableText>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
