import {Link} from 'react-router';

export function ContactBanner() {
  return (
    <section className="demo-contact-wrap">
      <div className="demo-contact">
        <img className="demo-contact-bg" src="/demo/contact-bg.svg" alt="" aria-hidden />

        <div className="demo-contact-left">
          <div className="demo-contact-heading">
            <span className="demo-contact-divider" aria-hidden />
            <h2>Contact us</h2>
            <p>Have a question? Let&rsquo;s reach us</p>
          </div>
          <Link to="https://www.etsy.com" className="demo-contact-etsy">
            Etsy shop
          </Link>
        </div>

        <div className="demo-contact-columns">
          <div className="demo-contact-block">
            <span className="demo-contact-label">General inquiries</span>
            <div className="demo-contact-lines">
              <span>work@craftwoodfurniture.com</span>
              <span>+3700000000</span>
            </div>
          </div>

          <div className="demo-contact-col">
            <div className="demo-contact-block">
              <span className="demo-contact-label">General inquiries</span>
              <div className="demo-contact-lines">
                <span>work@craftwoodfurniture.com</span>
                <span>+3700000000</span>
              </div>
            </div>

            <div className="demo-contact-block">
              <span className="demo-contact-label">Address</span>
              <p className="demo-contact-address">
                Express House, Crow Arch Lane Industrial Estate, Crow Arch Ln,
                Ringwood BH24 1PD, United Kingdom
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
