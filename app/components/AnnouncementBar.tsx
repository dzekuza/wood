import {CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF} from '~/lib/site';

export function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <p className="announcement-bar-message">
        Handcrafted solid oak furniture, made to order in the Cotswolds
      </p>
      <div className="announcement-bar-contact">
        <a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY}</a>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </div>
  );
}
