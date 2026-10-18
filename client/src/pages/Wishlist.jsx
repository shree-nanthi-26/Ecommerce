import SEO from "../components/common/SEO";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiTrash2,
  FiShoppingCart,
  FiTrendingDown,
  FiCheckCircle,
  FiArrowRight,
  FiShoppingBag,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import WishlistItemCard from "../components/wishlist/WishlistItemCard";
import SkeletonCard from "../components/product/SkeletonCard";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function Wishlist() {
  const { wishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [movingAll, setMovingAll] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'in-stock' | 'price-dropped'

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const total = wishlist.length;
    const priceDropped = wishlist.filter(
      (item) => (item.priceDrop && item.priceDrop > 0) || (item.priceWhenAdded && item.price < item.priceWhenAdded)
    ).length;
    const inStock = wishlist.filter((item) => item.stock > 0).length;
    const outOfStock = wishlist.filter((item) => item.stock === 0).length;
    return { total, priceDropped, inStock, outOfStock };
  }, [wishlist]);

  const filteredItems = useMemo(() => {
    if (filter === "price-dropped") {
      return wishlist.filter(
        (item) => (item.priceDrop && item.priceDrop > 0) || (item.priceWhenAdded && item.price < item.priceWhenAdded)
      );
    }
    if (filter === "in-stock") {
      return wishlist.filter((item) => item.stock > 0);
    }
    return wishlist;
  }, [wishlist, filter]);

  const handleMoveAllInStockToCart = async () => {
    const availableItems = wishlist.filter((item) => item.stock > 0);
    if (availableItems.length === 0) return;

    try {
      setMovingAll(true);
      for (const item of availableItems) {
        await addToCart(item, 1);
      }
      await clearWishlist();
    } catch (err) {
      console.error("Failed to move all items to cart:", err);
    } finally {
      setMovingAll(false);
    }
  };

  return (
    <>
      <SEO
        title="My Wishlist | Furniva Luxury Furniture"
        description="Manage your saved furniture pieces and monitor price drops."
        canonicalUrl="/wishlist"
        noIndex={true}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b pb-8" style={{ borderColor: "var(--color-border)" }}>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: "var(--color-surface-alt)",
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Curated Collection
                </span>
                {stats.priceDropped > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FiTrendingDown size={13} /> {stats.priceDropped} Price Drops!
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
                My Wishlist
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                {mounted ? wishlist.length : "—"} handcrafted piece{wishlist.length !== 1 ? "s" : ""} saved in your personal wishlist.
              </p>
            </div>

            {mounted && wishlist.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {stats.inStock > 0 && (
                  <button
                    type="button"
                    onClick={handleMoveAllInStockToCart}
                    disabled={movingAll}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "var(--color-accent)" }}
                  >
                    <FiShoppingBag size={14} />
                    {movingAll ? "Moving All..." : "Move All In-Stock to Cart"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearWishlist}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 hover:border-rose-500 hover:text-rose-500"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <FiTrash2 size={14} />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          {mounted && wishlist.length > 0 && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "all"
                    ? "text-white shadow-sm"
                    : "border hover:bg-[var(--color-surface-alt)]"
                }`}
                style={{
                  background: filter === "all" ? "var(--color-accent)" : "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                All Items ({stats.total})
              </button>

              {stats.priceDropped > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter("price-dropped")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    filter === "price-dropped"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border hover:bg-[var(--color-surface-alt)]"
                  }`}
                  style={{
                    background: filter === "price-dropped" ? undefined : "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: filter === "price-dropped" ? "#ffffff" : "var(--color-heading)",
                  }}
                >
                  <FiTrendingDown size={13} /> Price Drops ({stats.priceDropped})
                </button>
              )}

              <button
                type="button"
                onClick={() => setFilter("in-stock")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "in-stock"
                    ? "text-white shadow-sm"
                    : "border hover:bg-[var(--color-surface-alt)]"
                }`}
                style={{
                  background: filter === "in-stock" ? "var(--color-accent)" : "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                In Stock Only ({stats.inStock})
              </button>
            </div>
          )}

          {/* Skeletons while loading */}
          {!mounted ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty State */
            <div
              className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border px-6 py-12 text-center"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: "var(--color-surface-alt)" }}
              >
                <FiHeart size={36} style={{ color: "var(--color-muted)" }} />
              </div>
              <p className="text-2xl font-bold">
                {filter === "all" ? "Your wishlist is empty" : "No items matching this filter"}
              </p>
              <p className="mt-2 text-sm max-w-md" style={{ color: "var(--color-muted)" }}>
                {filter === "all"
                  ? "Explore our designer collections and save pieces you adore to keep track of prices and stock."
                  : "Try clearing your filter to view all saved items."}
              </p>
              {filter === "all" ? (
                <Link to="/products" className="btn-primary mt-6">
                  Explore Collections
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="btn-secondary mt-6"
                >
                  Show All Items
                </button>
              )}
            </div>
          ) : (
            /* Wishlist Items Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <WishlistItemCard key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Wishlist;
