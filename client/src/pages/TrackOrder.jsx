import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiCheck, FiPackage, FiTruck, FiHome, FiClock, FiArrowLeft } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getOrderById } from "../services/orderService";

const STATUS_STEPS = [
  { key: "Placed", label: "Order Placed", description: "Design order received & being prepared", icon: FiClock },
  { key: "Confirmed", label: "Artisan Quality Check", description: "Handcrafted inspection & packaging complete", icon: FiPackage },
  { key: "Shipped", label: "White-Glove Dispatch", description: "In transit with specialized furniture transport", icon: FiTruck },
  { key: "Delivered", label: "Delivered & Assembled", description: "Delivered to your room & assembled by carpenter", icon: FiHome },
];

function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load furniture order tracking details.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const getStepStatus = (stepKey) => {
    if (!order) return "pending";
    const statusOrder = ["Placed", "Confirmed", "Shipped", "Delivered"];
    const currentIdx = statusOrder.indexOf(order.status || "Placed");
    const stepIdx = statusOrder.indexOf(stepKey);

    if (order.status === "Cancelled") return "cancelled";
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <>
      <Helmet>
        <title>Track Furniture Order #{id?.slice(-8)} – Furniva</title>
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1000px]">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition hover:opacity-75"
            style={{ color: "var(--color-accent)" }}
          >
            <FiArrowLeft size={16} /> Back to My Orders
          </Link>

          {loading ? (
            <div className="py-20 text-center text-lg" style={{ color: "var(--color-muted)" }}>
              Loading furniture tracking info...
            </div>
          ) : error ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--color-surface)", color: "var(--color-danger)" }}>
              {error}
            </div>
          ) : order ? (
            <div className="space-y-8">
              {/* Order summary header */}
              <div
                className="rounded-3xl p-6 sm:p-8 border shadow-sm"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Live Delivery Status</span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold mt-1">Order #{order._id}</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>Total Paid</p>
                    <p className="text-2xl font-black" style={{ color: "var(--color-accent)" }}>₹{order.totalAmount?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* Status Timeline Card */}
              <div
                className="rounded-3xl p-6 sm:p-10 border shadow-sm"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h2 className="text-xl font-serif font-bold mb-8">Delivery & Assembly Progress</h2>

                <div className="relative">
                  {/* Timeline Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {STATUS_STEPS.map((step) => {
                      const state = getStepStatus(step.key);
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3 z-10 relative">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold transition-all shadow-sm ${
                              state === "completed"
                                ? "bg-emerald-600 text-white"
                                : state === "active"
                                ? "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent-light)]"
                                : "bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                            }`}
                          >
                            {state === "completed" ? <FiCheck size={22} /> : <Icon size={22} />}
                          </div>

                          <div>
                            <h3 className={`text-base font-bold ${state === "pending" ? "text-[var(--color-muted)]" : "text-[var(--color-heading)]"}`}>
                              {step.label}
                            </h3>
                            <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Items & Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping Details */}
                <div
                  className="rounded-3xl p-6 border"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <h3 className="font-serif font-bold text-lg mb-4">Delivery Destination</h3>
                  <div className="text-sm space-y-1" style={{ color: "var(--color-body)" }}>
                    <p className="font-bold text-[var(--color-heading)]">{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    <p className="pt-2 text-xs" style={{ color: "var(--color-muted)" }}>Contact: {order.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Items Summary */}
                <div
                  className="rounded-3xl p-6 border"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <h3 className="font-serif font-bold text-lg mb-4">Furniture Items</h3>
                  <div className="space-y-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs" style={{ color: "var(--color-muted)" }}>Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default TrackOrder;
