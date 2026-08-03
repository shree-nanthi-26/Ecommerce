import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import QuickViewModal from "../components/product/QuickViewModal";
import { getAllProducts } from "../services/productService";
import { FiZap } from "react-icons/fi";

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
        setProducts(data);
      } catch (err) {
        setError("Failed to load special deals.");
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  return (
    <>
      <Helmet>
        <title>Exclusive Deals & Offers – ElectroMart</title>
        <meta
          name="description"
          content="Grab incredible discounts on top electronics. Limited-time sales on laptops, smartphones, audio gear, and more!"
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider mb-3"
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                }}
              >
                <FiZap /> Limited Time Offers
              </div>
              <h1 className="text-4xl font-bold">Hot Tech Deals</h1>
              <p className="mt-2 text-base" style={{ color: "var(--color-muted)" }}>
                Save big on premium devices while supplies last
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
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
                  No active sale deals right now. Check back soon!
                </div>
              )
              : products.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
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
