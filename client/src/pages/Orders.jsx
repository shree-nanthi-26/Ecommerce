import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import {
  FiTruck,
  FiPackage,
  FiXCircle,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getMyOrders } from "../services/orderService";
import { getMyReturns } from "../services/returnService";
import CancelOrderModal from "../components/returns/CancelOrderModal";
import ReturnRequestModal from "../components/returns/ReturnRequestModal";

const statusColors = {
  Placed: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  Confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  Packed: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
  Shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  "Out for Delivery": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  Cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const returnStatusColors = {
  Requested: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Under Review": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Pickup Scheduled": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Returned: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Refund Initiated": "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const statusLabels = {
  Placed: "Order Placed",
  Confirmed: "Confirmed",
  Packed: "Packed",
  Shipped: "Shipped",
  "Out for Delivery": "Out for Delivery",
  Delivered: "Delivered & Assembled",
  Cancelled: "Cancelled",
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [returnsMap, setReturnsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, returnsRes] = await Promise.all([
        getMyOrders(),
        getMyReturns().catch(() => ({ data: [] })),
      ]);

      setOrders(ordersRes || []);

      const rMap = {};
      if (returnsRes && Array.isArray(returnsRes.data)) {
        returnsRes.data.forEach((ret) => {
          const ordId = ret.order?._id || ret.order;
          if (ordId) {
            rMap[ordId.toString()] = ret;
          }
        });
      }
      setReturnsMap(rMap);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isCancellable = (status) => ["Placed", "Confirmed", "Packed"].includes(status);

  return (
    <>
      <SEO
        title="My Furniture Orders | Furniva"
        description="Track your furniture delivery and past purchases."
        canonicalUrl="/orders"
        noIndex={true}
      />

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
              View, track deliveries, cancel orders, or request returns for your furniture pieces
            </p>
          </div>

          {loading ? (
            <div
              className="rounded-3xl p-12 text-center text-lg animate-pulse"
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
              {orders.map((order) => {
                const existingReturn = returnsMap[order._id?.toString()];

                return (
                  <div
                    key={order._id}
                    className="rounded-3xl p-6 sm:p-7 border transition hover:border-[var(--color-accent)] shadow-sm"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>
                            Order ID: #{order._id?.slice(-8).toUpperCase()}
                          </p>

                          {existingReturn && (
                            <span
                              className={`rounded-full px-3 py-0.5 text-[11px] font-bold border ${
                                returnStatusColors[existingReturn.status] || "bg-gray-500/10"
                              }`}
                            >
                              Return: {existingReturn.status}
                            </span>
                          )}
                        </div>

                        <p className="text-lg font-serif font-bold">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>

                        {order.status === "Cancelled" && order.cancellationReason && (
                          <p className="mt-1 text-xs text-rose-500">
                            Reason: {order.cancellationReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider ${
                            statusColors[order.status] || "bg-gray-500/10"
                          }`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>

                        {/* Cancel Order Action */}
                        {isCancellable(order.status) && (
                          <button
                            type="button"
                            onClick={() => setCancelModalOrder(order)}
                            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border text-rose-500 border-rose-500/30 hover:bg-rose-500/10 transition"
                          >
                            <FiXCircle size={14} /> Cancel Order
                          </button>
                        )}

                        {/* Request Return Action */}
                        {order.status === "Delivered" && !existingReturn && (
                          <button
                            type="button"
                            onClick={() => setReturnModalOrder(order)}
                            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition"
                          >
                            <FiRefreshCw size={14} /> Request Return
                          </button>
                        )}

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

                    <div
                      className="mt-6 pt-4 border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <div className="flex items-center gap-2" style={{ color: "var(--color-muted)" }}>
                        <FiPackage />
                        <span>
                          {order.items?.length || 0} furniture item
                          {order.items?.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="font-extrabold text-lg" style={{ color: "var(--color-heading)" }}>
                        Total: ₹{order.totalAmount?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cancellation Modal */}
      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          isOpen={Boolean(cancelModalOrder)}
          onClose={() => setCancelModalOrder(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Return Request Modal */}
      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          isOpen={Boolean(returnModalOrder)}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={fetchData}
        />
      )}

      <Footer />
    </>
  );
}

export default Orders;
