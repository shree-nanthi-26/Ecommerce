import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { LuSofa, LuBed, LuArmchair, LuTable, LuBox } from "react-icons/lu";
import { MdOutlineTableRestaurant } from "react-icons/md";

const categories = [
  {
    name: "Sofas & Seating",
    icon: LuSofa,
    count: "120+ Designs",
    path: "/products?category=Sofas%20%26%20Seating",
    tagline: "Lounge & Comfort",
  },
  {
    name: "Beds & Bedroom",
    icon: LuBed,
    count: "90+ Designs",
    path: "/products?category=Beds%20%26%20Bedroom",
    tagline: "Rest & Sanctuary",
  },
  {
    name: "Dining Furniture",
    icon: MdOutlineTableRestaurant,
    count: "75+ Designs",
    path: "/products?category=Dining%20Furniture",
    tagline: "Gather & Feast",
  },
  {
    name: "Living Room",
    icon: LuArmchair,
    count: "110+ Designs",
    path: "/products?category=Living%20Room",
    tagline: "Accents & Consoles",
  },
  {
    name: "Tables & Desks",
    icon: LuTable,
    count: "80+ Designs",
    path: "/products?category=Tables%20%26%20Desks",
    tagline: "Work & Dine",
  },
  {
    name: "Storage & Cabinets",
    icon: LuBox,
    count: "65+ Designs",
    path: "/products?category=Storage%20%26%20Cabinets",
    tagline: "Wardrobes & Units",
  },
];

function CategoryGrid() {
  return (
    <section className="px-6 sm:px-8 py-20" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Curated Spaces
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mt-2" style={{ color: "var(--color-heading)" }}>
              Shop by Category
            </h2>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-muted)" }}>
              Explore handcrafted furniture designed for every room of your home
            </p>
          </div>

          <Link
            to="/categories"
            className="hidden md:flex items-center gap-2 font-bold text-sm transition hover:gap-3"
            style={{ color: "var(--color-accent)" }}
          >
            View All Collections <FiArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  to={category.path}
                  className="group flex flex-col justify-between h-full rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 block"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div>
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:bg-[var(--color-accent)] group-hover:text-white"
                      style={{
                        background: "var(--color-accent-light)",
                        color: "var(--color-accent)",
                      }}
                    >
                      <Icon size={26} />
                    </div>

                    <h3 className="mt-5 text-base sm:text-lg font-bold transition-colors group-hover:text-[var(--color-accent)]" style={{ color: "var(--color-heading)" }}>
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                      {category.tagline}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {category.count}
                    </span>
                    <FiArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" style={{ color: "var(--color-accent)" }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoryGrid;
