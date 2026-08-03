import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

const stats = [
  { label: "Products", value: "10K+" },
  { label: "Brands", value: "500+" },
  { label: "Happy Customers", value: "50K+" },
  { label: "Cities Delivered", value: "200+" },
];

function Hero() {
  return (
    <section className="hero">
      {/* Glow effects */}
      <div className="hero__glow-1" />
      <div className="hero__glow-2" />

      <div className="relative max-w-[1500px] mx-auto px-8 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="inline-block px-4 py-1 rounded-full text-sm mb-6"
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
            }}
          >
            ⚡ Neo Tech Showroom
          </span>

          <h1 className="text-6xl font-black leading-tight" style={{ color: "#fff" }}>
            Future Electronics
            <br />
            Starts Here.
          </h1>

          <p className="mt-8 text-xl max-w-xl" style={{ color: "var(--color-chrome-text)" }}>
            Explore premium gadgets, gaming devices, laptops, smartphones,
            accessories and AI-powered recommendations—all in one place.
          </p>

          <div className="flex gap-5 mt-10">
            <Link to="/products" className="btn-primary px-8 py-4 text-base">
              Shop Now <FiArrowRight />
            </Link>
            <Link to="/products" className="btn-secondary px-8 py-4 text-base">
              Explore
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-16 max-w-xl">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating product cards */}
        <div className="relative h-[420px] hidden lg:block">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-6 left-10 w-56 rounded-2xl p-5 shadow-xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Gaming Laptop</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--color-heading)" }}>₹79,999</p>
            <span className="text-xs" style={{ color: "var(--color-accent)" }}>⭐ 4.8 (2.3k)</span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-48 right-8 w-56 rounded-2xl p-5 shadow-xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Wireless Earbuds</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--color-heading)" }}>₹2,499</p>
            <span className="text-xs" style={{ color: "var(--color-accent)" }}>⭐ 4.6 (1.1k)</span>
          </motion.div>

          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-4 left-24 w-56 rounded-2xl p-5 shadow-xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Smartwatch</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--color-heading)" }}>₹5,999</p>
            <span className="text-xs" style={{ color: "var(--color-accent)" }}>⭐ 4.9 (900)</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;