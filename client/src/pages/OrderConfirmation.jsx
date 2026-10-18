import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../components/common/SEO";
import { FiCheckCircle, FiTruck, FiArrowRight } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getOrderById } from "../services/orderService";

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrderById(id);
        setOrder(response);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <>
      <SEO
        title="Order Confirmed | Furniva"
        description="Your furniture purchase is confirmed."
        noIndex={true}
      />
      <Navbar />
      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-3xl">
          {loading ? (
            <div
              className="rounded-3xl p-12 text-center border"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              Loading your furniture order details...
            </div>
          ) : error ? (
            <div
              className="rounded-3xl p-12 text-center border"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          ) : (
            <div
              className="rounded-3xl p-8 sm:p-12 text-center border shadow-lg"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
                style={{ background: "var(--color-accent)" }}
              >
                <FiCheckCircle size={44} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                Order Confirmed!
              </h1>
              <p className="mt-3 text-base" style={{ color: "var(--color-muted)" }}>
                Thank you for choosing Furniva. Your handcrafted furniture order has been received and our master craftsmen are preparing it.
              </p>

              <div
                className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 rounded-2xl p-4 border text-sm"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div>
                  <span className="text-xs uppercase font-bold" style={{ color: "var(--color-muted)" }}>Order ID:</span>{" "}
                  <span className="font-mono font-bold" style={{ color: "var(--color-heading)" }}>{order._id}</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-[var(--color-border)]" />
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <FiTruck /> Estimated Delivery: 5–7 Business Days
                </div>
              </div>

              <div
                className="mt-8 rounded-2xl p-6 text-left border"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h2 className="text-xl font-serif font-bold">Furniture Summary</h2>
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.product} className="flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-muted)" }}>Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-4 text-sm space-y-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                    <span>Subtotal</span>
                    <span className="font-semibold" style={{ color: "var(--color-heading)" }}>₹{order.itemsTotal?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                    <span>White-Glove Delivery</span>
                    <span className="text-emerald-600 font-semibold">{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee?.toLocaleString("en-IN")}`}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-base font-bold" style={{ borderColor: "var(--color-border)" }}>
                    <span>Total Paid</span>
                    <span className="text-xl font-extrabold" style={{ color: "var(--color-accent)" }}>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={`/orders/${order._id}/track`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition"
                  style={{
                    background: "var(--color-accent)",
                    color: "#ffffff",
                  }}
                >
                  <FiTruck /> Track Furniture Order
                </Link>
                <Link
                  to="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm border transition hover:bg-[var(--color-surface-alt)]"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                >
                  Explore More Furniture <FiArrowRight />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default OrderConfirmation;
