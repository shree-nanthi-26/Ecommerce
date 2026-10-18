import { useState, useEffect } from "react";
import {
  FiMapPin,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { checkProductDelivery } from "../../services/productService";

const SAVED_PINCODE_KEY = "furniva_user_pincode";

function DeliveryChecker({ product }) {
  const [pincode, setPincode] = useState(() => {
    return localStorage.getItem(SAVED_PINCODE_KEY) || "";
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Auto-check if previously saved pincode exists
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PINCODE_KEY);
    if (saved && /^[1-9][0-9]{5}$/.test(saved)) {
      handleCheck(saved);
    }
  }, [product?._id]);

  const handleCheck = async (pinToCheck) => {
    const targetPin = (pinToCheck || pincode).trim();
    setError("");

    if (!targetPin) {
      setError("Please enter a 6-digit Indian PIN code");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(targetPin)) {
      setError("Please enter a valid 6-digit Indian postal code (e.g. 560001, 110001)");
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      const data = await checkProductDelivery(product?._id, targetPin);
      setResult(data);
      localStorage.setItem(SAVED_PINCODE_KEY, targetPin);
    } catch (err) {
      setError(err.response?.data?.message || "Delivery check unavailable. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheck(pincode);
  };

  return (
    <div
      className="p-5 rounded-2xl border space-y-4 text-xs"
      style={{
        background: "var(--color-surface-alt)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-heading)]">
          <FiMapPin className="text-[var(--color-accent)]" size={16} />
          <span>Delivery & Assembly Availability</span>
        </div>
        {result?.serviceable && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <FiCheckCircle size={13} /> Serviceable
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPincode(val);
              if (error) setError("");
            }}
            placeholder="Enter 6-digit PIN code (e.g. 560001)"
            className="w-full pl-3.5 pr-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !pincode}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}
        >
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      {error && <p className="text-rose-500 font-semibold">{error}</p>}

      {/* Result Card */}
      {result && result.serviceable && (
        <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          {/* Estimated Date */}
          <div className="flex items-start gap-2 text-[var(--color-heading)]">
            <FiTruck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Estimated Delivery: <span className="text-emerald-600 dark:text-emerald-400">{result.estimatedDeliveryRange}</span>
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                {result.estimatedDaysText} • {result.region}
              </p>
            </div>
          </div>

          {/* Shipping Fee */}
          <div className="flex items-center gap-2">
            <FiDollarSign size={15} className="text-[var(--color-accent)] shrink-0" />
            <span className="font-bold text-[var(--color-heading)]">
              Delivery Charge:{" "}
              {result.isFreeDelivery ? (
                <span className="text-emerald-600 font-extrabold uppercase">FREE</span>
              ) : (
                <span>₹{result.deliveryFee}</span>
              )}
            </span>
            {result.freeDeliveryThreshold && (
              <span className="text-[11px] text-[var(--color-muted)]">
                (Free on orders above ₹{result.freeDeliveryThreshold})
              </span>
            )}
          </div>

          {/* Value Adds */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-muted)] pt-1">
            {result.codAvailable && (
              <span className="flex items-center gap-1 font-semibold text-[var(--color-heading)]">
                <FiCheckCircle className="text-emerald-500" size={12} /> Cash on Delivery Available
              </span>
            )}
            {result.assemblyIncluded && (
              <span className="flex items-center gap-1 font-semibold text-[var(--color-heading)]">
                <FiShield className="text-blue-500" size={12} /> Free Carpenter Assembly
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryChecker;
