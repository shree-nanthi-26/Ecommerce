import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import SkeletonCard from "./SkeletonCard";
import {
  getSimilarProducts,
  getCustomersAlsoBought,
  getYouMayAlsoLike,
  getPersonalizedRecommendations,
} from "../../services/recommendationService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function ProductRecommendations({
  type = "similar",
  productId = null,
  limit = 4,
  title = null,
  subtitle = null,
  badge = null,
  className = "",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendations() {
      try {
        setLoading(true);
        let res = [];

        if (type === "similar" && productId) {
          res = await getSimilarProducts(productId, limit);
        } else if (type === "also_bought" && productId) {
          res = await getCustomersAlsoBought(productId, limit);
        } else if (type === "you_may_like") {
          res = await getYouMayAlsoLike(productId, limit);
        } else if (type === "for_you") {
          // Extract recent, wishlist, and cart IDs
          let recentIds = [];
          try {
            const raw =
              localStorage.getItem("furniva_recently_viewed") ||
              localStorage.getItem("electromart_recently_viewed");
            const parsed = JSON.parse(raw || "[]");
            recentIds = parsed.map((p) => p._id || p.id).filter(Boolean);
          } catch {
            // Ignore parse error
          }

          const wishlistIds = (wishlist || []).map((w) => w._id || w.id).filter(Boolean);
          const cartIds = (cart || []).map((c) => c.id || c._id).filter(Boolean);

          res = await getPersonalizedRecommendations({
            recentIds: recentIds.slice(0, 6),
            wishlistIds: wishlistIds.slice(0, 6),
            cartIds: cartIds.slice(0, 6),
            limit,
          });
        }

        if (isMounted) {
          setProducts(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error(`Failed to fetch ${type} recommendations:`, err.message);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRecommendations();
    return () => {
      isMounted = false;
    };
  }, [type, productId, limit, cart, wishlist]);

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  // Default Headings based on type
  const defaultHeadings = {
    similar: {
      badge: "Matching Aesthetics",
      title: "Similar Handcrafted Designs",
      subtitle: "Pieces sharing the same architectural lines, timber grain, and proportions.",
    },
    also_bought: {
      badge: "Popular Pairings",
      title: "Customers Also Considered",
      subtitle: "Frequently browsed by customers interested in this collection.",
    },
    for_you: {
      badge: "Tailored For Your Home",
      title: "Recommended for You",
      subtitle: "Curated selections based on your browsing style and preferences.",
    },
    you_may_like: {
      badge: "Complete Your Space",
      title: "You May Also Like",
      subtitle: "Harmonious furniture designs to complement your interior palette.",
    },
  };

  const headerBadge = badge || defaultHeadings[type]?.badge || "Curated Selection";
  const headerTitle = title || defaultHeadings[type]?.title || "Recommended Products";
  const headerSubtitle = subtitle || defaultHeadings[type]?.subtitle || "";

  return (
    <section className={`py-12 ${className}`}>
      <div className="mb-8">
        <p
          className="text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--color-accent)" }}
        >
          {headerBadge}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[var(--color-heading)]">
          {headerTitle}
        </h2>
        {headerSubtitle && (
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--color-muted)" }}>
            {headerSubtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
      </div>
    </section>
  );
}
