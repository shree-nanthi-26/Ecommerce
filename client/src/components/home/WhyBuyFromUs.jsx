import { FiTruck, FiRefreshCw, FiCheckCircle, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: FiTruck,
    title: "Free Fast Delivery",
    description: "Free shipping on orders above ₹999 across India",
  },
  {
    icon: FiRefreshCw,
    title: "Easy 30-Day Returns",
    description: "No hassle return policy with instant doorstep pickup",
  },
  {
    icon: FiCheckCircle,
    title: "100% Genuine Products",
    description: "Sourced directly from certified brand distributors",
  },
  {
    icon: FiShield,
    title: "100% Secure Payment",
    description: "Protected by 256-bit SSL & Razorpay encryption",
  },
];

function WhyBuyFromUs() {
  return (
    <section className="px-4 sm:px-8 py-16" style={{ background: "var(--color-surface)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--color-accent)" }}
          >
            The ElectroMart Guarantee
          </p>
          <h2 className="text-3xl font-extrabold mt-2" style={{ color: "var(--color-heading)" }}>
            Why Buy From Us?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="rounded-2xl p-6 border text-center transition hover:shadow-lg"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  <Icon size={26} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--color-heading)" }}>
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyBuyFromUs;
