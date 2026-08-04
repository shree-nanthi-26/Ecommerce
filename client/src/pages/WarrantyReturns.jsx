import { Helmet } from "react-helmet-async";
import { FiShield, FiRefreshCw, FiCheckCircle, FiHelpCircle, FiMail, FiPhone } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function WarrantyReturns() {
  return (
    <>
      <Helmet>
        <title>Warranty & Returns Policy – ElectroMart</title>
        <meta
          name="description"
          content="Learn about ElectroMart's 1-year brand warranty, 30-day hassle-free return window, and 100% genuine product authenticity guarantee."
        />
      </Helmet>

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
              Customer Guarantee
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Warranty & Returns</h1>
            <p className="mt-3 text-lg" style={{ color: "var(--color-muted)" }}>
              Complete peace of mind with our 100% genuine quality promises
            </p>
          </div>

          {/* Three Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div
              className="rounded-3xl p-8 border shadow-lg"
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
              <h2 className="text-2xl font-bold">1-Year Warranty</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                All electronics sold on ElectroMart come with official 1-year manufacturer warranty. Covers hardware defects, battery issues, and internal component failures.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 border shadow-lg"
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
              <h2 className="text-2xl font-bold">30-Day Returns</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                Not completely satisfied? Return your product within 30 days of delivery in original packaging for a full refund or instant replacement with zero questions asked.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 border shadow-lg"
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
              <h2 className="text-2xl font-bold">100% Genuine</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                We source directly from authorized brand distributors. Every device comes with serial verification and brand authenticity seals.
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div
            className="rounded-3xl p-8 sm:p-12 border mb-16 space-y-8"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              <h3 className="text-2xl font-bold mb-3">How to Initiate a Return or Warranty Claim</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-body)" }}>
                <li>Log in to your ElectroMart account and navigate to <strong>My Orders</strong>.</li>
                <li>Select the item you wish to return or claim warranty for.</li>
                <li>Click <strong>Request Return / Support</strong> and specify the reason.</li>
                <li>Our courier partner will pick up the package from your doorstep within 24–48 hours.</li>
                <li>Once inspected, refund or replacement will be processed within 3 business days.</li>
              </ol>
            </div>

            <div className="border-t pt-8" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="text-2xl font-bold mb-3">Warranty Exclusions</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                <li>Accidental liquid damage or physical drops.</li>
                <li>Unauthorized third-party repairs or software modifications.</li>
                <li>Normal wear and tear of cosmetic surfaces and cables.</li>
              </ul>
            </div>
          </div>

          {/* Help Box */}
          <div
            className="rounded-3xl p-8 text-center border"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="text-2xl font-bold">Have Questions About Warranty?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              Our dedicated support team is available to assist you with claims and returns.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:warranty@electromart.com"
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm text-white"
                style={{ background: "var(--color-accent)" }}
              >
                <FiMail size={16} /> Email Warranty Support
              </a>
              <a
                href="tel:18001234567"
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm border"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <FiPhone size={16} /> Call Toll Free: 1800-123-4567
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
