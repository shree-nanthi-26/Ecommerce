import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import SkeletonCard from "../components/product/SkeletonCard";
import { useWishlist } from "../context/WishlistContext";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  // Brief mount-delay to show skeletons while context hydrates
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Helmet>
        <title>My Wishlist – ElectroMart</title>
        <meta
          name="description"
          content="View and manage your ElectroMart wishlist. Save your favourite electronics and add them to your cart when you're ready."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Saved Items
            </p>
            <h1 className="mt-2 text-4xl font-bold">My Wishlist</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              {mounted ? wishlist.length : "—"} items saved
            </p>
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
                  <div key={itemId} className="relative">
                    <ProductCard product={item} />
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(itemId)}
                      className="absolute right-3 top-3 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-muted)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-danger)";
                        e.currentTarget.style.color = "var(--color-danger)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-border)";
                        e.currentTarget.style.color = "var(--color-muted)";
                      }}
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      Remove
                    </button>
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
