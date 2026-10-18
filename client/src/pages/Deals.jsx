import SEO from "../components/common/SEO";
import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import QuickViewModal from "../components/product/QuickViewModal";
import { getAllProducts } from "../services/productService";
import { FiClock, FiTag } from "react-icons/fi";

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, "0");

  return (
    <div
      className="inline-flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-sm"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
        <FiClock size={18} />
        <span>Offer Ends In:</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-base font-bold">
        <span className="rounded-lg px-2.5 py-1" style={{ background: "var(--color-surface-alt)" }}>
          {formatDigit(timeLeft.hours)}h
        </span>
        :
        <span className="rounded-lg px-2.5 py-1" style={{ background: "var(--color-surface-alt)" }}>
          {formatDigit(timeLeft.minutes)}m
        </span>
        :
        <span className="rounded-lg px-2.5 py-1" style={{ background: "var(--color-accent)", color: "#fff" }}>
          {formatDigit(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  );
}

function Deals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        const data = await getAllProducts({ badge: "SALE" });
        const productList = Array.isArray(data) ? data : (data?.products || []);
        setProducts(productList);
      } catch (err) {
        setError("Failed to load furniture offers.");
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  return (
    <>
      <SEO
        title="Exclusive Furniture Deals & Offers | Furniva"
        description="Discover handcrafted wooden furniture, luxury sofas, dining sets, and bedroom suites at exclusive limited-time prices."
        canonicalUrl="/deals"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Exclusive Deals", item: "/deals" },
        ]}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider mb-3"
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                }}
              >
                <FiTag /> Limited Time Studio Sale
              </div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Curated Furniture Offers</h1>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Save up to 40% on handcrafted solid wood furniture, luxury sofas & dining suites
              </p>
            </div>

            {/* Countdown timer */}
            <CountdownTimer />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : error
              ? (
                <div
                  className="col-span-full text-center text-lg py-12"
                  style={{ color: "var(--color-danger)" }}
                >
                  {error}
                </div>
              )
              : products.length === 0
              ? (
                <div
                  className="col-span-full text-center text-lg py-16"
                  style={{ color: "var(--color-muted)" }}
                >
                  No active furniture offers right now. Check back soon for our next seasonal curation!
                </div>
              )
              : products.map((product) => {
                  const discountPct = product.oldPrice && product.price
                    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                    : 20;

                  return (
                    <div key={product._id || product.id} className="relative">
                      {/* Discount Badge */}
                      <span className="absolute top-3 left-3 z-10 rounded-full bg-amber-700 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                        {discountPct}% OFF
                      </span>
                      <ProductCard product={product} onQuickView={setQuickViewProduct} />
                    </div>
                  );
                })}
          </div>
        </div>
      </main>

      <Footer />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}

export default Deals;
