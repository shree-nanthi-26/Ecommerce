import { useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";

function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      // Primary key: furniva_recently_viewed. electromart_recently_viewed kept for legacy compatibility
      const raw = localStorage.getItem("furniva_recently_viewed") || localStorage.getItem("electromart_recently_viewed");
      const stored = JSON.parse(raw || "[]");
      setItems(stored.slice(0, 4));
    } catch (e) {
      console.error("Failed to load recently viewed items", e);
    }
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="px-6 sm:px-8 py-16" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-[1500px] mx-auto">
        <div className="mb-8">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--color-accent)" }}
          >
            Your History
          </p>
          <h2 className="text-3xl font-extrabold mt-1" style={{ color: "var(--color-heading)" }}>
            Recently Viewed Furniture
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecentlyViewed;
