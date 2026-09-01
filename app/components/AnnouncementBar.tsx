import {useEffect, useState} from 'react';
import {SocialLinks} from '~/components/SocialLinks';
import {ANNOUNCEMENT_MESSAGES, CONTACT_EMAIL} from '~/lib/site';

const ROTATE_MS = 4000;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ANNOUNCEMENT_MESSAGES.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="announcement-bar">
      {/* The dark band stays full-bleed; only the content is capped, matching
          .header-topbar's 1400px so the two rows line up vertically. */}
      <div className="announcement-bar-inner">
        <div className="announcement-bar-socials">
          <SocialLinks />
        </div>

        {/* aria-live so the rotation is announced rather than silently swapped;
            `key` restarts the fade-in each time the message changes. */}
        <p className="announcement-bar-message" aria-live="polite">
          <span key={index} className="announcement-bar-message-text">
            {ANNOUNCEMENT_MESSAGES[index]}
          </span>
        </p>

        <div className="announcement-bar-contact">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  );
}
