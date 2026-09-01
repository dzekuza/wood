import {FacebookFilledIcon, PinterestFilledIcon} from '~/components/Icons';
import {SOCIAL_LINKS, type SocialPlatform} from '~/lib/site';

const ICONS: Record<
  SocialPlatform,
  (props: {className?: string}) => React.JSX.Element
> = {
  facebook: FacebookFilledIcon,
  pinterest: PinterestFilledIcon,
};

export interface SocialLinksProps {
  /** Class on each anchor — the announcement bar and the footer style them differently. */
  linkClassName?: string;
  iconClassName?: string;
}

/**
 * The shop's social accounts, rendered from the single `SOCIAL_LINKS` list so
 * the header and footer always advertise the same set.
 */
export function SocialLinks({linkClassName, iconClassName}: SocialLinksProps) {
  return (
    <>
      {SOCIAL_LINKS.map(({platform, label, url}) => {
        const Icon = ICONS[platform];
        return (
          <a
            key={platform}
            href={url}
            aria-label={label}
            className={linkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </>
  );
}
