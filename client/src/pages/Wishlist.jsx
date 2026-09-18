import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiTrash2 } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  // Brief mount-delay to show skeletons while context hydrates
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Helmet>
        <title>My Wishlist – Furniva</title>
        <meta
          name="description"
          content="View and manage your Furniva wishlist. Save your favourite furniture and add them to your cart when you're ready."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--color-accent)" }}
              >
                Saved Items
              </p>
              <h1 className="mt-2 text-4xl font-bold">My Wishlist</h1>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                {mounted ? wishlist.length : "—"} item{wishlist.length !== 1 ? "s" : ""} saved
              </p>
            </div>

            {mounted && wishlist.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="btn-secondary text-xs py-2.5 px-4 self-start sm:self-auto flex items-center gap-2 hover:!border-rose-500 hover:!text-rose-500 transition"
              >
                <FiTrash2 size={14} />
                Clear All Items
              </button>
            )}
          </div>

          {/* Loading skeletons while context mounts */}
          {!mounted ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            /* Empty state */
            <div
              className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border px-6 text-center"
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
              <p className="text-2xl font-semibold">Your wishlist is empty</p>
              <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
                Save products you love and come back anytime.
              </p>
              <Link to="/products" className="btn-primary mt-6">
                Continue Shopping
              </Link>
            </div>
          ) : (
            /* Wishlist grid */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {wishlist.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <div key={itemId}>
                    <ProductCard
                      product={item}
                      onRemove={() => removeFromWishlist(itemId)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Wishlist;
