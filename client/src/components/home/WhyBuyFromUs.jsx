import { FiTruck, FiRefreshCw, FiCheckCircle, FiShield, FiHelpCircle, FiAward } from "react-icons/fi";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: FiAward,
    title: "Quality Materials",
    description: "Crafted with carefully selected materials for lasting comfort and durability.",
  },
  {
    icon: FiTruck,
    title: "Easy Delivery",
    description: "Reliable delivery across supported locations with careful transit handling.",
  },
  {
    icon: FiRefreshCw,
    title: "Easy Returns",
    description: "Simple return support on eligible products with doorstep inspection.",
  },
  {
    icon: FiShield,
    title: "Secure Payments",
    description: "Safe and secure online payment options with 256-bit SSL encryption.",
  },
  {
    icon: FiCheckCircle,
    title: "Furniture Warranty",
    description: "Comprehensive warranty coverage on frames, mechanisms, and craftsmanship.",
  },
  {
    icon: FiHelpCircle,
    title: "Dedicated Support",
    description: "Friendly support whenever you need assistance from our furniture specialists.",
  },
];

function WhyBuyFromUs() {
  return (
    <section className="px-6 sm:px-8 py-20" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--color-accent)" }}
          >
            The Furniva Promise
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mt-2" style={{ color: "var(--color-heading)" }}>
            Why Furnish With Us?
          </h2>
          <p className="mt-2 text-sm sm:text-base max-w-xl mx-auto" style={{ color: "var(--color-muted)" }}>
            Every piece is created to bring warmth, enduring quality, and effortless comfort to your living space.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                viewport={{ once: true }}
                className="rounded-2xl p-7 border text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div
                  className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--color-heading)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-body)" }}>
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
