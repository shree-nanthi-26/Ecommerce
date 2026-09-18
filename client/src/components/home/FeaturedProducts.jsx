import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import ProductCard from "../product/ProductCard";
import SkeletonCard from "../product/SkeletonCard";
import { useEffect, useState } from "react";
import { getAllProducts } from "../../services/productService";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const data = await getAllProducts();
        const list = Array.isArray(data) ? data : (data?.products || []);
        setProducts(list.slice(0, 8));
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <section className="px-6 sm:px-8 py-20" style={{ background: "var(--color-surface)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Handcrafted Pieces
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mt-2" style={{ color: "var(--color-heading)" }}>
              Featured Furniture
            </h2>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-muted)" }}>
              Signature comfort and enduring craftsmanship for your home
            </p>
          </div>

          <Link
            to="/products"
            className="hidden md:flex items-center gap-2 font-bold text-sm transition hover:gap-3"
            style={{ color: "var(--color-accent)" }}
          >
            Explore All Furniture <FiArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product._id || product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;
