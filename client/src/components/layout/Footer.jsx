import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

const shopLinks = ["Mobiles", "Laptops", "Audio", "Wearables", "Cameras"];
const companyLinks = ["About Us", "Careers", "Blog", "Contact", "Support"];
const socialIcons = [FiFacebook, FiInstagram, FiTwitter, FiYoutube];

function Footer() {
  return (
    <footer className="footer">
      <div className="max-w-[1500px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold" style={{ color: "#fff" }}>
              ElectroMart
            </h3>
            <p className="mt-2 font-medium" style={{ color: "var(--color-accent)" }}>
              Future Electronics
            </p>
            <p className="mt-4 text-sm leading-7">
              Discover premium gadgets, smart devices, and immersive tech
              experiences crafted for modern living.
            </p>

            <div className="mt-6 flex gap-3">
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="footer__social-icon"
                  aria-label={Icon.displayName || "Social link"}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "#fff" }}>Shop</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {shopLinks.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "#fff" }}>Company</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "#fff" }}>Stay Updated</h4>
            <p className="mt-4 text-sm leading-7">
              Get the latest deals, launches, and exclusive offers in your inbox.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="footer__newsletter-input"
                aria-label="Email address for newsletter"
              />
              <button className="btn-primary whitespace-nowrap">Subscribe</button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--color-chrome-border)" }} className="py-6">
        <div className="max-w-[1500px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2026 ElectroMart. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="flex items-center gap-2">
              <FiMail style={{ color: "var(--color-accent)" }} /> hello@electromart.com
            </span>
            <span className="flex items-center gap-2">
              <FiPhone style={{ color: "var(--color-accent)" }} /> +91 98765 43210
            </span>
            <span className="flex items-center gap-2">
              <FiMapPin style={{ color: "var(--color-accent)" }} /> Chennai, India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
