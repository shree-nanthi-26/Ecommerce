import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiCheck, FiX, FiRefreshCw, FiTruck, FiDollarSign } from "react-icons/fi";
import { getAdminOrders, updateOrderStatus, toggleOrderPayment } from "../../services/adminService";

const formatPrice = (val) => `₹${val?.toLocaleString("en-IN") || 0}`;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await getAdminOrders();
        setOrders(data);
      } catch (err) {
        setError("Failed to load orders list.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => ((o._id || o.id) === orderId ? updated : o)));
      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePayment = async (orderId) => {
    try {
      setUpdatingId(orderId);
      const updated = await toggleOrderPayment(orderId);
      setOrders((prev) => prev.map((o) => ((o._id || o.id) === orderId ? updated : o)));
      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert("Failed to change payment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading customer orders…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold">Orders Management</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Track customer shipments, process status updates, and update payment verification records
        </p>
      </div>

      {error ? (
        <div className="text-rose-500 text-center py-10">{error}</div>
      ) : orders.length === 0 ? (
        <div
          className="rounded-3xl p-16 text-center border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2 className="text-xl font-bold">No Orders Found</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            Transactions will appear here once customers place orders.
          </p>
        </div>
      ) : (
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr
                  className="border-b text-xs font-bold uppercase tracking-wider"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-muted)",
                    background: "var(--color-surface-alt)",
                  }}
                >
                  <th className="py-4 px-6 font-semibold">Order ID</th>
                  <th className="py-4 px-6 font-semibold">Customer</th>
                  <th className="py-4 px-6 font-semibold">Date</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold">Payment</th>
                  <th className="py-4 px-6 font-semibold text-right">Total</th>
                  <th className="py-4 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {orders.map((o) => {
                  const ordId = o._id || o.id;
                  const isUpdating = updatingId === ordId;

                  return (
                    <tr key={ordId} className="hover:bg-[var(--color-surface-alt)] transition">
                      {/* Order ID */}
                      <td className="py-4 px-6 font-mono font-bold text-xs">
                        #{ordId.slice(-8).toUpperCase()}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-xs">{o.user?.name || "Deleted User"}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{o.user?.email}</p>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-[var(--color-body)] text-xs">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status select */}
                      <td className="py-4 px-6">
                        <select
                          value={o.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(ordId, e.target.value)}
                          className="text-xs font-bold rounded-lg border px-2 py-1 outline-none"
                          style={{
                            background: "var(--color-surface-alt)",
                            borderColor: "var(--color-border)",
                            color:
                              o.status === "Delivered"
                                ? "var(--color-success)"
                                : o.status === "Cancelled"
                                ? "var(--color-danger)"
                                : "var(--color-primary-light)",
                          }}
                        >
                          {["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Payment switch button */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleTogglePayment(ordId)}
                          disabled={isUpdating}
                          className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                            o.isPaid
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          }`}
                          title="Toggle payment verification"
                        >
                          {o.isPaid ? <FiCheck /> : <FiX />}
                          <span>{o.isPaid ? "Paid" : "Unpaid"}</span>
                        </button>
                      </td>

                      {/* Total price */}
                      <td className="py-4 px-6 text-right font-bold">{formatPrice(o.totalAmount)}</td>

                      {/* Details button */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-2 rounded-lg transition hover:bg-[var(--color-surface-hover)]"
                          style={{ color: "var(--color-accent)" }}
                          title="View order summary details"
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Dialog Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content p-6 sm:p-8 max-w-lg w-full">
            <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close modal">
              <FiX />
            </button>

            <h3 className="text-xl font-bold mb-4">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
            <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
              Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
            </p>

            <div className="space-y-6">
              {/* Shipping address details */}
              <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
                  <FiTruck /> Shipping Information
                </h4>
                <div className="text-xs space-y-1" style={{ color: "var(--color-body)" }}>
                  <p className="font-bold text-[var(--color-heading)]">{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                  </p>
                  <p className="pt-1 font-semibold">Phone: {selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Items listing */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Items Purchased</h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p style={{ color: "var(--color-muted)" }}>{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <p className="font-bold flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown summary */}
              <div className="border-t pt-4 space-y-2 text-xs" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-muted)" }}>Subtotal</span>
                  <span>{formatPrice(selectedOrder.itemsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-muted)" }}>Delivery Fee</span>
                  <span>{selectedOrder.deliveryFee === 0 ? "Free" : formatPrice(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                  <span>Total Amount</span>
                  <span style={{ color: "var(--color-accent)" }}>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Quick actions inside modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleTogglePayment(selectedOrder._id || selectedOrder.id)}
                  className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <FiDollarSign />
                  <span>Toggle Payment ({selectedOrder.isPaid ? "Unpay" : "Verify Pay"})</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                  }}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
