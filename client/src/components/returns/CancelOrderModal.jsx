import { useState } from "react";
import { FiX, FiAlertTriangle, FiAlertCircle } from "react-icons/fi";
import { cancelOrder } from "../../services/orderService";

const CANCELLATION_REASONS = [
  "Found a better price / alternative elsewhere",
  "Ordered by mistake / duplicate order",
  "Delivery timeframe is too long",
  "Need to change delivery address or contact number",
  "Changed my mind",
  "Other reason",
];

function CancelOrderModal({ order, isOpen, onClose, onSuccess }) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const finalReason =
      selectedReason === "Other reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    try {
      setSubmitting(true);
      await cancelOrder(order._id, finalReason);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl relative"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-heading)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
          style={{ color: "var(--color-muted)" }}
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Cancel Furniture Order</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Order #{order._id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Notice */}
        <div
          className="mt-5 p-4 rounded-2xl border text-xs leading-relaxed"
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            borderColor: "rgba(239, 68, 68, 0.2)",
            color: "var(--color-muted)",
          }}
        >
          <p className="font-semibold text-[var(--color-heading)]">
            Are you sure you want to cancel this order?
          </p>
          <p className="mt-1">
            If you paid online via Razorpay, your refund of{" "}
            <span className="font-bold text-[var(--color-heading)]">
              ₹{order.totalAmount?.toLocaleString("en-IN")}
            </span>{" "}
            will be refunded to your original payment method in 5-7 working days.
          </p>
        </div>

        {error && (
          <div
            className="mt-4 p-3 rounded-xl border text-xs flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
            }}
          >
            <FiAlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Select Reason for Cancellation
            </label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-medium transition ${
                    selectedReason === r
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/20"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "Other reason" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Please describe your reason
              </label>
              <textarea
                rows={3}
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why you wish to cancel..."
                className="w-full rounded-2xl p-3 text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-heading)",
                }}
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              Nevermind
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition disabled:opacity-50"
              style={{ background: "#EF4444" }}
            >
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelOrderModal;
