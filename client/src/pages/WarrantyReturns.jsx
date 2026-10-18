import SEO from "../components/common/SEO";
import { FiShield, FiRefreshCw, FiCheckCircle, FiMail, FiPhone } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function WarrantyReturns() {
  return (
    <>
      <SEO
        title="Warranty & Returns Policy | Furniva Craftsmanship Guarantee"
        description="Learn about Furniva's craftsmanship warranty, hassle-free return window, and solid wood authenticity guarantee."
        canonicalUrl="/warranty-returns"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Warranty & Returns", item: "/warranty-returns" },
        ]}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Craftsmanship Assurance
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-serif font-bold tracking-tight">Warranty & Returns</h1>
            <p className="mt-3 text-lg" style={{ color: "var(--color-muted)" }}>
              Every piece of Furniva furniture is backed by our unwavering commitment to enduring quality.
            </p>
          </div>

          {/* Three Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div
              className="rounded-3xl p-8 border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiShield size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold">3-Year Warranty</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                All solid wood and upholstered furniture includes a comprehensive 3-year warranty covering frame integrity, joinery, and termite protection.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiRefreshCw size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold">15-Day Easy Returns</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                Not the right fit for your living space? Return or exchange any furniture piece within 15 days of delivery with free doorstep disassembly and pickup.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiCheckCircle size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold">Kiln-Dried Hardwood</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                Crafted from responsibly sourced, seasoned solid wood (Sheesham, Teak, and Oak) engineered to resist warping, cracking, and climate changes.
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div
            className="rounded-3xl p-8 sm:p-12 border mb-16 space-y-8 shadow-sm"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              <h3 className="text-2xl font-serif font-bold mb-3">How to Initiate a Return or Warranty Claim</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-body)" }}>
                <li>Log in to your Furniva account and navigate to <strong>My Orders</strong>.</li>
                <li>Select the furniture piece you wish to return or request service for.</li>
                <li>Click <strong>Request Return / Service</strong> and upload photos of the item or issue.</li>
                <li>Our furniture care team will arrange a doorstep inspection and complimentary pickup within 48–72 hours.</li>
                <li>Refunds are credited to your original payment method within 3–5 business days following pickup.</li>
              </ol>
            </div>

            <div className="border-t pt-8" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-2xl font-serif font-bold mb-3">Warranty Exclusions</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                <li>Normal wear and tear of fabric upholstery, leather aging, or cushion softening over time.</li>
                <li>Damage resulting from improper cleaning chemicals, excessive moisture, or outdoor exposure of indoor furniture.</li>
                <li>Alterations or structural modifications made without Furniva authorization.</li>
              </ul>
            </div>
          </div>

          {/* Help Box */}
          <div
            className="rounded-3xl p-8 text-center border shadow-sm"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="text-2xl font-serif font-bold">Need Assistance With a Warranty Claim?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              Our customer happiness team is available Monday through Saturday from 9 AM to 8 PM IST.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:hello@furniva.com"
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm text-white"
                style={{ background: "var(--color-accent)" }}
              >
                <FiMail size={16} /> Email Warranty Support: hello@furniva.com
              </a>
              <a
                href="tel:18001234567"
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm border"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <FiPhone size={16} /> Toll Free: 1800-123-4567
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default WarrantyReturns;
