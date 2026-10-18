import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2,
  FiShoppingCart,
  FiArrowRight,
  FiTrendingDown,
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiShield,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useWishlist } from "../../context/WishlistContext";

export default function WishlistItemCard({ item }) {
  const { removeFromWishlist, moveToCart, addToCart, updateNotificationConsent } = useWishlist();
  const [moving, setMoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showNotifyPanel, setShowNotifyPanel] = useState(false);
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const [consentSuccessMessage, setConsentSuccessMessage] = useState("");

  const itemId = item._id || item.id;
  const currentPrice = Number(item.price) || 0;
  const oldPrice = Number(item.oldPrice) || 0;
  const priceWhenAdded = Number(item.priceWhenAdded) || currentPrice;
  const priceDrop =
    currentPrice < priceWhenAdded
      ? priceWhenAdded - currentPrice
      : Number(item.priceDrop) || 0;

  const discountPercent =
    oldPrice > currentPrice
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  const isOutOfStock = item.stock === 0;
  const isLowStock = !isOutOfStock && item.stock <= (item.lowStockThreshold || 5);

  const handleMoveToCart = async () => {
    if (isOutOfStock) return;
    try {
      setMoving(true);
      await moveToCart(item);
    } catch (err) {
      console.error("Failed to move item to cart:", err);
    } finally {
      setMoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      setAdding(true);
      await addToCart(item, 1);
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    } finally {
      setTimeout(() => setAdding(false), 800);
    }
  };

  const handleToggleConsent = async (field, currentValue) => {
    try {
      setUpdatingConsent(true);
      const updatePayload = { [field]: !currentValue };
      await updateNotificationConsent(itemId, updatePayload);
      setConsentSuccessMessage("Preferences updated with your consent");
      setTimeout(() => setConsentSuccessMessage(""), 2500);
    } catch (err) {
      console.error("Failed to update notification consent:", err);
    } finally {
      setUpdatingConsent(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col justify-between rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface-alt)]">
        <Link to={`/products/${itemId}`} className="block h-full w-full">
          <img
            src={
              item.image ||
              item.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
            }
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm"
              style={{ background: "var(--color-accent)" }}
            >
              {discountPercent}% OFF
            </span>
          )}

          {/* Stock Badges */}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-sm shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/95 text-white backdrop-blur-sm shadow-sm">
              Only {item.stock} left
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm">
              In Stock
            </span>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => removeFromWishlist(itemId)}
          title="Remove from wishlist"
          aria-label="Remove item"
          className="absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center border shadow-md transition-all duration-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-500 hover:text-rose-500 hover:scale-110"
          style={{ borderColor: "var(--color-border)" }}
        >
          <FiTrash2 size={15} />
        </button>
      </div>

      {/* Product Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Category */}
          {item.category && (
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-muted)" }}
            >
              {item.category}
            </p>
          )}

          {/* Title */}
          <Link
            to={`/products/${itemId}`}
            className="block font-bold text-base leading-snug line-clamp-1 hover:text-[var(--color-accent)] transition-colors"
            style={{ color: "var(--color-heading)" }}
          >
            {item.name}
          </Link>

          {/* Pricing Section */}
          <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
            <span
              className="text-xl font-extrabold"
              style={{ color: "var(--color-heading)" }}
            >
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>
            {oldPrice > currentPrice && (
              <span
                className="text-xs line-through"
                style={{ color: "var(--color-muted)" }}
              >
                ₹{oldPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* PRICE DROP INDICATOR BANNER */}
          {priceDrop > 0 && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold animate-pulse">
              <FiTrendingDown size={16} className="shrink-0 text-emerald-500" />
              <span>Price dropped by ₹{priceDrop.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>

        {/* NOTIFY ME ACCORDION / TOGGLE */}
        <div
          className="rounded-2xl border p-3 text-xs"
          style={{
            background: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setShowNotifyPanel(!showNotifyPanel)}
            className="w-full flex items-center justify-between font-bold text-[var(--color-heading)] hover:text-[var(--color-accent)] transition"
          >
            <span className="flex items-center gap-1.5">
              <FiBell
                size={13}
                className={
                  item.notifyOnPriceDrop || item.notifyOnRestock
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]"
                }
              />
              Alert Preferences
              {(item.notifyOnPriceDrop || item.notifyOnRestock) && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </span>
            {showNotifyPanel ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {showNotifyPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-3 space-y-2.5 border-t mt-2"
                style={{ borderColor: "var(--color-border)" }}
              >
                {/* Price Drop Switch */}
                <label className="flex items-center justify-between cursor-pointer gap-2 select-none">
                  <div>
                    <p className="font-semibold text-[var(--color-heading)] text-[11px]">
                      Price Drop Alerts
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                      Email me if the price drops further
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(item.notifyOnPriceDrop)}
                    disabled={updatingConsent}
                    onChange={() =>
                      handleToggleConsent("notifyOnPriceDrop", item.notifyOnPriceDrop)
                    }
                    className="h-4 w-4 rounded accent-[var(--color-accent)] cursor-pointer"
                  />
                </label>

                {/* Back in Stock Switch */}
                <label className="flex items-center justify-between cursor-pointer gap-2 select-none">
                  <div>
                    <p className="font-semibold text-[var(--color-heading)] text-[11px]">
                      Restock Alerts
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                      Email me when restocked
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(item.notifyOnRestock)}
                    disabled={updatingConsent}
                    onChange={() =>
                      handleToggleConsent("notifyOnRestock", item.notifyOnRestock)
                    }
                    className="h-4 w-4 rounded accent-[var(--color-accent)] cursor-pointer"
                  />
                </label>

                {consentSuccessMessage && (
                  <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 pt-1">
                    <FiCheckCircle size={11} /> {consentSuccessMessage}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Move to Cart */}
          <button
            type="button"
            onClick={handleMoveToCart}
            disabled={isOutOfStock || moving}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--color-accent)" }}
          >
            {moving ? (
              <span>Moving...</span>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <FiArrowRight size={14} /> Move to Cart
              </>
            )}
          </button>

          {/* Add to Cart (Keep in wishlist) */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 hover:bg-[var(--color-surface-alt)] active:scale-[0.98]"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              {adding ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <FiCheckCircle size={13} /> Added!
                </span>
              ) : (
                <>
                  <FiShoppingCart size={13} /> Add to Cart (Keep Saved)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
