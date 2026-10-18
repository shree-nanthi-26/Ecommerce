import SEO from "../components/common/SEO";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LuArmchair,
  LuBed,
  LuUtensils,
  LuSofa,
  LuTable,
  LuArchive,
  LuArrowRight,
} from "react-icons/lu";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getAllProducts } from "../services/productService";

const CATEGORIES_DATA = [
  {
    name: "Sofas & Seating",
    icon: LuArmchair,
    description: "Luxury sectional sofas, ergonomic recliners, accent armchairs and handcrafted seating.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Beds & Bedroom",
    icon: LuBed,
    description: "Solid teak & sheesham beds, upholstered headboards, nightstands and dressers.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Dining Furniture",
    icon: LuUtensils,
    description: "Handcrafted 4 to 8-seater dining tables, cushioned dining chairs and barstools.",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Living Room",
    icon: LuSofa,
    description: "Contemporary TV consoles, lounge chairs, display shelves and center tables.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Tables & Desks",
    icon: LuTable,
    description: "Solid wood study desks, nesting coffee tables, console tables and work setups.",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Storage & Cabinets",
    icon: LuArchive,
    description: "Spacious wardrobes, credenzas, modular shoe racks, bookshelves and chests of drawers.",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
  },
];

function Categories() {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        const data = await getAllProducts();
        const list = Array.isArray(data) ? data : (data?.products || []);
        const counts = {};
        list.forEach((p) => {
          if (p.category) {
            counts[p.category] = (counts[p.category] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      } catch (err) {
        console.error("Failed to fetch furniture category counts", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <>
      <SEO
        title="Furniture Collections – Furniva | Curated Living Spaces"
        description="Explore curated furniture collections at Furniva: Sofas & Seating, Beds & Bedroom, Dining Furniture, Living Room, Tables & Desks, and Storage Cabinets."
        canonicalUrl="/categories"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Collections", item: "/categories" },
        ]}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 max-w-2xl">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Curated Collections
            </p>
            <h1 className="mt-2 text-4xl font-serif font-bold tracking-tight">
              Furniture Collections
            </h1>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--color-muted)" }}>
              Explore artfully designed pieces made from genuine solid wood, luxury fabrics, and premium finishes built to elevate every room of your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES_DATA.map((cat, index) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.name] || 0;

              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="group block overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    {/* Visual Card Header with Photo */}
                    <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 backdrop-blur-md shadow-sm" style={{ color: "var(--color-accent)" }}>
                        <Icon size={22} />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                        <span className="text-xs font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                          {loading ? "Loading..." : `${count} Products`}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif font-bold group-hover:text-[var(--color-accent)] transition-colors">
                          {cat.name}
                        </h2>
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
                          style={{
                            background: "var(--color-accent-light)",
                            color: "var(--color-accent)",
                          }}
                        >
                          <LuArrowRight size={18} />
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {cat.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Categories;
