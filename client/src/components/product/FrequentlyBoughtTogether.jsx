import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiCheck, FiShoppingCart, FiCheckCircle } from "react-icons/fi";
import { getFrequentlyBoughtTogether } from "../../services/recommendationService";
import { useCart } from "../../context/CartContext";

const formatPrice = (value) => `₹${value?.toLocaleString("en-IN") || 0}`;

export default function FrequentlyBoughtTogether({ productId, currentProduct }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addedAnimation, setAddedAnimation] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchFBT() {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await getFrequentlyBoughtTogether(productId, 2);
        if (res && res.recommendations && res.recommendations.length > 0) {
          setData(res);
          const allItems = [res.targetProduct || currentProduct, ...res.recommendations];
          setSelectedIds(new Set(allItems.map((p) => p._id || p.id)));
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Failed to load Frequently Bought Together:", err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchFBT();
  }, [productId, currentProduct]);

  const allBundleProducts = useMemo(() => {
    if (!data) return [];
    const target = data.targetProduct || currentProduct;
    return [target, ...(data.recommendations || [])].filter(Boolean);
  }, [data, currentProduct]);

  // Selected items calculations
  const selectedProducts = useMemo(() => {
    return allBundleProducts.filter((p) => selectedIds.has(p._id || p.id));
  }, [allBundleProducts, selectedIds]);

  const bundleTotalPrice = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  }, [selectedProducts]);

  const bundleOldPrice = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + (p.oldPrice || p.price || 0), 0);
  }, [selectedProducts]);

  const bundleSavings = bundleOldPrice > bundleTotalPrice ? bundleOldPrice - bundleTotalPrice : 0;

  const toggleProduct = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddBundleToCart = () => {
    if (!selectedProducts.length) return;
    setAddedAnimation(true);
    selectedProducts.forEach((product) => {
      addToCart(product, 1);
    });
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  if (loading) {
    return (
      <div
        className="p-6 sm:p-8 rounded-3xl animate-pulse space-y-4"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="h-6 w-56 rounded-lg bg-neutral-300 dark:bg-neutral-700" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <section
      className="p-6 sm:p-8 rounded-3xl transition"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="mb-6">
        <p
          className="text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--color-accent)" }}
        >
          Curated Room Styling
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[var(--color-heading)]">
          Frequently Bought Together
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
          Pair this piece with hand-matched complementary furniture crafted to elevate your space.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Visual Product Bundle Cards */}
        <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-3 sm:gap-4 overflow-x-auto pb-2">
          {allBundleProducts.map((item, idx) => {
            const itemId = item._id || item.id;
            const isSelected = selectedIds.has(itemId);
            const isMain = idx === 0;
            const imgSrc =
              item.images?.[0]?.url ||
              (typeof item.images?.[0] === "string" ? item.images[0] : null) ||
              item.image ||
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80";

            return (
              <div key={itemId} className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                <div
                  onClick={() => toggleProduct(itemId)}
                  className={`relative flex-1 md:w-56 p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
                    isSelected
                      ? "ring-2 ring-[var(--color-accent)] shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  {/* Checkbox badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(itemId)}
                        className="rounded"
                        style={{ accentColor: "var(--color-accent)" }}
                      />
                      <span className="truncate max-w-[120px]">
                        {isMain ? "This Item" : "Pair With"}
                      </span>
                    </label>

                    <span className="text-[11px] font-bold text-[var(--color-heading)]">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5 bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Title */}
                  <Link
                    to={`/products/${itemId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block text-xs font-bold truncate text-[var(--color-heading)] hover:text-[var(--color-accent)] transition"
                    title={item.name}
                  >
                    {item.name}
                  </Link>
                  <p className="text-[11px] truncate" style={{ color: "var(--color-muted)" }}>
                    {item.category}
                  </p>
                </div>

                {/* Plus connector between cards on desktop */}
                {idx < allBundleProducts.length - 1 && (
                  <div
                    className="hidden md:flex w-8 h-8 rounded-full items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{
                      background: "var(--color-surface-alt)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <FiPlus size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bundle Summary & Action Box */}
        <div
          className="lg:col-span-4 p-6 rounded-2xl border flex flex-col justify-between space-y-4"
          style={{
            background: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Bundle Summary
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-3xl font-black text-[var(--color-heading)]">
                {formatPrice(bundleTotalPrice)}
              </span>
              {bundleSavings > 0 && (
                <span
                  className="text-sm line-through font-semibold"
                  style={{ color: "var(--color-muted)" }}
                >
                  {formatPrice(bundleOldPrice)}
                </span>
              )}
            </div>

            {bundleSavings > 0 && (
              <p className="text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FiCheckCircle size={13} /> You save {formatPrice(bundleSavings)} on this complete look!
              </p>
            )}

            <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
              Includes {selectedProducts.length}{" "}
              {selectedProducts.length === 1 ? "design" : "coordinated furniture pieces"}{" "}
              with free white-glove doorstep delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            disabled={selectedProducts.length === 0}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: "var(--color-accent)",
              color: "#ffffff",
            }}
          >
            {addedAnimation ? (
              <>
                <FiCheck size={18} /> All {selectedProducts.length} Added to Cart!
              </>
            ) : (
              <>
                <FiShoppingCart size={18} /> Add All {selectedProducts.length} to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
