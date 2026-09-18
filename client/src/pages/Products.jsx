import { Helmet } from "react-helmet-async";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import QuickViewModal from "../components/product/QuickViewModal";
import { useEffect, useState, useCallback } from "react";
import { getAllProducts } from "../services/productService";
import { useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

const PRODUCTS_PER_PAGE = 12;

const CATEGORIES = [
  "Sofas & Seating",
  "Beds & Bedroom",
  "Dining Furniture",
  "Living Room",
  "Tables & Desks",
  "Storage & Cabinets",
];
const RATINGS = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state from URL
  const selectedCategory = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minRating = searchParams.get("minRating") || "";
  const sort = searchParams.get("sort") || "";
  const searchQuery = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  // Local state for price inputs (update URL on blur/enter)
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync local price state when URL changes externally
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Helper to update search params immutably
  const updateParams = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        // Reset to page 1 when filters change (unless page itself is being set)
        if (!("page" in updates)) {
          next.delete("page");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Fetch products when search params change (server-side pagination)
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = Object.fromEntries(searchParams);
        // Ensure page and limit are sent
        if (!params.page) params.page = "1";
        if (!params.limit) params.limit = String(PRODUCTS_PER_PAGE);
        const data = await getAllProducts(params);
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError("Could not load products. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  // Category toggle
  const handleCategoryChange = (cat) => {
    updateParams({ category: selectedCategory === cat ? "" : cat });
  };

  // Price apply (on blur or Enter)
  const applyPriceFilter = () => {
    updateParams({ minPrice: localMinPrice, maxPrice: localMaxPrice });
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === "Enter") applyPriceFilter();
  };

  // Rating toggle
  const handleRatingChange = (value) => {
    updateParams({ minRating: minRating === value ? "" : value });
  };

  // Sort change
  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams({});
    setLocalMinPrice("");
    setLocalMaxPrice("");
  };

  const hasActiveFilters =
    selectedCategory || minPrice || maxPrice || minRating || sort || searchQuery;

  const goToPage = (page) => {
    updateParams({ page: page > 1 ? String(page) : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>
          {searchQuery
            ? `Search: "${searchQuery}" – Furniva`
            : selectedCategory
            ? `${selectedCategory} – Furniva`
            : "Shop Furniture – Furniva"}
        </title>
        <meta
          name="description"
          content="Explore furniture designed for comfort, style and everyday living. Handcrafted sofas, beds, dining sets, tables, and storage at Furniva."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.3em]"
                style={{ color: "var(--color-accent)" }}
              >
                {searchQuery ? "Search Results" : "Furniva Catalog"}
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-bold">
                {searchQuery ? `Results for "${searchQuery}"` : selectedCategory || "Shop Furniture"}
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                {totalProducts} furniture designs available
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-body)",
                  }}
                >
                  <FiX size={14} /> Clear Filters
                </button>
              )}
              <select
                value={sort}
                onChange={handleSortChange}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-alt)",
                  color: "var(--color-heading)",
                }}
              >
                <option value="">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="hidden lg:block filter-sidebar">
              <div>
                <h2 className="text-lg font-semibold">Category</h2>
                <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--color-body)" }}>
                  {CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategory === category}
                        onChange={() => handleCategoryChange(category)}
                        style={{ accentColor: "var(--color-accent)" }}
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold">Price Range</h2>
                <div className="mt-4 grid gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    onBlur={applyPriceFilter}
                    onKeyDown={handlePriceKeyDown}
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
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    onBlur={applyPriceFilter}
                    onKeyDown={handlePriceKeyDown}
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
                  {RATINGS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === r.value}
                        onChange={() => handleRatingChange(r.value)}
                        style={{ accentColor: "var(--color-accent)" }}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
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
                  : products.length === 0
                  ? (
                    <div
                      className="col-span-full text-center text-lg py-16"
                      style={{ color: "var(--color-muted)" }}
                    >
                      No products match your filters.
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
