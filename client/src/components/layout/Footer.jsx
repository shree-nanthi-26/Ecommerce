import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const shopLinks = [
  { label: "Sofas & Seating", href: "/products?category=Sofas%20%26%20Seating" },
  { label: "Beds & Bedroom", href: "/products?category=Beds%20%26%20Bedroom" },
  { label: "Dining Furniture", href: "/products?category=Dining%20Furniture" },
  { label: "Living Room", href: "/products?category=Living%20Room" },
  { label: "Tables & Desks", href: "/products?category=Tables%20%26%20Desks" },
  { label: "Storage & Cabinets", href: "/products?category=Storage%20%26%20Cabinets" },
];
const companyLinks = [
  { label: "About Us", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contact", href: "/support" },
  { label: "Support", href: "/support" },
  { label: "Warranty & Returns", href: "/warranty-returns" },
];
const socialIcons = [FiFacebook, FiInstagram, FiTwitter, FiYoutube];

// Payment method badges shown in the footer bottom bar
const paymentMethods = [
  {
    id: "razorpay",
    label: "Razorpay",
    svg: (
      <svg viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="22" aria-label="Razorpay">
        <text x="0" y="15" fontSize="10" fontWeight="700" fill="#3395FF" fontFamily="Arial, sans-serif">
          Razorpay
        </text>
      </svg>
    ),
  },
  {
    id: "upi",
    label: "UPI",
    svg: (
      <svg viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="22" aria-label="UPI">
        <text x="0" y="15" fontSize="12" fontWeight="800" fill="#8B5CF6" fontFamily="Arial, sans-serif">
          UPI
        </text>
      </svg>
    ),
  },
  {
    id: "visa",
    label: "Visa",
    svg: (
      <svg viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="22" aria-label="Visa">
        <rect width="50" height="30" rx="4" fill="#1A1F71" />
        <text x="6" y="22" fontSize="14" fontWeight="800" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontStyle="italic">
          VISA
        </text>
      </svg>
    ),
  },
  {
    id: "mastercard",
    label: "Mastercard",
    svg: (
      <svg viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="26" aria-label="Mastercard">
        <circle cx="14" cy="13" r="10" fill="#EB001B" />
        <circle cx="26" cy="13" r="10" fill="#F79E1B" />
        <path d="M20 6.6A10 10 0 0 1 26 13a10 10 0 0 1-6 6.4A10 10 0 0 1 14 13a10 10 0 0 1 6-6.4z" fill="#FF5F00" />
      </svg>
    ),
  },
  {
    id: "rupay",
    label: "RuPay",
    svg: (
      <svg viewBox="0 0 56 26" fill="none" xmlns="http://www.w3.org/2000/svg" width="50" height="22" aria-label="RuPay">
        <text x="0" y="18" fontSize="13" fontWeight="800" fill="#0F6D3A" fontFamily="Arial, sans-serif">
          Ru<tspan fill="#F97316">Pay</tspan>
        </text>
      </svg>
    ),
  },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="max-w-[1500px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold tracking-tight" style={{ color: "#fff" }}>
              Furniva
            </h3>
            <p className="mt-2 font-medium text-sm" style={{ color: "var(--color-accent)" }}>
              Designed for Living. Built for Comfort.
            </p>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--color-chrome-text)" }}>
              Thoughtfully designed furniture for beautiful, comfortable homes.
              Crafted with sustainably sourced hardwoods, artisan upholstery,
              and timeless silhouettes.
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
                <li key={link.label}>
                  <Link to={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "#fff" }}>Company</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href}>{link.label}</Link>
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

      {/* Payment Methods Strip */}
      <div style={{ borderTop: "1px solid var(--color-chrome-border)" }} className="py-5">
        <div className="max-w-[1500px] mx-auto px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
              <FiLock size={13} style={{ color: "var(--color-accent)" }} />
              <span>Secure Payments via</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-center rounded-lg px-2.5 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid var(--color-chrome-border)",
                    minWidth: "52px",
                    height: "32px",
                  }}
                  title={method.label}
                  aria-label={method.label}
                >
                  {method.svg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--color-chrome-border)" }} className="py-6">
        <div className="max-w-[1500px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2026 Furniva. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="flex items-center gap-2">
              <FiMail style={{ color: "var(--color-accent)" }} /> hello@furniva.com
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
