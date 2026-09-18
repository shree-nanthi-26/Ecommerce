import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiMail, FiPhone, FiHelpCircle, FiShield, FiTruck, FiRefreshCw } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const FAQS = [
  {
    q: "How does furniture delivery work and what are the timelines?",
    a: "We provide specialized white-glove furniture delivery. Metro orders are delivered within 4–7 business days, while non-metro locations take 7–10 days. Our delivery partners call in advance to coordinate a convenient delivery time slot.",
  },
  {
    q: "Is furniture assembly included or do I have to assemble it myself?",
    a: "All large furniture items (beds, dining tables, wardrobes, study desks) include 100% FREE professional carpenter assembly at the time of delivery or within 24 hours of drop-off.",
  },
  {
    q: "How do I care for solid wood furniture and fabric upholstery?",
    a: "Wipe wooden surfaces along the grain with a dry or slightly damp soft microfiber cloth. Avoid abrasive cleaners, direct sunlight exposure, and standing water. Use coasters for hot mugs and glasses. For fabric upholstery, regular vacuuming and prompt spot-cleaning with mild upholstery foam is recommended.",
  },
  {
    q: "What is your return and exchange policy for furniture?",
    a: "We offer a 15-day easy return policy on all furniture. If the piece doesn't fit your space or match your decor, you can initiate a return through 'My Orders' for a full refund or swap. The piece must be in undamaged original condition.",
  },
  {
    q: "What does the 3-Year Furniva Warranty cover?",
    a: "Our 3-year craftsmanship warranty covers structural timber integrity, joint stability, hardware malfunctions (hinges, runners, hydraulic gas lifts), and termite or borer infestation. It does not cover accidental damage, physical cuts, or fabric wear and tear.",
  },
  {
    q: "How can I track my furniture shipment?",
    a: "Once your order is dispatched from our master workshop, you will receive real-time tracking links via SMS and email. You can also track milestones directly on our 'Track Order' page.",
  },
  {
    q: "What should I do if my furniture arrives damaged or scratched?",
    a: "Please inspect your furniture thoroughly in the presence of our delivery team. If any defect or transit scratch is found, note it on the delivery receipt and reject the piece, or contact us immediately. We will initiate a priority replacement at no cost.",
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
        <title>Customer Support & Furniture FAQs – Furniva</title>
        <meta
          name="description"
          content="Customer care, white-glove delivery info, wood maintenance guidelines, assembly support, and warranty claims for Furniva."
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
              We're Here To Help
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-serif font-bold tracking-tight">Customer Support</h1>
            <p className="mt-3 text-lg" style={{ color: "var(--color-muted)" }}>
              Find answers to questions on furniture delivery, wood care, assembly, and warranties
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div
              className="rounded-3xl p-6 text-center shadow-sm"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiTruck size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg">White-Glove Delivery</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Safe handling, specialized furniture transport, and room-of-choice placement.
              </p>
            </div>

            <div
              className="rounded-3xl p-6 text-center shadow-sm"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiShield size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg">3-Year Warranty</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Guaranteed coverage against structural, termite, and hardware defects.
              </p>
            </div>

            <div
              className="rounded-3xl p-6 text-center shadow-sm"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                <FiRefreshCw size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg">15-Day Easy Returns</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Hassle-free doorstep pickup if your new furniture doesn't suit your space.
              </p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
              <FiHelpCircle style={{ color: "var(--color-accent)" }} /> Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden shadow-sm"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold text-base transition hover:bg-[var(--color-surface-alt)]"
                    >
                      <span className="font-serif font-bold text-lg">{faq.q}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 ml-4"
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
            className="rounded-3xl p-8 md:p-12 text-center border shadow-sm"
            style={{
              background: "var(--color-surface-alt)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3 className="text-2xl font-serif font-bold">Have Specific Questions About A Furniture Piece?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              Our interior decor and furniture specialists are available to assist with measurements, fabric samples, and custom inquiries.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href="mailto:hello@furniva.com"
                className="flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold text-sm transition"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                <FiMail size={18} /> Email: hello@furniva.com
              </a>
              <a
                href="tel:18001234567"
                className="flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold text-sm transition border"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-heading)",
                }}
              >
                <FiPhone size={18} /> Toll Free: 1800-123-4567
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
