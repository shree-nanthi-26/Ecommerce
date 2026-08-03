import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getAllProducts } from "../services/productService";

const CATEGORY_ICONS = {
  Mobiles: FiSmartphone,
  Laptops: FiMonitor,
  Audio: FiHeadphones,
  Wearables: FiWatch,
  Cameras: FiCamera,
  Speakers: FiSpeaker,
};

const DEFAULT_CATEGORIES = [
  "Mobiles",
  "Laptops",
  "Audio",
  "Wearables",
  "Cameras",
  "Speakers",
];

function Categories() {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        const products = await getAllProducts();
        const counts = {};
        products.forEach((p) => {
          if (p.category) {
            counts[p.category] = (counts[p.category] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      } catch (err) {
        console.error("Failed to fetch product counts", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Categories – ElectroMart | Browse Premium Electronics</title>
        <meta
          name="description"
          content="Explore all product categories at ElectroMart: Mobiles, Laptops, Audio, Wearables, Cameras, and Speakers."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Explore Catalog
            </p>
            <h1 className="mt-2 text-4xl font-bold">Product Categories</h1>
            <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
              Find exactly what you need across our specialized tech categories
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {DEFAULT_CATEGORIES.map((categoryName, index) => {
              const Icon = CATEGORY_ICONS[categoryName] || FiMonitor;
              const count = categoryCounts[categoryName] || 0;

              return (
                <motion.div
                  key={categoryName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Link
                    to={`/products?category=${encodeURIComponent(categoryName)}`}
                    className="group block rounded-2xl p-8 transition-all hover:shadow-xl"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <Icon size={28} />
                      </div>
                      <span
                        className="flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1"
                        style={{ color: "var(--color-accent)" }}
                      >
                        Explore <FiArrowRight size={16} />
                      </span>
                    </div>

                    <h2 className="mt-6 text-2xl font-bold">{categoryName}</h2>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                      {loading ? "Loading products..." : `${count} Products Available`}
                    </p>
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
