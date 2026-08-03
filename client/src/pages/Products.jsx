import { Helmet } from "react-helmet-async";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import QuickViewModal from "../components/product/QuickViewModal";
import { useEffect, useState, useMemo } from "react";
import { getAllProducts } from "../services/productService";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PRODUCTS_PER_PAGE = 12;

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        setError("Could not load products. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(start, start + PRODUCTS_PER_PAGE);
  }, [products, currentPage]);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>All Products – ElectroMart | Premium Electronics Store</title>
        <meta
          name="description"
          content="Browse our curated collection of premium electronics – smartphones, laptops, audio, wearables, and more. Best prices, free delivery."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--color-accent)" }}
              >
                Explore
              </p>
              <h1 className="mt-2 text-4xl font-bold">All Products</h1>
              <p className="mt-2" style={{ color: "var(--color-muted)" }}>
                {products.length} products found
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="hidden lg:block filter-sidebar">
              <div>
                <h2 className="text-lg font-semibold">Category</h2>
                <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--color-body)" }}>
                  {["Mobiles", "Laptops", "Audio", "Wearables", "Cameras", "Speakers"].map(
                    (category) => (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          style={{ accentColor: "var(--color-accent)" }}
                        />
                        <span>{category}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">Price Range</h2>
                <div className="mt-4 grid gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-alt)",
                      color: "var(--color-heading)",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-alt)",
                      color: "var(--color-heading)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">Rating</h2>
                <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--color-body)" }}>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="rating" style={{ accentColor: "var(--color-accent)" }} />
                    <span>4★ & up</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="rating" style={{ accentColor: "var(--color-accent)" }} />
                    <span>3★ & up</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : error
                  ? (
                    <div
                      className="col-span-full text-center text-lg"
                      style={{ color: "var(--color-danger)" }}
                    >
                      {error}
                    </div>
                  )
                  : paginatedProducts.map((product) => (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
              </div>

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination__btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination__btn ${page === currentPage ? "pagination__btn--active" : ""}`}
                      onClick={() => goToPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="pagination__btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Quick-view modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}

export default Products;
