import { motion } from "framer-motion";
import {
  FiCamera,
  FiHeadphones,
  FiMonitor,
  FiSmartphone,
  FiSpeaker,
  FiWatch,
  FiArrowRight,
} from "react-icons/fi";

const categories = [
  { name: "Mobiles", icon: FiSmartphone, count: "1,200+ Products" },
  { name: "Laptops", icon: FiMonitor, count: "850+ Products" },
  { name: "Audio", icon: FiHeadphones, count: "600+ Products" },
  { name: "Wearables", icon: FiWatch, count: "400+ Products" },
  { name: "Cameras", icon: FiCamera, count: "300+ Products" },
  { name: "Speakers", icon: FiSpeaker, count: "250+ Products" },
];

function CategoryGrid() {
  return (
    <section className="px-8 py-20" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Electronics
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Shop by Category
            </h2>
            <p className="mt-2" style={{ color: "var(--color-muted)" }}>
              Explore our curated range of electronics
            </p>
          </div>

          <a
            href="#"
            className="hidden md:flex items-center gap-2 transition"
            style={{ color: "var(--color-accent)" }}
          >
            View All <FiArrowRight />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.article
                key={category.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group cursor-pointer rounded-2xl p-5 shadow-lg transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  <Icon size={22} />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  {category.count}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoryGrid;
