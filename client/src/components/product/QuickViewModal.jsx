import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiShoppingCart, FiHeart, FiStar } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useEffect } from "react";

const formatPrice = (value) => `₹${value.toLocaleString("en-IN")}`;

/**
 * QuickViewModal – full-featured modal for quickly inspecting a product
 * without navigating away from the listing page.
 */
function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const productId = product._id || product.id;
  const imageSrc =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
    "https://via.placeholder.com/640x480?text=ElectroMart+Product";
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Lock body scroll while modal is open & close on Escape
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view – ${product.name}`}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="modal-close" onClick={onClose} aria-label="Close quick view">
            <FiX size={18} />
          </button>

          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div
              className="p-6"
              style={{ background: "var(--color-surface-alt)", borderRadius: "var(--radius-xl) 0 0 var(--radius-xl)" }}
            >
              <img
                src={imageSrc}
                alt={product.name}
                loading="lazy"
                className="w-full rounded-2xl object-cover"
                style={{ maxHeight: "22rem" }}
              />
            </div>

            {/* Details */}
            <div className="p-8 flex flex-col justify-center gap-4">
              <p className="product-card__category">{product.category}</p>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>
                {product.name}
              </h2>

              {/* Rating */}
              <div className="product-card__rating">
                <FiStar style={{ color: "var(--color-rating)" }} />
                <span>{product.rating?.toFixed(1)}</span>
                <span style={{ color: "var(--color-muted)" }}>
                  ({product.reviews?.toLocaleString("en-IN")} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="product-card__price-row">
                <span className="product-card__price text-xl">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <>
                    <span className="product-card__old-price">
                      {formatPrice(product.oldPrice)}
                    </span>
                    <span className="product-card__discount">-{discount}%</span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm leading-7" style={{ color: "var(--color-body)" }}>
                  {product.description.slice(0, 200)}
                  {product.description.length > 200 ? "…" : ""}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  className="btn-primary"
                  onClick={() => { addToCart(product); onClose(); }}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <FiShoppingCart size={16} />
                  Add to Cart
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isInWishlist(productId) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <FiHeart size={16} className={isInWishlist(productId) ? "fill-current" : ""} />
                  {isInWishlist(productId) ? "Wishlisted" : "Wishlist"}
                </button>
              </div>

              <Link
                to={`/products/${productId}`}
                className="text-sm font-medium mt-2"
                style={{ color: "var(--color-accent)" }}
                onClick={onClose}
              >
                View full details →
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default QuickViewModal;
