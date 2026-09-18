import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FiTruck, FiPackage } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getMyOrders } from "../services/orderService";

const statusColors = {
  Placed: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  Confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  Shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  Cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const statusLabels = {
  Placed: "Order Placed",
  Confirmed: "Preparing Your Furniture",
  Shipped: "Shipped / Out for Delivery",
  Delivered: "Delivered & Assembled",
  Cancelled: "Cancelled",
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getMyOrders();
        setOrders(response);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <Helmet>
        <title>My Furniture Orders – Furniva</title>
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-14"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              My Account
            </p>
            <h1 className="mt-2 text-4xl font-serif font-bold tracking-tight">Order History</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              View and track all your past and active furniture deliveries
            </p>
          </div>

          {loading ? (
            <div
              className="rounded-3xl p-12 text-center text-lg"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-muted)",
              }}
            >
              Loading your furniture orders...
            </div>
          ) : error ? (
            <div
              className="rounded-3xl p-12 text-center text-lg"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <p className="text-2xl font-serif font-bold">You haven't placed any furniture orders yet.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                Explore our curated living room, bedroom, and dining collections to place your first order.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-xl px-6 py-3 font-semibold text-sm transition"
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                }}
              >
                Shop Furniture
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-3xl p-6 border transition hover:border-[var(--color-accent)] shadow-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>
                        Order ID: {order._id}
                      </p>
                      <p className="mt-1 text-lg font-serif font-bold">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider ${statusColors[order.status] || "bg-gray-500/10"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>

                      <Link
                        to={`/orders/${order._id}/track`}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <FiTruck size={14} /> Track Delivery
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-2" style={{ color: "var(--color-muted)" }}>
                      <FiPackage />
                      <span>{order.items?.length || 0} furniture item(s)</span>
                    </div>

                    <p className="font-extrabold text-lg" style={{ color: "var(--color-heading)" }}>
                      Total: ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Orders;
