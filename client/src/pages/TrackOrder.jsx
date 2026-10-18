import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiPackage,
  FiTruck,
  FiHome,
  FiClock,
  FiArrowLeft,
  FiShield,
  FiCopy,
  FiMapPin,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
  FiNavigation,
  FiPhone,
  FiCalendar,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getOrderById } from "../services/orderService";
import { getReturnByOrderId } from "../services/returnService";
import CancelOrderModal from "../components/returns/CancelOrderModal";
import ReturnRequestModal from "../components/returns/ReturnRequestModal";
import ReturnStatusCard from "../components/returns/ReturnStatusCard";

const TIMELINE_STEPS = [
  {
    key: "Placed",
    label: "Order Placed",
    description: "Order verified & payment acknowledged",
    icon: FiClock,
  },
  {
    key: "Confirmed",
    label: "Confirmed",
    description: "Craftsmanship verified & scheduled",
    icon: FiCheckCircle,
  },
  {
    key: "Packed",
    label: "Packed",
    description: "Protective white-glove packaging ready",
    icon: FiBox,
  },
  {
    key: "Shipped",
    label: "Shipped",
    description: "In transit with specialized furniture transport",
    icon: FiTruck,
  },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    description: "Courier executive out for final-mile delivery",
    icon: FiNavigation,
  },
  {
    key: "Delivered",
    label: "Delivered",
    description: "Delivered & assembled by certified carpenter",
    icon: FiHome,
  },
];

const STATUS_ORDER = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderData, returnRes] = await Promise.all([
        getOrderById(id),
        getReturnByOrderId(id).catch(() => ({ data: null })),
      ]);
      setOrder(orderData);
      setReturnData(returnRes?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order tracking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const currentStatusIndex = order ? STATUS_ORDER.indexOf(order.status || "Placed") : 0;
  const isCancelled = order?.status === "Cancelled";

  const getStepState = (stepKey) => {
    if (!order) return "pending";
    if (isCancelled) return "cancelled";

    const stepIndex = STATUS_ORDER.indexOf(stepKey);
    if (stepIndex < currentStatusIndex) return "completed";
    if (stepIndex === currentStatusIndex) return "active";
    return "pending";
  };

  const getStepTimestamp = (stepKey) => {
    if (!order) return null;

    // 1. Look in statusHistory array from DB
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const historyEntry = order.statusHistory.find((h) => h.status === stepKey);
      if (historyEntry && historyEntry.timestamp) {
        return new Date(historyEntry.timestamp);
      }
    }

    // 2. Fallbacks for standard database timestamps without faking
    if (stepKey === "Placed" && order.createdAt) {
      return new Date(order.createdAt);
    }
    if (stepKey === "Delivered" && order.status === "Delivered" && order.updatedAt) {
      return new Date(order.updatedAt);
    }

    return null;
  };

  const handleCopyTracking = (trackingNum) => {
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 3000);
  };

  const formattedExpectedDelivery = () => {
    if (!order) return "";
    if (order.status === "Delivered") {
      const delDate = getStepTimestamp("Delivered") || new Date(order.updatedAt);
      return `Delivered on ${delDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }
    if (order.expectedDelivery) {
      return new Date(order.expectedDelivery).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    // Default estimated window 4 days from creation
    const fallback = new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000);
    return fallback.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <SEO
        title="Track Order | Furniva"
        description="Real-time order shipment tracking."
        noIndex={true}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1100px]">
          {/* Back Navigation */}
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition hover:text-[var(--color-accent)]"
            style={{ color: "var(--color-muted)" }}
          >
            <FiArrowLeft size={16} /> Back to My Orders
          </Link>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 rounded-3xl bg-gray-200 dark:bg-gray-800" />
              <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ) : error ? (
            <div
              className="rounded-3xl p-10 text-center border shadow-sm max-w-lg mx-auto"
              style={{
                background: "var(--color-surface)",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <FiAlertCircle size={40} className="mx-auto text-red-500 mb-3" />
              <h2 className="text-xl font-bold font-serif">Order Tracking Unavailable</h2>
              <p className="mt-2 text-xs text-[var(--color-muted)]">{error}</p>
              <Link
                to="/orders"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-md"
                style={{ background: "var(--color-accent)" }}
              >
                View All Orders
              </Link>
            </div>
          ) : order ? (
            <div className="space-y-8">
              {/* Order Details Header Card */}
              <div
                className="rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isCancelled
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : order.status === "Delivered"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                        {order.status}
                      </span>

                      {order.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                          <FiCheck size={12} /> Paid Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600">
                          Cash on Delivery (COD)
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h1>

                    <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--color-muted)" }}>
                      <span className="flex items-center gap-1">
                        <FiCalendar size={13} /> Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Expected Delivery & Total */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 gap-2" style={{ borderColor: "var(--color-border)" }}>
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                        {order.status === "Delivered" ? "Delivery Completed" : "Expected Delivery"}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formattedExpectedDelivery()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>Order Total</p>
                      <p className="text-xl sm:text-2xl font-black" style={{ color: "var(--color-accent)" }}>
                        ₹{order.totalAmount?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional Courier & Tracking Number Strip */}
                {(order.courier || order.trackingNumber) && (
                  <div
                    className="mt-6 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-accent)]">
                        <FiTruck size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-heading)]">
                          Courier Partner: <span className="font-bold">{order.courier || "Furniva White-Glove Fleet"}</span>
                        </p>
                        {order.trackingNumber && (
                          <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                            Tracking ID: <span className="font-mono font-bold text-[var(--color-heading)]">{order.trackingNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <button
                        onClick={() => handleCopyTracking(order.trackingNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)] self-start sm:self-auto"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                      >
                        <FiCopy size={13} />
                        {copiedTracking ? "Copied!" : "Copy Tracking ID"}
                      </button>
                    )}
                  </div>
                )}

                {/* Customer Action Strip: Cancel or Return */}
                <div
                  className="mt-6 pt-5 border-t flex flex-wrap items-center justify-between gap-3"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {["Placed", "Confirmed", "Packed"].includes(order.status) && (
                      <span>Need to cancel or change your order? You can cancel prior to dispatch.</span>
                    )}
                    {order.status === "Delivered" && !returnData && (
                      <span>Item delivered not as expected? Request a return or replacement within 7 days.</span>
                    )}
                    {order.status === "Delivered" && returnData && (
                      <span className="font-semibold text-[var(--color-heading)]">A return request is currently active for this delivery.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {["Placed", "Confirmed", "Packed"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                      >
                        <FiAlertCircle size={14} /> Cancel Order
                      </button>
                    )}

                    {order.status === "Delivered" && !returnData && (
                      <button
                        type="button"
                        onClick={() => setIsReturnModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-1.5"
                        style={{ background: "var(--color-accent)" }}
                      >
                        <FiTruck size={14} /> Request Return / Replacement
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Return Status Card */}
              {returnData && (
                <ReturnStatusCard returnData={returnData} />
              )}

              {/* Cancellation Banner if Cancelled */}
              {isCancelled && (
                <div
                  className="rounded-3xl p-6 border flex items-center gap-4 text-sm"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    borderColor: "rgba(239, 68, 68, 0.25)",
                    color: "var(--color-danger)",
                  }}
                >
                  <FiAlertCircle size={24} className="shrink-0" />
                  <div>
                    <h3 className="font-bold font-serif text-base">This Order was Cancelled</h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      If you made an online payment, a full refund will be processed to your original payment method within 5–7 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Visual Order Timeline */}
              {!isCancelled && (
                <div
                  className="rounded-3xl p-6 sm:p-10 border shadow-sm"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-serif font-bold tracking-tight">Shipment & Assembly Timeline</h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        Real-time status updates recorded directly by our warehouse and logistics team.
                      </p>
                    </div>
                  </div>

                  {/* Desktop Horizontal Stepper */}
                  <div className="hidden lg:block relative py-4">
                    {/* Background track */}
                    <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full z-0">
                      {/* Active progress fill */}
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          background: "linear-gradient(90deg, #10B981 0%, var(--color-accent) 100%)",
                          width: `${(Math.max(0, currentStatusIndex) / (STATUS_ORDER.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-6 gap-2 relative z-10">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const state = getStepState(step.key);
                        const StepIcon = step.icon;
                        const timestamp = getStepTimestamp(step.key);

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold shadow-md transition-all ${
                                state === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : state === "active"
                                  ? "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/20 scale-110"
                                  : "border text-[var(--color-muted)]"
                              }`}
                              style={{
                                background:
                                  state === "completed"
                                    ? "#10B981"
                                    : state === "active"
                                    ? "var(--color-accent)"
                                    : "var(--color-surface-alt)",
                                borderColor: state === "pending" ? "var(--color-border)" : "transparent",
                              }}
                            >
                              {state === "completed" ? <FiCheck size={20} /> : <StepIcon size={18} />}
                            </div>

                            <h3
                              className={`mt-3 text-xs font-bold leading-tight ${
                                state === "active"
                                  ? "text-[var(--color-accent)]"
                                  : state === "completed"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-[var(--color-muted)]"
                              }`}
                            >
                              {step.label}
                            </h3>

                            {timestamp ? (
                              <p className="mt-1 text-[10px] font-semibold text-[var(--color-body)]">
                                {timestamp.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                                <br />
                                <span style={{ color: "var(--color-muted)" }}>
                                  {timestamp.toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                {state === "pending" ? "Pending" : "In Progress"}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile & Tablet Vertical Timeline */}
                  <div className="lg:hidden space-y-6 relative pl-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const state = getStepState(step.key);
                      const StepIcon = step.icon;
                      const timestamp = getStepTimestamp(step.key);

                      return (
                        <div key={step.key} className="relative flex items-start gap-4">
                          {/* Dot / Icon */}
                          <div
                            className={`-ml-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm transition-all z-10 ${
                              state === "completed"
                                ? "bg-emerald-500 text-white"
                                : state === "active"
                                ? "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/20"
                                : "border text-[var(--color-muted)]"
                            }`}
                            style={{
                              background:
                                state === "completed"
                                  ? "#10B981"
                                  : state === "active"
                                  ? "var(--color-accent)"
                                  : "var(--color-surface-alt)",
                              borderColor: state === "pending" ? "var(--color-border)" : "transparent",
                            }}
                          >
                            {state === "completed" ? <FiCheck size={14} /> : <StepIcon size={14} />}
                          </div>

                          <div className="flex-1 rounded-2xl p-4 border" style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}>
                            <div className="flex items-center justify-between">
                              <h3
                                className={`text-sm font-bold ${
                                  state === "active"
                                    ? "text-[var(--color-accent)]"
                                    : state === "completed"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-[var(--color-heading)]"
                                }`}
                              >
                                {step.label}
                              </h3>

                              {timestamp && (
                                <span className="text-[10px] font-semibold text-[var(--color-muted)]">
                                  {timestamp.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                                  {timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--color-muted)] mt-1">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Address & Product Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Delivery Address Card */}
                <div
                  className="rounded-3xl p-6 sm:p-8 border space-y-4"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    <FiMapPin size={15} /> Delivery Destination
                  </div>

                  <div className="text-xs sm:text-sm space-y-1.5" style={{ color: "var(--color-body)" }}>
                    <p className="font-bold text-base text-[var(--color-heading)] font-serif">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p className="flex items-center gap-1.5 font-semibold text-[var(--color-muted)]">
                      <FiPhone size={13} /> +91 {order.shippingAddress?.phone}
                    </p>
                    <div
                      className="mt-3 p-3 rounded-2xl border text-xs leading-relaxed"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <p>{order.shippingAddress?.addressLine1}</p>
                      {order.shippingAddress?.addressLine2 && <p className="mt-0.5">{order.shippingAddress.addressLine2}</p>}
                      <p className="mt-1 font-semibold text-[var(--color-heading)]">
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                      Payment Verification
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--color-heading)]">
                        {order.paymentMethod === "ONLINE" ? "Razorpay Online Payment" : "Cash on Delivery (COD)"}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          order.isPaid
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {order.isPaid ? "Paid in Full" : "Payment Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Products Summary Card */}
                <div
                  className="rounded-3xl p-6 sm:p-8 border space-y-4"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                      <FiPackage size={15} /> Furniture Items ({order.items?.length || 0})
                    </div>
                  </div>

                  <div className="divide-y max-h-72 overflow-y-auto pr-1" style={{ borderColor: "var(--color-border)" }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-sm text-[var(--color-heading)] truncate">{item.name}</p>
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                            ₹{item.price?.toLocaleString("en-IN")} × {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-[var(--color-heading)] shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div
                    className="pt-3 border-t space-y-1.5 text-xs"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                  >
                    <div className="flex justify-between">
                      <span>Furniture Total</span>
                      <span className="font-semibold text-[var(--color-heading)]">
                        ₹{order.itemsTotal?.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                        <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                        <span>-₹{order.discountAmount?.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>White-Glove Delivery & Assembly</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                      </span>
                    </div>

                    <div
                      className="border-t pt-2 mt-2 flex justify-between items-center text-sm font-bold"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                    >
                      <span>Final Total Paid</span>
                      <span className="text-base font-extrabold" style={{ color: "var(--color-accent)" }}>
                        ₹{order.totalAmount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Need Assistance CTA */}
              <div
                className="rounded-3xl p-6 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div>
                  <h3 className="font-serif font-bold text-sm">Need help with your scheduled delivery or assembly?</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Our dedicated concierge team is available 7 days a week from 9 AM to 8 PM.
                  </p>
                </div>
                <Link
                  to="/support"
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)] self-start sm:self-auto shrink-0"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                >
                  Contact Concierge
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Cancel Order Modal */}
      {order && (
        <CancelOrderModal
          order={order}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={fetchOrderDetails}
        />
      )}

      {/* Return Request Modal */}
      {order && (
        <ReturnRequestModal
          order={order}
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={fetchOrderDetails}
        />
      )}

      <Footer />
    </>
  );
}

export default TrackOrder;
