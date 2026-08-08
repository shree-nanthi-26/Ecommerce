import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiStar, FiEye } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

const formatPrice = (value) => `₹${value.toLocaleString("en-IN")}`;

/**
 * ProductCard – displays a single product in the listing grid.
 * Accepts an optional `onQuickView` callback to open a quick-view modal.
 */
function ProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const productId = product._id || product.id;

  const imageSrc =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
    "https://via.placeholder.com/640x480?text=ElectroMart+Product";

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const badgeLabel = product.badge;
  const badgeClass =
    badgeLabel === "NEW"
      ? "badge badge--new"
      : badgeLabel === "SALE"
      ? "badge badge--sale"
      : null;

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="product-card"
    >
      {/* Image area */}
      <div className="product-card__image-wrap">
        {badgeClass && (
          <span className={badgeClass}>{badgeLabel}</span>
        )}

        {isOutOfStock && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
            OUT OF STOCK
          </span>
        )}

        {!isOutOfStock && isLowStock && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
            ONLY {product.stock} LEFT
          </span>
        )}

        <button
          type="button"
          aria-label={isInWishlist(productId) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`wishlist-btn ${isInWishlist(productId) ? "wishlist-btn--active" : ""}`}
        >
          <FiHeart size={16} className={isInWishlist(productId) ? "fill-current" : ""} />
        </button>

        <Link to={`/products/${productId}`} className="block h-full w-full">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={isOutOfStock ? "opacity-60 grayscale" : ""}
          />
        </Link>

        {/* Quick-view overlay */}
        {onQuickView && (
          <button
            type="button"
            className="quick-view-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label={`Quick view ${product.name}`}
          >
            <FiEye size={18} />
            Quick View
          </button>
        )}
      </div>

      {/* Body */}
      <Link to={`/products/${productId}`} className="product-card__body block">
        <p className="product-card__category">{product.category}</p>
        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__rating">
          <FiStar />
          <span>{product.rating?.toFixed(1)}</span>
          <span style={{ color: "var(--color-muted)" }}>
            ({product.reviews?.toLocaleString("en-IN")} reviews)
          </span>
        </div>

        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <>
              <span className="product-card__old-price">{formatPrice(product.oldPrice)}</span>
              <span className="product-card__discount">-{discount}%</span>
            </>
          )}
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="product-card__actions">
        <button
          type="button"
          disabled={isOutOfStock}
          className={`w-full rounded-xl px-4 py-2.5 font-bold flex items-center justify-center gap-2 transition ${
            isOutOfStock
              ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-400"
              : "btn-primary"
          }`}
          aria-label={isOutOfStock ? `${product.name} is Out of Stock` : `Add ${product.name} to cart`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isOutOfStock) addToCart(product);
          }}
        >
          <FiShoppingCart size={16} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </motion.article>
  );
}

export default ProductCard;
