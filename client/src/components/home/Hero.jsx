import { motion } from "framer-motion";
import { FiArrowRight, FiShield, FiTruck } from "react-icons/fi";
import { Link } from "react-router-dom";

const stats = [
  { label: "Furniture Designs", value: "500+" },
  { label: "Collections", value: "25+" },
  { label: "Happy Homes", value: "10K+" },
  { label: "Delivery", value: "Pan India" },
];

function Hero() {
  return (
    <section className="hero">
      {/* Ambient warm glow effects */}
      <div className="hero__glow-1" />
      <div className="hero__glow-2" />

      <div className="relative max-w-[1500px] mx-auto px-6 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 z-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{
              background: "rgba(139, 94, 60, 0.18)",
              border: "1px solid rgba(217, 168, 126, 0.35)",
              color: "#D9A87E",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#D9A87E] animate-pulse" />
            Handcrafted Luxury Living
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]"
            style={{ color: "#FFFFFF" }}
          >
            Furniture That Makes Your Space Feel Like Home.
          </h1>

          <p
            className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed"
            style={{ color: "var(--color-chrome-text)" }}
          >
            Discover thoughtfully designed furniture for living rooms, bedrooms,
            dining spaces and every corner of your home.
          </p>

          <div className="flex flex-wrap gap-4 mt-8 sm:mt-10">
            <Link
              to="/products"
              className="btn-primary px-8 py-4 text-base font-bold shadow-xl"
            >
              Shop Furniture <FiArrowRight size={18} />
            </Link>
            <Link
              to="/categories"
              className="btn-secondary px-8 py-4 text-base font-bold"
              style={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "#FFFFFF",
              }}
            >
              Explore Collections
            </Link>
          </div>

          {/* Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14 pt-8 border-t border-white/10 max-w-xl">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: "#D9A87E" }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1 font-medium text-white/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Showcase: Large Furniture Image + Floating Accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="lg:col-span-6 relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3] sm:aspect-[16/11]">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85"
              alt="Modern living room interior with designer sofa, lounge chair, and wood coffee table"
              className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white pointer-events-none">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#D9A87E] font-bold">Featured Suite</p>
                <p className="text-lg font-bold">The Nordic Living Collection</p>
              </div>
              <span className="text-sm font-semibold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                Starting ₹8,999
              </span>
            </div>
          </div>

          {/* Floating Feature Card 1 */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl p-4 shadow-xl backdrop-blur-md"
            style={{
              background: "rgba(34, 30, 27, 0.90)",
              border: "1px solid rgba(217, 168, 126, 0.25)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] text-white flex items-center justify-center">
              <FiShield size={20} />
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium">Certified Build</p>
              <p className="text-sm font-bold text-white">100% Solid Wood</p>
            </div>
          </motion.div>

          {/* Floating Feature Card 2 */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-4 hidden sm:flex items-center gap-3 rounded-2xl p-4 shadow-xl backdrop-blur-md"
            style={{
              background: "rgba(34, 30, 27, 0.90)",
              border: "1px solid rgba(217, 168, 126, 0.25)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#52734D] text-white flex items-center justify-center">
              <FiTruck size={20} />
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium">Pan-India Support</p>
              <p className="text-sm font-bold text-white">Free Room Delivery</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;