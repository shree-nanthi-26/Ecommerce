import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiMail, FiPhone, FiHelpCircle, FiShield, FiTruck, FiRefreshCw } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3-5 business days. Express shipping options are available at checkout for 1-2 day delivery.",
  },
  {
    q: "What is the return policy?",
    a: "We offer a 30-day hassle-free return policy on all electronics. Products must be in original condition with packaging.",
  },
  {
    q: "Do products come with a warranty?",
    a: "Yes! All brand new electronics include 1-year official manufacturer warranty. Extended protection plans are also available.",
  },
  {
    q: "How can I track my order status?",
    a: "Once shipped, you will receive an email and SMS with your live tracking number and link.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major Credit/Debit cards, Net Banking, UPI, and Cash on Delivery (COD) for eligible pincodes.",
  },
];

function Support() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>Help & Support – ElectroMart</title>
        <meta
          name="description"
          content="Customer support, FAQs, shipping info, returns, warranty claims, and contact options for ElectroMart."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              We're Here To Help
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold">Customer Support</h1>
            <p className="mt-3 text-lg" style={{ color: "var(--color-muted)" }}>
              Find answers to common questions or reach out to our dedicated support team
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiTruck size={24} />
              </div>
              <h3 className="font-bold text-lg">Fast Delivery</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Free shipping on orders above ₹999 with live tracking updates.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 text-center"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiShield size={24} />
              </div>
              <h3 className="font-bold text-lg">1 Year Warranty</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Genuine products backed by official brand warranty guarantees.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 text-center"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiRefreshCw size={24} />
              </div>
              <h3 className="font-bold text-lg">30-Day Returns</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Easy return process if you are not completely satisfied.
              </p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiHelpCircle style={{ color: "var(--color-accent)" }} /> Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold text-base transition hover:bg-[var(--color-surface-alt)]"
                    >
                      <span>{faq.q}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiChevronDown size={20} style={{ color: "var(--color-muted)" }} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="p-5 pt-0 text-sm leading-relaxed"
                            style={{ color: "var(--color-muted)", borderTop: "1px dashed var(--color-border)" }}
                          >
                            <p className="mt-4">{faq.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Box */}
          <div
            className="rounded-2xl p-8 md:p-12 text-center"
            style={{
              background: "var(--color-surface-alt)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3 className="text-2xl font-bold">Still need help?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              Our support team is available 24/7 to assist with your orders or inquiries.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="mailto:support@electromart.com"
                className="flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold text-sm transition"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                <FiMail size={18} /> Email Support
              </a>
              <a
                href="tel:18001234567"
                className="flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold text-sm transition"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-heading)",
                }}
              >
                <FiPhone size={18} /> 1800-123-4567
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Support;
