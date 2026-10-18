import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiCheck, FiX, FiRefreshCw, FiTruck, FiDollarSign, FiPackage, FiClock } from "react-icons/fi";
import { getAdminOrders, updateOrderStatus, toggleOrderPayment } from "../../services/adminService";

const formatPrice = (val) => `₹${val?.toLocaleString("en-IN") || 0}`;

const STATUS_LIST = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Edit tracking inside modal
  const [courierInput, setCourierInput] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [statusCommentInput, setStatusCommentInput] = useState("");
  const [isSavingTracking, setIsSavingTracking] = useState(false);

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

  useEffect(() => {
    if (selectedOrder) {
      setCourierInput(selectedOrder.courier || "");
      setTrackingNumberInput(selectedOrder.trackingNumber || "");
      setStatusCommentInput("");
    }
  }, [selectedOrder]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const updated = await updateOrderStatus(orderId, { status: newStatus });
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

  const handleSaveTrackingInfo = async (orderId) => {
    try {
      setIsSavingTracking(true);
      const updated = await updateOrderStatus(orderId, {
        courier: courierInput.trim() || null,
        trackingNumber: trackingNumberInput.trim() || null,
        comment: statusCommentInput.trim() || undefined,
      });
      setOrders((prev) => prev.map((o) => ((o._id || o.id) === orderId ? updated : o)));
      setSelectedOrder(updated);
      alert("Tracking information updated successfully!");
    } catch (err) {
      alert("Failed to save tracking information.");
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleTogglePayment = async (orderOrId) => {
    const order =
      typeof orderOrId === "object" && orderOrId !== null
        ? orderOrId
        : orders.find((o) => (o._id || o.id) === orderOrId) || selectedOrder;

    const orderId = order ? (order._id || order.id) : orderOrId;
    let reason = "";

    if (order?.paymentMethod === "ONLINE") {
      const inputReason = window.prompt(
        "This order was placed via ONLINE payment (Razorpay). Please provide a reason for manually overriding payment status:"
      );
      if (inputReason === null) {
        return;
      }
      if (!inputReason.trim()) {
        alert("A reason is required to manually override online payment verification.");
        return;
      }
      reason = inputReason.trim();
    }

    try {
      setUpdatingId(orderId);
      const updated = await toggleOrderPayment(orderId, reason);
      setOrders((prev) => prev.map((o) => ((o._id || o.id) === orderId ? updated : o)));
      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change payment status.");
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
          Track customer shipments, update 6-stage delivery progress, assign couriers, and manage payments.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl p-8 text-center border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <p style={{ color: "var(--color-muted)" }}>No customer orders placed yet.</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  className="border-b text-xs uppercase tracking-wider"
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
                          className="text-xs font-bold rounded-lg border px-2 py-1 outline-none cursor-pointer"
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
                          {STATUS_LIST.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Payment switch button */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleTogglePayment(o)}
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
                          title="View and update shipment tracking details"
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
          <div className="modal-content p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close modal">
              <FiX />
            </button>

            <h3 className="text-xl font-bold mb-1">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
            <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
              Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
            </p>

            <div className="space-y-6">
              {/* Courier & Tracking Assignment */}
              <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3 flex items-center gap-1.5">
                  <FiTruck /> Courier & Tracking Assignment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-muted)]">Courier Partner</label>
                    <input
                      type="text"
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      placeholder="e.g. Furniva Logistics / BlueDart"
                      className="mt-1 w-full rounded-xl px-3 py-1.5 text-xs outline-none border border-[var(--color-border)]"
                      style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--color-muted)]">Tracking Number (AWB)</label>
                    <input
                      type="text"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      placeholder="e.g. FNV-84729103"
                      className="mt-1 w-full rounded-xl px-3 py-1.5 text-xs outline-none border border-[var(--color-border)]"
                      style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveTrackingInfo(selectedOrder._id)}
                  disabled={isSavingTracking}
                  className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition"
                  style={{ background: "var(--color-accent)" }}
                >
                  {isSavingTracking ? "Saving..." : "Update Tracking Info"}
                </button>
              </div>

              {/* Status Change Selector */}
              <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
                  Update Delivery Milestone
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="flex-1 rounded-xl p-2 text-xs font-bold border border-[var(--color-border)]"
                    style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
                  >
                    {STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shipping address details */}
              <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
                  <FiTruck /> Shipping Information
                </h4>
                <div className="text-xs space-y-1" style={{ color: "var(--color-body)" }}>
                  <p className="font-bold text-[var(--color-heading)]">{selectedOrder.shippingAddress?.fullName}</p>
                  <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                  {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                  </p>
                  <p className="pt-1 font-semibold">Phone: {selectedOrder.shippingAddress?.phone}</p>
                </div>
              </div>

              {/* Items listing */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">Items Purchased</h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedOrder.items?.map((item, idx) => (
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
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                  <span>Total Amount</span>
                  <span style={{ color: "var(--color-accent)" }}>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Quick actions inside modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleTogglePayment(selectedOrder)}
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
