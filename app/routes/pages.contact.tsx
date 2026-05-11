import type {Route} from './+types/pages.contact';

export const meta: Route.MetaFunction = () => [
  {title: 'Contact Us — CraftWoodFurniture'},
  {name: 'description', content: 'Get in touch with the CraftWoodFurniture team.'},
];

export default function ContactPage() {
  return (
    <>
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-header-inner">
            <div>
              <span className="eyebrow">Get in touch</span>
              <h1>Contact <em>Us</em></h1>
              <p className="blurb">
                Questions about a piece, custom orders, or just want to talk wood? We'd love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="section-linen">
        <div className="cwf-wrap">
          <div className="contact-layout">
            <form className="contact-form" action="mailto:hello@craftwoodfurniture.com" method="post" encType="text/plain">
              <div className="contact-field">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" placeholder="Your name" required />
              </div>
              <div className="contact-field">
                <label htmlFor="email">Email Address</label>
                <input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="contact-field">
                <label htmlFor="subject">Subject</label>
                <input id="subject" name="subject" type="text" placeholder="Custom order, question, feedback…" />
              </div>
              <div className="contact-field">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={6} placeholder="Tell us what's on your mind…" required />
              </div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>

            <aside className="contact-info">
              <div className="contact-info-block">
                <i className="ti ti-mail" />
                <div>
                  <p className="contact-info-label">Email</p>
                  <a href="mailto:hello@craftwoodfurniture.com">hello@craftwoodfurniture.com</a>
                </div>
              </div>
              <div className="contact-info-block">
                <i className="ti ti-phone" />
                <div>
                  <p className="contact-info-label">Phone</p>
                  <a href="tel:+15555550100">+1 (555) 555-0100</a>
                </div>
              </div>
              <div className="contact-info-block">
                <i className="ti ti-clock" />
                <div>
                  <p className="contact-info-label">Workshop Hours</p>
                  <p>Mon – Fri: 9am – 6pm EST</p>
                  <p>Sat: 10am – 4pm EST</p>
                </div>
              </div>
              <div className="contact-info-block">
                <i className="ti ti-map-pin" />
                <div>
                  <p className="contact-info-label">Studio</p>
                  <p>By appointment only</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
